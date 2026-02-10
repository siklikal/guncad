import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, fetch: serverFetch }) => {
	try {
		const sort = url.searchParams.get('sort') || 'newest';
		const limit = parseInt(url.searchParams.get('limit') || '5');

		// Fetch more items than needed to account for filtered results
		const fetchLimit = Math.max(limit * 3, 20);
		const gciUrl = `https://guncadindex.com/api/releases/?format=json&sort=${sort}&time=alltime&limit=${fetchLimit}`;
		const response = await serverFetch(gciUrl, {
			headers: { Accept: 'application/json' }
		});

		if (!response.ok) {
			throw new Error(`GCI API failed: ${response.status}`);
		}

		const data = await response.json();
		const releases = data.results || [];

		console.log(`[gci-sorted] Fetched ${releases.length} releases for sort=${sort}`);
		if (releases.length > 0) {
			console.log('[gci-sorted] Sample release:', {
				url_lbry: releases[0].url_lbry,
				name: releases[0].name,
				channel: releases[0].channel?.name
			});
		}

		// Map GCI API response to our format and filter out SecondWatch
		const projects = releases
			.filter((release: any) => {
				const channelName = release.channel?.name || '';
				const isSecondWatch = channelName === 'SecondWatch';
				if (isSecondWatch) {
					console.log(`[gci-sorted] Filtering out SecondWatch project: ${release.name}`);
				}
				return !isSecondWatch;
			})
			.slice(0, limit) // Take only the requested number after filtering
			.map((release: any) => {
				// Extract slug from url_lbry (e.g., "lbry://Tiny-11:5" -> "Tiny-11:5")
				const slug = release.url_lbry ? release.url_lbry.replace('lbry://', '') : null;

				return {
					id: slug, // e.g., "Tiny-11:5"
					title: release.name,
					image: release.thumbnail_manager?.large || release.thumbnail || '',
					url: `https://guncadindex.com/detail/${slug}`,
					views: release.odysee_views || 0,
					likes: release.odysee_likes || 0,
					tags: release.tags ? release.tags.map((tag: any) => tag.name) : [],
					user: {
						username: release.channel?.name || 'Unknown User',
						avatar:
							release.channel?.thumbnail_manager?.large ||
							'https://guncadindex.com/static/images/default-avatar.png'
					},
					description: release.description || '',
					lbryUrl: release.url_lbry || ''
				};
			});

		console.log(`[gci-sorted] Returning ${projects.length} projects after filtering`);
		return json({ projects });
	} catch (error) {
		console.error('[gci-sorted] Error:', error);
		return json({ error: 'Failed to fetch sorted projects' }, { status: 500 });
	}
};
