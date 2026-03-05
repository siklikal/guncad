#!/usr/bin/env node

/**
 * GunCAD → Algolia Sync Script
 *
 * Fetches releases from the GCI API and outputs a JSON file
 * formatted for Algolia import.
 *
 * MODES:
 *
 *   1. Full sync (first run — fetches everything):
 *      node scripts/sync-algolia.js
 *
 *   2. Update sync (subsequent runs — only fetches new releases):
 *      node scripts/sync-algolia.js --update
 *      This reads your existing algolia-records.json file, fetches newest
 *      releases from the API, and stops when it hits a record that already
 *      exists. New records are prepended to the file.
 *
 *   3. Resume a crashed run:
 *      node scripts/sync-algolia.js --offset 3000
 *      Picks up fetching from offset 3000 (useful if script died mid-run).
 *
 * ALL OPTIONS:
 *   --update             Only fetch new releases since last run
 *   --offset <number>    Start fetching from this offset (default: 0)
 *   --output <path>      Output file path (default: algolia-records.json)
 *   --help               Show this help message
 *
 * HOW --update WORKS:
 *   - Results are ordered newest-first (-released)
 *   - Script loads existing objectIDs from your output file
 *   - Fetches pages from the API starting at offset 0
 *   - As soon as it hits a record that already exists, it stops
 *   - New records are prepended to the existing file
 *   - This means you only download the delta (new stuff since last run)
 *
 * NOTES:
 *   - GCI API max limit per request is 1000
 *   - We use 500 per page to be safe and avoid timeouts
 *   - A 1-second delay between pages avoids hammering the API
 */

import fs from 'fs';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const GCI_API_BASE = 'https://guncadindex.com/api/releases/';
const PAGE_SIZE = 500;
const DELAY_MS = 1000;
const DEFAULT_OUTPUT = 'algolia-records.json';

// ---------------------------------------------------------------------------
// Parse CLI args
// ---------------------------------------------------------------------------
function parseArgs() {
	const args = process.argv.slice(2);
	let offset = 0;
	let output = DEFAULT_OUTPUT;
	let update = false;

	for (let i = 0; i < args.length; i++) {
		if (args[i] === '--offset' && args[i + 1]) {
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
Usage: node scripts/sync-algolia.js [options]

Options:
  --update              Only fetch new releases since last run
  --offset <number>     Start fetching from this offset (default: 0)
  --output <path>       Output file path (default: ${DEFAULT_OUTPUT})
  --help                Show this help message

Examples:
  node scripts/sync-algolia.js              # Full sync (first run)
  node scripts/sync-algolia.js --update     # Only fetch new stuff
  node scripts/sync-algolia.js --offset 3000  # Resume crashed run
`);
			process.exit(0);
		}
	}

	return { offset, output, update };
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
// Transform a GCI release into an Algolia record
// ---------------------------------------------------------------------------
function transformRelease(release) {
	const model_name_slug = release.url_lbry ? release.url_lbry.replace(/^lbry:\/\//, '') : '';

	return {
		objectID: release.id,
		model_name: release.name || '',
		model_name_slug,
		model_thumbnail: release.thumbnail_manager?.small || '',
		user: release.channel?.name || '',
		user_thumbnail: release.channel?.thumbnail_manager?.small || ''
	};
}

// ---------------------------------------------------------------------------
// Fetch a single page from the GCI API
// ---------------------------------------------------------------------------
async function fetchPage(offset) {
	const url = `${GCI_API_BASE}?format=json&limit=${PAGE_SIZE}&offset=${offset}&ordering=-released`;

	const response = await fetch(url, {
		headers: { Accept: 'application/json' }
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

	// Load existing records and build a Set of known objectIDs
	const existingRecords = loadExistingRecords(output);
	const existingIds = new Set(existingRecords.map((r) => r.objectID));

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
// Main
// ---------------------------------------------------------------------------
async function main() {
	const { offset, output, update } = parseArgs();

	if (update) {
		await updateSync(output);
	} else {
		await fullSync(offset, output);
	}
}

main().catch((err) => {
	console.error('\nFatal error:', err.message);
	process.exit(1);
});
