import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const config = {
	runtime: 'nodejs22.x',
	regions: ['cle1']
};

export const GET: RequestHandler = async ({ url, fetch: serverFetch }) => {
	const sort = url.searchParams.get('sort') || 'newest';
	const limit = parseInt(url.searchParams.get('limit') || '5');
	const gciUrl = `https://guncadindex.com/api/releases/?format=json&sort=${sort}&time=alltime&limit=${limit}`;

	try {
		const start = Date.now();
		const response = await serverFetch(gciUrl, {
			headers: {
				Accept: 'application/json',
				'User-Agent': 'guncad-vercel/1.0 (+https://guncad.vercel.app)',
				Referer: 'https://guncad.vercel.app'
			}
		});
		const elapsed = Date.now() - start;

		if (!response.ok) {
			const errorBody = await response.text();
			console.error(`[gci-sorted] GCI API failed for sort=${sort}`, {
				status: response.status,
				statusText: response.statusText,
				elapsed: `${elapsed}ms`,
				body: errorBody.slice(0, 1000)
			});
			return json(
				{
					error: 'GCI API error',
					gci_status: response.status,
					gci_statusText: response.statusText,
					elapsed,
					sort
				},
				{ status: 502 }
			);
		}

		const data = await response.json();
		const releases = data.results || [];
		console.log(`[gci-sorted] sort=${sort} OK ${elapsed}ms — ${releases.length} releases`);

		const projects = releases.map((release: any) => {
			const slug = release.url_lbry ? release.url_lbry.replace('lbry://', '') : null;

			return {
				id: slug,
				title: release.name,
				image: release.thumbnail_manager?.large || release.thumbnail || '',
				url: `https://guncadindex.com/detail/${slug}`,
				views: release.odysee_views || 0,
				likes: release.odysee_likes || 0,
				tags: release.tags ? release.tags.map((tag: any) => tag.name) : [],
				user: {
					username: release.channel?.name || 'Unknown User',
					handle: release.channel?.handle || '',
					avatar:
						release.channel?.thumbnail_manager?.large ||
						'https://guncadindex.com/static/images/default-avatar.png'
				},
				description: release.description || '',
				lbryUrl: release.url_lbry || ''
			};
		});

		return json({ projects });
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error(`[gci-sorted] Network/fetch error for sort=${sort}:`, message);
		return json(
			{
				error: 'GCI unreachable',
				detail: message,
				sort
			},
			{ status: 502 }
		);
	}
};
