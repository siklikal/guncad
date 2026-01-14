import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, fetch }) => {
	try {
		const limit = url.searchParams.get('limit') || '200';

		const apiUrl = `https://guncadindex.com/api/tags/?format=json&limit=${limit}`;
		const response = await fetch(apiUrl, {
			headers: { Accept: 'application/json' }
		});

		if (!response.ok) {
			return json({ error: 'Failed to fetch tags' }, { status: 500 });
		}

		const data = await response.json();
		return json(data);
	} catch (error) {
		console.error('Error fetching tags:', error);
		return json({ error: 'Failed to fetch tags' }, { status: 500 });
	}
};
