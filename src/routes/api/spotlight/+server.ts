import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { spotlight } from '$lib/data/spotlight';

export const GET: RequestHandler = async ({ url: requestUrl, fetch }) => {
	try {
		const type = requestUrl.searchParams.get('type') || 'exclusive';

		// Get the URL for the requested spotlight type
		const spotlightUrl = spotlight[type as keyof typeof spotlight];

		if (!spotlightUrl) {
			throw new Error(`Invalid spotlight type: ${type}`);
		}

		// Extract project ID from URL
		const projectIdMatch = spotlightUrl.match(/detail\/(.+)$/);
		if (!projectIdMatch) {
			throw new Error('Could not extract project ID from spotlight URL');
		}
		const projectId = projectIdMatch[1];

		// Use our project-details endpoint to fetch the data
		const response = await fetch('/api/project-details', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ urls: [spotlightUrl] })
		});

		if (!response.ok) {
			throw new Error('Failed to fetch spotlight data');
		}

		const data = await response.json();
		const project = data.projects[0];

		if (!project) {
			throw new Error('No project data returned');
		}

		// Return in the expected format for spotlights
		return json({
			title: project.title,
			image: project.image,
			url: spotlightUrl,
			views: project.views,
			likes: project.likes,
			id: projectId
		});
	} catch (error) {
		console.error('Error fetching spotlight:', error);

		const type = requestUrl.searchParams.get('type') || 'exclusive';
		const fallbackUrl = spotlight[type as keyof typeof spotlight] || spotlight.exclusive;

		return json(
			{
				error: `Failed to fetch spotlight ${type}`,
				title: 'Unknown Title',
				image: 'https://guncadindex.com/media/thumbnails/thumbnail-d06fa14f-ffb0-4224-a851-bf241e474500-768.webp',
				url: fallbackUrl,
				views: 0,
				likes: 0
			},
			{ status: 500 }
		);
	}
};
