import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const config = {
	runtime: 'nodejs22.x',
	regions: ['cle1']
};

export const GET: RequestHandler = async ({ url, fetch: serverFetch }) => {
	try {
		const sort = url.searchParams.get('sort') || 'newest';
		const limit = parseInt(url.searchParams.get('limit') || '5');

		const gciUrl = `https://guncadindex.com/api/releases/?format=json&sort=${sort}&time=alltime&limit=${limit}`;
		const response = await serverFetch(gciUrl, {
			headers: {
				Accept: 'application/json',
				'User-Agent': 'guncad-vercel/1.0 (+https://guncad.vercel.app)',
				Referer: 'https://guncad.vercel.app'
			}
		});

		if (!response.ok) {
			const errorBody = await response.text();
			console.error('[gci-sorted] GCI API failed', {
				status: response.status,
				statusText: response.statusText,
				headers: Object.fromEntries(response.headers.entries()),
				body: errorBody.slice(0, 1000)
			});
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

		// Map GCI API response to our format
		const projects = releases.map((release: any) => {
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

		console.log(`[gci-sorted] Returning ${projects.length} projects`);
		return json({ projects });
	} catch (error) {
		console.error('[gci-sorted] Error:', error);
		return json({ error: 'Failed to fetch sorted projects' }, { status: 500 });
	}
};
