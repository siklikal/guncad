#!/usr/bin/env node

/**
 * GunCAD → Meilisearch Sync Script
 *
 * Fetches all releases from the GCI API and pushes them to Meilisearch.
 * Designed to run on a schedule (twice daily) to keep the search index
 * in sync with GCI data — including updated thumbnails/URLs on old records.
 *
 * USAGE:
 *
 *   Full sync + push (recommended for scheduled runs):
 *     MEILISEARCH_URL=... MEILISEARCH_MASTER_KEY=... node scripts/sync-meilisearch.js --push
 *
 *   Full sync only (writes JSON file, no push):
 *     node scripts/sync-meilisearch.js
 *
 *   Update sync (only fetches new releases since last run):
 *     node scripts/sync-meilisearch.js --update
 *     NOTE: --update only catches NEW records. It won't pick up changes
 *     to existing records (updated thumbnails, URLs, etc). Use full sync
 *     for scheduled runs.
 *
 *   Resume a crashed run:
 *     node scripts/sync-meilisearch.js --offset 3000
 *
 * ALL OPTIONS:
 *   --push               Push records to Meilisearch after syncing
 *   --update             Only fetch new releases since last run
 *   --offset <number>    Start fetching from this offset (default: 0)
 *   --output <path>      Output file path (default: meilisearch-records.json)
 *   --help               Show this help message
 *
 * ENVIRONMENT VARIABLES (required for --push):
 *   MEILISEARCH_URL         Meilisearch instance URL
 *   MEILISEARCH_MASTER_KEY  Master/admin API key
 *
 * NOTES:
 *   - Meilisearch upserts by `id`, so re-running is always safe
 *   - GCI API max limit per request is 1000, we use 500 to avoid timeouts
 *   - 1-second delay between pages to avoid hammering the API
 *   - GCI's Cloudflare blocks datacenter IPs (GitHub Actions), so run
 *     this from a residential IP (your local machine)
 *   - The index name must match what the app queries (currently "releases")
 */

import fs from 'fs';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const GCI_API_BASE = 'https://guncadindex.com/api/v2/releases/';
const PAGE_SIZE = 500;
const DELAY_MS = 1000;
const DEFAULT_OUTPUT = 'meilisearch-records.json';

// ---------------------------------------------------------------------------
// Parse CLI args
// ---------------------------------------------------------------------------
function parseArgs() {
	const args = process.argv.slice(2);
	let offset = 0;
	let output = DEFAULT_OUTPUT;
	let update = false;
	let push = false;

	for (let i = 0; i < args.length; i++) {
		if (args[i] === '--push') {
			push = true;
		} else if (args[i] === '--offset' && args[i + 1]) {
			offset = parseInt(args[i + 1], 10);
			if (isNaN(offset) || offset < 0) {
				console.error('Error: --offset must be a non-negative integer');
				process.exit(1);
			}
			i++;
		} else if (args[i] === '--output' && args[i + 1]) {
			output = args[i + 1];
			i++;
		} else if (args[i] === '--update') {
			update = true;
		} else if (args[i] === '--help') {
			console.log(`
Usage: node scripts/sync-meilisearch.js [options]

Options:
  --update              Only fetch new releases since last run
  --push                Push records to Meilisearch after syncing
  --offset <number>     Start fetching from this offset (default: 0)
  --output <path>       Output file path (default: ${DEFAULT_OUTPUT})
  --help                Show this help message

Examples:
  node scripts/sync-meilisearch.js              # Full sync (first run)
  node scripts/sync-meilisearch.js --update     # Only fetch new stuff
  node scripts/sync-meilisearch.js --update --push  # Fetch new + push to Meilisearch
  node scripts/sync-meilisearch.js --offset 3000  # Resume crashed run
`);
			process.exit(0);
		}
	}

	return { offset, output, update, push };
}

// ---------------------------------------------------------------------------
// Load existing records from the output file (for --update mode)
// ---------------------------------------------------------------------------
function loadExistingRecords(filePath) {
	if (!fs.existsSync(filePath)) {
		return [];
	}
	try {
		const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
		if (!Array.isArray(data)) return [];
		return data;
	} catch {
		return [];
	}
}

// ---------------------------------------------------------------------------
// Transform a GCI release into an Meilisearch record
// ---------------------------------------------------------------------------
function transformRelease(release) {
	const model_name_slug = release.path?.split('/detail/')[1] || '';

	return {
		id: release.id,
		model_name: release.name || '',
		model_name_slug,
		model_thumbnail: release.thumbnail?.small || '',
		user: release.channel?.name || '',
		user_thumbnail: release.channel?.thumbnail?.small || ''
	};
}

// ---------------------------------------------------------------------------
// Fetch a single page from the GCI API
// ---------------------------------------------------------------------------
async function fetchPage(offset) {
	const url = `${GCI_API_BASE}?limit=${PAGE_SIZE}&offset=${offset}&sort=newest`;

	const response = await fetch(url, {
		headers: {
			Accept: 'application/json',
			'User-Agent': 'GunCAD-Sync/1.0'
		}
	});

	if (!response.ok) {
		throw new Error(`API returned ${response.status} at offset ${offset}`);
	}

	return response.json();
}

