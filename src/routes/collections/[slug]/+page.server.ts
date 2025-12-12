import type { PageServerLoad } from './$types';
import { collections } from '$lib/data/collections';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, fetch }) => {
	// Find the collection by slug (title)
	const collection = collections.find(
		(c) => c.title.toLowerCase().replace(/\s+/g, '-') === params.slug.toLowerCase()
	);

	if (!collection) {
		throw error(404, 'Collection not found');
	}

	// Fetch project details for all projects in the collection
	try {
		const response = await fetch('/api/project-details', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ urls: collection.projects })
		});

		if (!response.ok) {
			console.error('Failed to fetch collection projects');
			return {
				collection: {
					title: collection.title,
					description: collection.description,
					views: collection.views
				},
				projects: []
			};
		}

		const data = await response.json();
		const projects = data.projects.map((project: any, index: number) => {
			const projectId = collection.projects[index].split('/detail/')[1];
			return {
				...project,
				id: projectId
			};
		});

		return {
			collection: {
				title: collection.title,
				description: collection.description,
				views: collection.views
			},
			projects: projects
		};
	} catch (err) {
		console.error('Error fetching collection projects:', err);
		return {
			collection: {
				title: collection.title,
				description: collection.description,
				views: collection.views
			},
			projects: []
		};
	}
};
