import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

interface MeiliHit {
	model_name?: string;
	model_name_slug?: string;
	model_thumbnail?: string;
	user?: string;
}

interface MeiliSearchResponse {
	hits?: MeiliHit[];
}

export const GET: RequestHandler = async ({ url, fetch }) => {
	const query = (url.searchParams.get('q') || '').trim();
	const limitParam = parseInt(url.searchParams.get('limit') || '8', 10);
	const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 20) : 8;

	if (!query) {
		return json({ suggestions: [] });
	}

	const meiliUrl = publicEnv.PUBLIC_MEILISEARCH_URL || privateEnv.MEILISEARCH_URL;
	const meiliApiKey =
		publicEnv.PUBLIC_MEILISEARCH_SEARCH_KEY ||
		privateEnv.MEILISEARCH_SEARCH_KEY ||
		privateEnv.MEILISEARCH_MASTER_KEY;
	const indexUid = privateEnv.MEILISEARCH_INDEX_UID || publicEnv.PUBLIC_MEILISEARCH_INDEX_UID || 'releases';

	const missing: string[] = [];
	if (!meiliUrl) missing.push('PUBLIC_MEILISEARCH_URL or MEILISEARCH_URL');
	if (!meiliApiKey)
		missing.push(
			'PUBLIC_MEILISEARCH_SEARCH_KEY or MEILISEARCH_SEARCH_KEY or MEILISEARCH_MASTER_KEY'
		);

	if (missing.length > 0) {
		console.error('[API /api/meili-search] Missing env:', missing);
		return json(
			{
				error: 'Meilisearch is not configured on the server',
				missing
			},
			{ status: 503 }
		);
	}

	const searchUrl = `${meiliUrl!.replace(/\/$/, '')}/indexes/${encodeURIComponent(indexUid)}/search`;

	try {
		const response = await fetch(searchUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${meiliApiKey}`
			},
			body: JSON.stringify({
				q: query,
				limit,
				attributesToRetrieve: ['model_name', 'model_name_slug', 'model_thumbnail', 'user']
			})
		});

		if (!response.ok) {
			const message = await response.text();
			console.error('[API /api/meili-search] Meilisearch error:', response.status, message.slice(0, 500));
			return json({ error: 'Meilisearch request failed' }, { status: response.status });
		}

		const payload: MeiliSearchResponse = await response.json();
		const suggestions = (payload.hits || [])
			.filter((hit) => typeof hit.model_name_slug === 'string' && hit.model_name_slug.length > 0)
			.map((hit) => ({
				model_name: hit.model_name || '',
				model_name_slug: hit.model_name_slug || '',
				model_thumbnail: hit.model_thumbnail || '',
				user: hit.user || ''
			}));

		return json({ suggestions });
	} catch (error) {
		console.error('[API /api/meili-search] Error:', error);
		return json({ error: 'Failed to fetch suggestions' }, { status: 500 });
	}
};
