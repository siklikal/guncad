import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, fetch }) => {
	try {
		const projectId = params.id;

		// Fetch project details by scraping the GCI detail page
		const gciUrl = `https://guncadindex.com/detail/${projectId}`;
		const response = await fetch('/api/project-details', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ urls: [gciUrl] })
		});

		if (!response.ok) {
			throw new Error('Failed to fetch project details');
		}

		const data = await response.json();
		const projectData = data.projects[0];

		if (!projectData) {
			throw new Error('Project not found');
		}

		// Map to the expected project format
		const project = {
			id: projectId,
			title: projectData.title,
			description: projectData.description,
			image: projectData.image,
			tags: projectData.tags,
			views: projectData.views,
			likes: projectData.likes,
			releaseTime: null,
			claimId: projectId,
			permanentUrl: gciUrl,
			canonicalUrl: projectData.lbryUrl || `lbry://${projectId}`,
			user: projectData.user,
			source: {
				name: `${projectData.title}.zip`,
				mediaType: 'application/zip',
				size: 0,
				hash: ''
			},
			url: gciUrl
		};

		return {
			project,
			projectId
		};
	} catch (error) {
		console.error('Error loading project details:', error);
		return {
			project: null,
			projectId: params.id,
			error: 'Failed to load project details'
		};
	}
};
