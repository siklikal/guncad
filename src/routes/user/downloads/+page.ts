import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	try {
		const response = await fetch('/api/user/purchases');

		if (!response.ok) {
			throw new Error('Failed to fetch purchases');
		}

		const data = await response.json();

		return {
			purchases: data.purchases || []
		};
	} catch (error) {
		console.error('Error loading purchases:', error);
		return {
			purchases: [],
			error: 'Failed to load your purchases'
		};
	}
};
