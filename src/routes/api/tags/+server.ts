import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, fetch }) => {
	const limit = url.searchParams.get('limit') || '200';
	const apiUrl = `https://guncadindex.com/api/tags/?format=json&limit=${limit}`;

	try {
		const start = Date.now();
		const response = await fetch(apiUrl, {
			headers: { Accept: 'application/json' }
		});
		const elapsed = Date.now() - start;

		if (!response.ok) {
			const errorBody = await response.text();
			console.error('[tags] GCI API failed', {
				status: response.status,
				statusText: response.statusText,
				elapsed: `${elapsed}ms`,
				body: errorBody.slice(0, 1000)
			});
			return json(
				{
					error: 'GCI API error',
					gci_status: response.status,
					gci_statusText: response.statusText,
					elapsed
				},
				{ status: 502 }
			);
		}

		console.log(`[tags] OK ${elapsed}ms`);
		const data = await response.json();
		return json(data);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error('[tags] Network/fetch error:', message);
		return json(
			{
				error: 'GCI unreachable',
				detail: message
			},
			{ status: 502 }
		);
	}
};
