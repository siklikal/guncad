import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

async function getProjectDetailsFromGCI(url: string, serverFetch: typeof fetch): Promise<any> {
	// Extract the LBRY identifier from the GCI URL
	// Format: https://guncadindex.com/detail/Tiny-11:5
	const projectIdMatch = url.match(/detail\/(.+)$/);
	if (!projectIdMatch) {
		throw new Error(`Invalid GCI URL format: ${url}`);
	}

	const lbryId = projectIdMatch[1]; // e.g., "Tiny-11:5"
	const lbryUrl = `lbry://${lbryId}`; // e.g., "lbry://Tiny-11:5"

	// Extract the claim name for search (part before the colon)
	const claimName = lbryId.split(':')[0]; // e.g., "Tiny-11"

	// Search GCI API using the claim name
	const searchUrl = `https://guncadindex.com/api/releases/?format=json&query=${encodeURIComponent(claimName)}`;
	const searchResponse = await serverFetch(searchUrl, {
		headers: { Accept: 'application/json' }
	});

	if (!searchResponse.ok) {
		throw new Error(`GCI API search failed: ${searchResponse.status}`);
	}

	const searchData = await searchResponse.json();

	if (!searchData.results || searchData.results.length === 0) {
		throw new Error(`No results found for: ${claimName}`);
	}

	// Find the exact match by LBRY URL
	const release = searchData.results.find((r: any) => r.url_lbry === lbryUrl);

	if (!release) {
		// If no exact match, return the first result as fallback
		console.warn(`No exact match for ${lbryUrl}, using first result`);
		return searchData.results[0];
	}

	return release;
}

export const POST: RequestHandler = async ({ request, fetch: serverFetch }) => {
	try {
		const { urls } = await request.json();

		if (!urls || !Array.isArray(urls)) {
			return json({ error: 'Invalid request: urls array required' }, { status: 400 });
		}

		// Fetch all project details in parallel using GCI API
		const projectPromises = urls.map(async (url: string) => {
			try {
				const release = await getProjectDetailsFromGCI(url, serverFetch);

				// Map GCI API response to our format
				return {
					title: release.name,
					image: release.thumbnail_manager?.large || release.thumbnail || '',
					url: url,
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
			} catch (error) {
				console.error(`Error fetching project details from ${url}:`, error);
				// Return fallback data for failed requests
				return {
					title: 'Unknown Title',
					image:
						'https://guncadindex.com/media/thumbnails/thumbnail-d06fa14f-ffb0-4224-a851-bf241e474500-768.webp',
					url: url,
					views: 0,
					likes: 0,
					tags: [],
					user: {
						username: 'Unknown User',
						avatar: 'https://guncadindex.com/static/images/default-avatar.png'
					},
					description: '',
					lbryUrl: ''
				};
			}
		});

		const projects = await Promise.all(projectPromises);

		return json({ projects });
	} catch (error) {
		console.error('Error fetching project details:', error);
		return json({ error: 'Failed to fetch project details' }, { status: 500 });
	}
};
