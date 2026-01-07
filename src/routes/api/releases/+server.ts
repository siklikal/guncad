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

	try {
		// Build GCI API URL
		const apiUrl = new URL('https://guncadindex.com/api/releases/');
		apiUrl.searchParams.set('format', 'json');
		apiUrl.searchParams.set('limit', limit.toString());
		apiUrl.searchParams.set('offset', offset.toString());

		// Only use ordering when NOT searching (GCI API doesn't combine them properly)
		if (searchQuery) {
			apiUrl.searchParams.set('search', searchQuery);
		} else {
			apiUrl.searchParams.set('ordering', '-released'); // Newest first
		}

		const response = await fetch(apiUrl.toString(), {
			headers: { Accept: 'application/json' }
		});

		if (!response.ok) {
			return json({ error: 'Failed to fetch releases' }, { status: 500 });
		}

		const data: ReleasesResponse = await response.json();

		// Map GCI API data directly - no scraping needed!
		const projects = data.results.map((release) => ({
			id: release.id,
			title: release.name,
			image: release.thumbnail_manager?.large || release.thumbnail || '',
			views: release.odysee_views || 0,
			likes: release.odysee_likes || 0,
			user: {
				username: release.channel?.name || 'Unknown',
				avatar: release.channel?.thumbnail_manager?.large || '/default-avatar.avif'
			}
		}));

		return json({
			releases: projects,
			count: data.count,
			hasMore: data.next !== null
		});
	} catch (error) {
		console.error('Error fetching releases:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
