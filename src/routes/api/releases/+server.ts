import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

interface Release {
	id: string;
	name: string;
	description: string;
	released: string;
	thumbnail: string;
	thumbnail_manager?: {
		small: string;
		large: string;
	};
	odysee_views?: number;
	odysee_likes?: number;
	channel?: {
		name: string;
		thumbnail_manager?: {
			small: string;
			large: string;
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
	const ordering = url.searchParams.get('ordering') || '-released';

	console.log('[API /api/releases] Incoming request:', {
		limit,
		offset,
		searchQuery,
		ordering
	});

	try {
		// Build GCI API URL
		const apiUrl = new URL('https://guncadindex.com/api/releases/');
		apiUrl.searchParams.set('format', 'json');
		apiUrl.searchParams.set('limit', limit.toString());
		apiUrl.searchParams.set('offset', offset.toString());

		// GCI API uses 'query' parameter for search, not 'search'
		if (searchQuery) {
			apiUrl.searchParams.set('query', searchQuery);
			console.log('[API /api/releases] Using search query:', searchQuery);
		} else {
			apiUrl.searchParams.set('ordering', ordering);
			console.log('[API /api/releases] Using ordering:', ordering);
		}

		console.log('[API /api/releases] Fetching from GCI:', apiUrl.toString());

		const response = await fetch(apiUrl.toString(), {
			headers: { Accept: 'application/json' }
		});

		console.log('[API /api/releases] GCI response status:', response.status);

		if (!response.ok) {
			console.error('[API /api/releases] GCI API failed with status:', response.status);
			return json({ error: 'Failed to fetch releases' }, { status: 500 });
		}

		const data: ReleasesResponse = await response.json();
		console.log('[API /api/releases] GCI returned:', {
			count: data.count,
			resultsCount: data.results.length,
			hasNext: !!data.next
		});

		// Map GCI API data directly - no scraping needed!
		const projects = data.results.map((release) => ({
			id: release.id,
			title: release.name,
			image: release.thumbnail_manager?.large || release.thumbnail || '',
			views: release.odysee_views || 0,
			likes: release.odysee_likes || 0,
			user: {
				username: release.channel?.name || 'Unknown',
				avatar: release.channel?.thumbnail_manager?.large || '/images/default-avatar.avif'
			}
		}));

		console.log('[API /api/releases] Mapped projects:', projects.length, 'items');
		console.log('[API /api/releases] Sample project:', projects[0]);

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
