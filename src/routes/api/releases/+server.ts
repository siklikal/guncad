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
	url_lbry?: string;
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
	const sort = url.searchParams.get('sort') || (searchQuery ? 'rank' : 'newest');
	const time = url.searchParams.get('time') || 'alltime';

	console.log('[API /api/releases] Incoming request:', {
		limit,
		offset,
		searchQuery,
		sort,
		time
	});

	try {
		// Build GCI API URL - fetch more to account for filtering
		// Fetch 3x the requested amount to ensure we have enough after filtering SecondWatch
		const fetchLimit = limit * 3;
		const apiUrl = new URL('https://guncadindex.com/api/releases/');
		apiUrl.searchParams.set('format', 'json');
		apiUrl.searchParams.set('limit', fetchLimit.toString());
		apiUrl.searchParams.set('offset', offset.toString());

		// GCI API uses 'query' parameter for search, not 'search'
		if (searchQuery) {
			apiUrl.searchParams.set('query', searchQuery);
			console.log('[API /api/releases] Using search query:', searchQuery);
		}
		apiUrl.searchParams.set('sort', sort);
		apiUrl.searchParams.set('time', time);
		console.log('[API /api/releases] Using sort/time:', { sort, time });

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

		// Filter out SecondWatch channel first
		const filteredReleases = data.results.filter((release) => {
			const channelName = release.channel?.name || '';
			const isSecondWatch = channelName === 'SecondWatch';
			if (isSecondWatch) {
				console.log(`[API /api/releases] Filtering out SecondWatch: ${release.name}`);
			}
			return !isSecondWatch;
		});

		console.log(
			`[API /api/releases] After filtering: ${filteredReleases.length} items (from ${data.results.length})`
		);

		// Take only requested amount after filtering and map to our format
		const projects = filteredReleases.slice(0, limit).map((release) => {
			const slug = release.url_lbry ? release.url_lbry.replace('lbry://', '') : release.id;

			return {
				id: slug,
				title: release.name,
				image: release.thumbnail_manager?.large || release.thumbnail || '',
				views: release.odysee_views || 0,
				likes: release.odysee_likes || 0,
				user: {
					username: release.channel?.name || 'Unknown',
					avatar: release.channel?.thumbnail_manager?.large || '/images/default-avatar.avif'
				}
			};
		});

		console.log('[API /api/releases] Mapped projects:', projects.length, 'items');
		if (projects.length > 0) {
			console.log('[API /api/releases] Sample project:', projects[0]);
		}

		// Determine if there are more results
		// We have more if: 1) GCI API says there's more, OR 2) we have more filtered items than we're returning
		const hasMore = data.next !== null || filteredReleases.length > limit;

		const result = {
			releases: projects,
			count: data.count,
			hasMore: hasMore
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
