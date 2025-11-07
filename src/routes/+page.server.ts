import type { PageServerLoad } from './$types';

interface Release {
	id: string;
	name: string;
	description: string;
	released: string;
	thumbnail: string;
}

interface ReleasesResponse {
	count: number;
	next: string | null;
	previous: string | null;
	results: Release[];
}

export const load: PageServerLoad = async () => {
	try {
		const response = await fetch('https://guncadindex.com/api/releases/?limit=5');

		if (!response.ok) {
			throw new Error('Failed to fetch releases');
		}

		const data: ReleasesResponse = await response.json();

		return {
			releases: data.results
		};
	} catch (error) {
		console.error('Error fetching releases:', error);
		return {
			releases: [],
			error: 'Failed to load releases'
		};
	}
};
