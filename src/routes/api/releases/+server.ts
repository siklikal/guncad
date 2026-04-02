import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const config = {
	runtime: 'nodejs22.x',
	regions: ['cle1']
};

interface Release {
	id: string;
	name: string;
	description: string;
	released: string;
	path?: string;
	thumbnail?: {
		small?: string;
		large?: string;
		origin?: string;
	};
	channel?: {
		name: string;
		handle: string;
		thumbnail?: {
			small?: string;
			large?: string;
		};
	};
	origin?: {
		statistics?: {
			views?: number;
			likes?: number;
			hearts?: number;
		};
	};
}

interface ReleasesResponse {
	count: number;
	next: string | null;
	previous: string | null;
	results: Release[];
}

export const GET: RequestHandler = async ({ url, fetch }) => {
	const limit = parseInt(url.searchParams.get('limit') || '20');
	const offset = parseInt(url.searchParams.get('offset') || '0');
	const searchQuery = url.searchParams.get('search') || '';
	const channel = url.searchParams.get('channel') || '';
	const sort = url.searchParams.get('sort') || (searchQuery ? 'rank' : 'newest');
	const time = url.searchParams.get('time') || 'alltime';

	console.log('[API /api/releases] Incoming request:', {
		limit,
		offset,
		searchQuery,
		channel,
		sort,
		time
	});

	try {
		// Build GCI API URL
		const apiUrl = new URL('https://guncadindex.com/api/v2/releases/');
		apiUrl.searchParams.set('limit', limit.toString());
		apiUrl.searchParams.set('offset', offset.toString());

		// GCI v2 uses 'query' parameter for search
		if (searchQuery) {
			apiUrl.searchParams.set('query', searchQuery);
			console.log('[API /api/releases] Using search query:', searchQuery);
		}
		if (channel) {
			apiUrl.searchParams.set('channel', channel);
			console.log('[API /api/releases] Filtering by channel:', channel);
		}
		apiUrl.searchParams.set('sort', sort);
		apiUrl.searchParams.set('time', time);
		console.log('[API /api/releases] Using sort/time:', { sort, time });

		console.log('[API /api/releases] Fetching from GCI:', apiUrl.toString());

		const response = await fetch(apiUrl.toString(), {
			headers: {
				Accept: 'application/json',
				'User-Agent': 'guncad-vercel/1.0 (+https://guncad.vercel.app)',
				Referer: 'https://guncad.vercel.app'
			}
		});

		console.log('[API /api/releases] GCI response status:', response.status);

		if (!response.ok) {
			const errorBody = await response.text();
			console.error('[API /api/releases] GCI API failed', {
				status: response.status,
				statusText: response.statusText,
				headers: Object.fromEntries(response.headers.entries()),
				body: errorBody.slice(0, 1000)
			});
			return json({ error: 'Failed to fetch releases' }, { status: 500 });
		}

		const data: ReleasesResponse = await response.json();
		console.log('[API /api/releases] GCI returned:', {
			count: data.count,
			resultsCount: data.results.length,
			hasNext: !!data.next
		});

		// Map GCI API data directly
		const projects = data.results.map((release) => {
			const slug = release.path?.split('/detail/')[1] || release.id;
			const statistics = release.origin?.statistics || {};

			return {
				id: slug,
				title: release.name,
				image: release.thumbnail?.large || release.thumbnail?.origin || '',
				views: statistics.views || 0,
				likes: statistics.likes || statistics.hearts || 0,
				user: {
					username: release.channel?.name || 'Unknown',
					handle: release.channel?.handle || '',
					avatar: release.channel?.thumbnail?.large || '/images/default-avatar.avif'
				}
			};
		});

		console.log('[API /api/releases] Mapped projects:', projects.length, 'items');
		if (projects.length > 0) {
			console.log('[API /api/releases] Sample project:', projects[0]);
		}

		const result = {
			releases: projects,
			count: data.count,
			hasMore: data.next !== null
		};

		console.log('[API /api/releases] Returning:', {
			releasesCount: result.releases.length,
			totalCount: result.count,
			hasMore: result.hasMore
		});

		return json(result);
	} catch (error) {
		console.error('[API /api/releases] Error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
