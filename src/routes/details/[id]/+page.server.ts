import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, fetch }) => {
	try {
		const projectId = params.id;

		// Fetch project details from LBRY using the new API endpoint
		const response = await fetch('/api/lbry-resolve', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ claimNames: [projectId] })
		});

		if (!response.ok) {
			throw new Error('Failed to fetch project details');
		}

		const data = await response.json();
		const project = data.projects[0];

		if (!project) {
			throw new Error('Project not found');
		}

		// Add the external GunCAD Index URL for reference
		project.url = `https://guncadindex.com/detail/${projectId}`;

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