// ---------------------------------------------------------------------------
// Sleep helper
// ---------------------------------------------------------------------------
function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Full sync — fetch all records from scratch
// ---------------------------------------------------------------------------
async function fullSync(startOffset, output) {
	console.log(`Starting full sync from offset ${startOffset}...`);
	console.log(`Page size: ${PAGE_SIZE}`);
	console.log(`Output: ${output}\n`);

	const records = [];
	let offset = startOffset;
	let totalCount = null;

	while (true) {
		process.stdout.write(`Fetching offset ${offset}...`);

		const data = await fetchPage(offset);

		if (totalCount === null) {
			totalCount = data.count;
			console.log(` (${totalCount} total releases)`);
		} else {
			console.log();
		}

		if (!data.results || data.results.length === 0) {
			console.log('No more results. Done.');
			break;
		}

		for (const release of data.results) {
			records.push(transformRelease(release));
		}

		console.log(`  → Got ${data.results.length} releases (${records.length + startOffset} / ${totalCount} total)`);

		if (!data.next || offset + data.results.length >= totalCount) {
			console.log('All pages fetched. Done.');
			break;
		}

		offset += PAGE_SIZE;
		await sleep(DELAY_MS);
	}

	fs.writeFileSync(output, JSON.stringify(records, null, 2));
	console.log(`\nWrote ${records.length} records to ${output}`);
}

// ---------------------------------------------------------------------------
// Update sync — only fetch new records since last run
// ---------------------------------------------------------------------------
async function updateSync(output) {
	console.log('Starting update sync (fetching only new releases)...');
	console.log(`Output: ${output}\n`);

	// Load existing records and build a Set of known ids
	const existingRecords = loadExistingRecords(output);
	const existingIds = new Set(existingRecords.map((r) => r.id));

	if (existingRecords.length === 0) {
		console.log('No existing file found. Falling back to full sync.\n');
		return fullSync(0, output);
	}

	console.log(`Loaded ${existingRecords.length} existing records from ${output}`);

	const newRecords = [];
	let offset = 0;
	let hitExisting = false;

	while (!hitExisting) {
		process.stdout.write(`Fetching offset ${offset}...`);

		const data = await fetchPage(offset);
		console.log(` (${data.count} total on API)`);

		if (!data.results || data.results.length === 0) {
			console.log('No results. Done.');
			break;
		}

		for (const release of data.results) {
			if (existingIds.has(release.id)) {
				// We've reached records we already have — stop
				hitExisting = true;
				break;
			}
			newRecords.push(transformRelease(release));
		}

		if (hitExisting) {
			console.log(`  → Hit existing record. Stopping.`);
			break;
		}

		console.log(`  → Got ${data.results.length} new releases so far: ${newRecords.length}`);

		if (!data.next) {
			console.log('No more pages. Done.');
			break;
		}

		offset += PAGE_SIZE;
		await sleep(DELAY_MS);
	}

	if (newRecords.length === 0) {
		console.log('\nNo new releases found. File is up to date.');
		return;
	}

	// Prepend new records to existing ones
	const allRecords = [...newRecords, ...existingRecords];
	fs.writeFileSync(output, JSON.stringify(allRecords, null, 2));
	console.log(`\nFound ${newRecords.length} new releases.`);
	console.log(`Wrote ${allRecords.length} total records to ${output}`);
}

// ---------------------------------------------------------------------------
// Push records to Meilisearch
// ---------------------------------------------------------------------------
async function pushToMeilisearch(output) {
	const url = process.env.MEILISEARCH_URL || process.env.PUBLIC_MEILISEARCH_URL;
	const key = process.env.MEILISEARCH_MASTER_KEY;

	if (!url || !key) {
		console.error(
			'Error: --push requires MEILISEARCH_URL or PUBLIC_MEILISEARCH_URL, and MEILISEARCH_MASTER_KEY env vars'
		);
		process.exit(1);
	}

	if (!fs.existsSync(output)) {
		console.error(`Error: No file found at ${output} — nothing to push`);
		process.exit(1);
	}

	const records = JSON.parse(fs.readFileSync(output, 'utf-8'));
	console.log(`\nPushing ${records.length} records to Meilisearch...`);

	const endpoint = `${url.replace(/\/$/, '')}/indexes/releases/documents`;
	const response = await fetch(endpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${key}`
		},
		body: JSON.stringify(records)
	});

	if (!response.ok) {
		const body = await response.text();
		throw new Error(`Meilisearch returned ${response.status}: ${body}`);
	}

	const result = await response.json();
	console.log(`Push accepted — task UID: ${result.taskUid}, status: ${result.status}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
	const { offset, output, update, push } = parseArgs();

	if (update) {
		await updateSync(output);
	} else {
		await fullSync(offset, output);
	}

	if (push) {
		await pushToMeilisearch(output);
	}
}

main().catch((err) => {
	console.error('\nFatal error:', err.message);
	process.exit(1);
});
