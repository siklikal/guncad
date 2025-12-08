import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { LBRY_SERVER_URL } from '$env/static/private';

interface LBRYResolveParams {
	claimNames: string[];
}

async function scrapeGCIStats(
	projectId: string
): Promise<{ views: number; likes: number; tags: string[] }> {
	try {
		const gciUrl = `https://guncadindex.com/detail/${projectId}`;
		console.log('Scraping GCI stats from:', gciUrl);

		const response = await fetch(gciUrl);
		if (!response.ok) {
			console.error(`Failed to fetch GCI page: ${response.status}`);
			return { views: 0, likes: 0, tags: [] };
		}

		const html = await response.text();

		// Extract views and likes from .odysee-stats-wrapper
		let views = 0;
		let likes = 0;

		const statsWrapperMatch = html.match(
			/<div[^>]*class="[^"]*odysee-stats-wrapper[^"]*"[^>]*>([\s\S]*?)<\/div>/i
		);

		if (statsWrapperMatch) {
			const statsContent = statsWrapperMatch[1];

			// Extract views - first span with SVG (eye icon)
			const viewsMatch = statsContent.match(
				/<span[^>]*>[\s\S]*?<svg[^>]*>[\s\S]*?<\/svg>\s*(\d+)/i
			);
			if (viewsMatch) {
				views = parseInt(viewsMatch[1], 10);
				console.log('Views found from GCI:', views);
			}

			// Extract likes - span with class "upvote"
			const likesMatch = statsContent.match(
				/<span[^>]*class="[^"]*upvote[^"]*"[^>]*>[\s\S]*?<svg[^>]*>[\s\S]*?<\/svg>\s*(\d+)/i
			);
			if (likesMatch) {
				likes = parseInt(likesMatch[1], 10);
				console.log('Likes found from GCI:', likes);
			}
		}

		// Extract tags - search entire HTML for tag links
		const tags: string[] = [];
		const tagLinkMatches = html.matchAll(/<a href="\/search\?tag=([^"]+)">/gi);

		for (const match of tagLinkMatches) {
			if (match[1]) {
				const tagName = decodeURIComponent(match[1]);
				const formattedTag = tagName.charAt(0).toUpperCase() + tagName.slice(1);
				tags.push(formattedTag);
			}
		}
		console.log('Tags found from GCI:', tags);

		console.log('Final GCI stats - Views:', views, 'Likes:', likes, 'Tags:', tags);
		return { views, likes, tags };
	} catch (error) {
		console.error('Error scraping GCI stats:', error);
		return { views: 0, likes: 0, tags: [] };
	}
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { claimNames }: LBRYResolveParams = await request.json();

		console.log('=== LBRY API CALLED ===');
		console.log('Claim names requested:', claimNames);

		if (!claimNames || !Array.isArray(claimNames) || claimNames.length === 0) {
			return json({ error: 'Invalid request: claimNames array required' }, { status: 400 });
		}

		// Make request to LBRY server
		const response = await fetch(LBRY_SERVER_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				method: 'resolve',
				params: {
					urls: claimNames
				}
			})
		});

		if (!response.ok) {
			throw new Error(`LBRY server returned ${response.status}`);
		}

		const data = await response.json();

		// Transform the LBRY response and fetch stats from GCI
		const projects = await Promise.all(
			claimNames.map(async (claimName) => {
				const claimData = data.result?.[claimName];

				if (!claimData) {
					return null;
				}

				// Fetch views, likes, and tags from GCI
				const stats = await scrapeGCIStats(claimName);

				return {
					id: claimName,
					title: claimData.value?.title || 'Unknown Title',
					description: claimData.value?.description || '',
					image: claimData.value?.thumbnail?.url || '',
					tags: stats.tags,
					views: stats.views,
					likes: stats.likes,
					releaseTime: claimData.value?.release_time || null,
					claimId: claimData.claim_id,
					permanentUrl: claimData.permanent_url,
					canonicalUrl: claimData.canonical_url,
					user: {
						username:
							claimData.signing_channel?.value?.title ||
							claimData.signing_channel?.name ||
							'Unknown',
						avatar: claimData.signing_channel?.value?.thumbnail?.url || '',
						channelUrl: claimData.signing_channel?.canonical_url || ''
					},
					source: {
						mediaType: claimData.value?.source?.media_type,
						size: claimData.value?.source?.size,
						name: claimData.value?.source?.name,
						hash: claimData.value?.source?.hash
					}
				};
			})
		);

		// Filter out null results
		const validProjects = projects.filter((p) => p !== null);

		return json({ projects: validProjects });
	} catch (error) {
		console.error('Error fetching from LBRY:', error);
		return json({ error: 'Failed to fetch from LBRY server' }, { status: 500 });
	}
};
