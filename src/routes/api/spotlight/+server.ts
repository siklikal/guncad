import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { spotlight } from '$lib/data/spotlight';

export const GET: RequestHandler = async ({ url: requestUrl, fetch }) => {
	const type = requestUrl.searchParams.get('type') || 'exclusive';
	const spotlightUrl = spotlight[type as keyof typeof spotlight];

	if (!spotlightUrl) {
		return json({ error: `Invalid spotlight type: ${type}` }, { status: 400 });
	}

	const projectIdMatch = spotlightUrl.match(/detail\/(.+)$/);
	if (!projectIdMatch) {
		return json({ error: 'Could not extract project ID from spotlight URL' }, { status: 400 });
	}
	const projectId = projectIdMatch[1];

	try {
		const start = Date.now();
		const response = await fetch('/api/project-details', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ urls: [spotlightUrl] })
		});
		const elapsed = Date.now() - start;

		if (!response.ok) {
			const errorBody = await response.text();
			console.error(`[spotlight] project-details failed for type=${type}`, {
				status: response.status,
				elapsed: `${elapsed}ms`,
				body: errorBody.slice(0, 500)
			});
			// Return fallback data with 200 so spotlights degrade gracefully
			return json({
				title: 'Unknown Title',
				image: 'https://guncadindex.com/media/thumbnails/thumbnail-d06fa14f-ffb0-4224-a851-bf241e474500-768.webp',
				url: spotlightUrl,
				views: 0,
				likes: 0,
				id: projectId
			});
		}

		const data = await response.json();
		const project = data.projects[0];

		if (!project) {
			console.warn(`[spotlight] No project data returned for type=${type}`);
			return json({
				title: 'Unknown Title',
				image: 'https://guncadindex.com/media/thumbnails/thumbnail-d06fa14f-ffb0-4224-a851-bf241e474500-768.webp',
				url: spotlightUrl,
				views: 0,
				likes: 0,
				id: projectId
			});
		}

		console.log(`[spotlight] type=${type} OK ${elapsed}ms`);
		return json({
			title: project.title,
			image: project.image,
			url: spotlightUrl,
			views: project.views,
			likes: project.likes,
			id: projectId
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error(`[spotlight] Network error for type=${type}:`, message);
		return json({
			title: 'Unknown Title',
			image: 'https://guncadindex.com/media/thumbnails/thumbnail-d06fa14f-ffb0-4224-a851-bf241e474500-768.webp',
			url: spotlightUrl,
			views: 0,
			likes: 0,
			id: projectId
		});
	}
};
