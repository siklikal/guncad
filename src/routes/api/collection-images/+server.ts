import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, fetch }) => {
	try {
		const { urls } = await request.json();

		if (!urls || !Array.isArray(urls)) {
			return json({ error: 'Invalid request: urls array required' }, { status: 400 });
		}

		// Use our project-details endpoint to fetch full project data
		const response = await fetch('/api/project-details', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ urls })
		});

		if (!response.ok) {
			throw new Error('Failed to fetch project details');
		}

		const data = await response.json();

		// Extract just the images from the project data
		const images = data.projects.map((project: any) => project.image);

		return json({ images });
	} catch (error) {
		console.error('Error fetching collection images:', error);
		return json({ error: 'Failed to fetch collection images' }, { status: 500 });
	}
};
