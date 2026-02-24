import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, fetch, locals }) => {
	const projectId = params.id;
	const gciUrl = `https://guncadindex.com/detail/${projectId}`;

	// Return immediately with projectId and streaming promises
	// This allows the page to render with skeleton while data loads
	return {
		projectId,
		// Stream project data - page shows skeleton until this resolves
		project: (async () => {
			try {
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
				return {
					id: projectId,
					title: projectData.title,
					description: projectData.description || 'No description available',
					image: projectData.image,
					tags: projectData.tags || [],
					views: projectData.views,
					likes: projectData.likes,
					released: projectData.released,
					claimId: projectId,
					permanentUrl: gciUrl,
					canonicalUrl: projectData.lbryUrl || `lbry://${projectId}`,
					user: projectData.user,
					source: {
						name: `${projectData.title}.zip`,
						mediaType: 'application/zip',
						size: projectData.fileSize || 0,
						hash: ''
					},
					badge: null,
					url: gciUrl
				};
			} catch (error) {
				console.error('Error loading project details:', error);
				return null;
			}
		})(),
		// Stream purchase status - can load independently
		hasPurchased: (async () => {
			if (!locals.session) return false;

			try {
				const purchaseResponse = await fetch('/api/check-purchase', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ modelId: projectId })
				});

				if (purchaseResponse.ok) {
					const purchaseData = await purchaseResponse.json();
					return purchaseData.purchased;
				}
				return false;
			} catch (error) {
				console.error('Failed to check purchase status:', error);
				return false;
			}
		})()
	};
};
