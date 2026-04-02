import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const config = {
	runtime: 'nodejs22.x',
	regions: ['cle1']
};

async function getProjectDetailsFromGCI(url: string, serverFetch: typeof fetch): Promise<any> {
	const projectIdMatch = url.match(/detail\/(.+)$/);
	if (!projectIdMatch) {
		throw new Error(`Invalid GCI URL format: ${url}`);
	}

	const lbryId = projectIdMatch[1];
	const apiUrl = `https://guncadindex.com/api/v2/releases/${encodeURIComponent(lbryId)}/`;
	const start = Date.now();
	const response = await serverFetch(apiUrl, {
		headers: {
			Accept: 'application/json',
			'User-Agent': 'guncad-vercel/1.0 (+https://guncad.vercel.app)',
			Referer: 'https://guncad.vercel.app'
		}
	});
	const elapsed = Date.now() - start;

	if (!response.ok) {
		const errorBody = await response.text();
		console.error(`[project-details] GCI API failed for ${lbryId}`, {
			status: response.status,
			statusText: response.statusText,
			elapsed: `${elapsed}ms`,
			body: errorBody.slice(0, 1000)
		});
		throw new Error(
			`GCI ${response.status} ${response.statusText} for ${lbryId} (${elapsed}ms)`
		);
	}

	console.log(`[project-details] ${lbryId} OK ${elapsed}ms`);
	return await response.json();
}

export const POST: RequestHandler = async ({ request, fetch: serverFetch }) => {
	try {
		const { urls } = await request.json();

		if (!urls || !Array.isArray(urls)) {
			return json({ error: 'Invalid request: urls array required' }, { status: 400 });
		}

		const projectPromises = urls.map(async (url: string) => {
			try {
				const release = await getProjectDetailsFromGCI(url, serverFetch);
				const statistics = release.origin?.statistics || {};

				return {
					title: release.name,
					image: release.thumbnail?.large || release.thumbnail?.origin || '',
					url: url,
					views: statistics.views || 0,
					likes: statistics.likes || statistics.hearts || 0,
					tags: release.tags ? release.tags.map((tag: any) => tag.name) : [],
					user: {
						username: release.channel?.name || 'Unknown User',
						handle: release.channel?.handle || '',
						avatar:
							release.channel?.thumbnail?.large ||
							'https://guncadindex.com/static/images/default-avatar.png'
					},
					description: release.description || '',
					lbryUrl: release.origin?.links?.find((link: any) => link.url?.startsWith('lbry://'))?.url || '',
					released: release.released || null,
					fileSize: release.origin?.size || 0
				};
			} catch (error) {
				console.error(`[project-details] Failed: ${url}`, error);
				return {
					title: 'Unknown Title',
					image: 'https://guncadindex.com/media/thumbnails/thumbnail-d06fa14f-ffb0-4224-a851-bf241e474500-768.webp',
					url: url,
					views: 0,
					likes: 0,
					tags: [],
					user: {
						username: 'Unknown User',
						handle: '',
						avatar: 'https://guncadindex.com/static/images/default-avatar.png'
					},
					description: '',
					lbryUrl: '',
					released: null,
					fileSize: 0
				};
			}
		});

		const projects = await Promise.all(projectPromises);
		return json({ projects });
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error('[project-details] Request error:', message);
		return json(
			{
				error: 'Failed to fetch project details',
				detail: message
			},
			{ status: 500 }
		);
	}
};
