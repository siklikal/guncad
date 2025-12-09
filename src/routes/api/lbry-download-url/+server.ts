import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { LBRY_SERVER_URL } from '$env/static/private';

interface LBRYDownloadURLParams {
	uri: string;
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { uri }: LBRYDownloadURLParams = await request.json();

		if (!uri) {
			return json({ error: 'Invalid request: uri required' }, { status: 400 });
		}

		console.log('Getting download URL for:', uri);

		// Call LBRY's get method to initiate download and get streaming URL
		// Use save_file: false to enable streaming mode instead of downloading to disk
		const response = await fetch(LBRY_SERVER_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				method: 'get',
				params: {
					uri: uri,
					save_file: false
				}
			})
		});

		if (!response.ok) {
			throw new Error(`LBRY server returned ${response.status}`);
		}

		const data = await response.json();

		if (data.error) {
			throw new Error(data.error.message || 'LBRY download failed');
		}

		const result = data.result;

		// Return the streaming URL via nginx proxy
		if (result.streaming_url) {
			const streamUrl = new URL(result.streaming_url);
			// Extract the stream hash from the URL
			const streamHash = streamUrl.pathname.replace('/stream/', '');

			// Construct URL using nginx proxy path
			const lbryUrl = new URL(LBRY_SERVER_URL);
			const downloadUrl = `${lbryUrl.protocol}//${lbryUrl.hostname}/lbry-stream/${streamHash}`;

			console.log('Original streaming URL:', result.streaming_url);
			console.log('Proxied download URL:', downloadUrl);

			return json({
				downloadUrl,
				fileName: result.file_name || result.name || 'download.zip'
			});
		}

		throw new Error('No streaming URL available from LBRY');
	} catch (error) {
		console.error('Error getting download URL:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to get download URL' },
			{ status: 500 }
		);
	}
};
