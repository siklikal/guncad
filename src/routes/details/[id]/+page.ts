import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, fetch }) => {
	try {
		const projectId = params.id;
		console.log('Loading project with ID:', projectId);

		// Construct the GCI URL and fetch via our scraping endpoint
		const gciUrl = `https://guncadindex.com/detail/${projectId}`;
		console.log('Fetching from GCI:', gciUrl);

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
			description: projectData.description || 'No description available',
			image: projectData.image,
			tags: projectData.tags || [],
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
			badge: null,
			url: gciUrl
		};

		console.log('Successfully loaded project:', project.title);

		// Check if user has purchased this model
		let hasPurchased = false;
		try {
			const purchaseResponse = await fetch('/api/check-purchase', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ modelId: projectId })
			});

			if (purchaseResponse.ok) {
				const purchaseData = await purchaseResponse.json();
				hasPurchased = purchaseData.purchased;
			}
		} catch (error) {
			console.error('Failed to check purchase status:', error);
			// Continue without purchase info if check fails
		}

		return {
			project,
			projectId,
			hasPurchased
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
