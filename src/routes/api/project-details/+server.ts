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

	// Use the direct GCI API endpoint for the specific release
	// This is much more efficient than searching and filtering
	const apiUrl = `https://guncadindex.com/api/releases/${lbryId}/`;
	const response = await serverFetch(apiUrl, {
		headers: { Accept: 'application/json' }
	});

	if (!response.ok) {
		throw new Error(`GCI API failed: ${response.status}`);
	}

	const release = await response.json();
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
