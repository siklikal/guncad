import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { LBRY_SERVER_URL } from '$env/static/private';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import { access } from 'fs/promises';

interface LBRYDownloadParams {
	uri: string;
	fileName: string;
}

// Helper function to wait for file to be fully downloaded
async function waitForFile(filePath: string, maxWaitTime = 60000): Promise<void> {
	const startTime = Date.now();
	const checkInterval = 500; // Check every 500ms

	while (Date.now() - startTime < maxWaitTime) {
		try {
			await access(filePath);
			// File exists, now check if it's still being written to by comparing size
			const stats1 = await stat(filePath);
			await new Promise((resolve) => setTimeout(resolve, 1000));
			const stats2 = await stat(filePath);

			// If size hasn't changed, file is complete
			if (stats1.size === stats2.size && stats2.size > 0) {
				return;
			}
		} catch {
			// File doesn't exist yet, wait and try again
			await new Promise((resolve) => setTimeout(resolve, checkInterval));
		}
	}

	throw new Error('Download timeout - file took too long to download');
}

/**
 * LBRY File Download Endpoint
 *
 * This endpoint handles downloading files from LBRY by acting as a proxy between
 * the browser and LBRY's streaming server.
 *
 * Flow:
 * 1. Browser calls this endpoint with LBRY URI and desired filename
 * 2. This endpoint calls LBRY daemon's `get` method with save_file: false
 * 3. LBRY returns a streaming URL (http://localhost:5280/stream/{hash})
 * 4. We convert it to use our nginx proxy (https://lbry.wild1.net/lbry-stream/{hash})
 * 5. We fetch from the proxied URL and stream the response back to the browser
 * 6. Browser receives the file as a blob and triggers download
 *
 * Why this approach:
 * - save_file: false tells LBRY to stream content instead of downloading to disk
 * - Port 5280 is not publicly accessible, so we use nginx reverse proxy
 * - SvelteKit server maintains persistent connection to LBRY, preventing "inactive" errors
 * - Browser gets file as a proper download without opening new tabs
 *
 * Nginx config required on LBRY server:
 * location /lbry-stream/ {
 *   proxy_pass http://127.0.0.1:5280/stream/;
 *   proxy_buffering off;
 *   ...
 * }
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const { uri, fileName }: LBRYDownloadParams = await request.json();

		if (!uri || !fileName) {
			return json({ error: 'Invalid request: uri and fileName required' }, { status: 400 });
		}

		console.log('Downloading file from LBRY:', uri);

		// Call LBRY's get method to download the file
		// CRITICAL: Use save_file: false to enable streaming mode
		// save_file: true would download to disk on LBRY server (not accessible remotely)
		// save_file: false returns a streaming URL we can fetch from
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
		console.log('LBRY get response:', JSON.stringify(data, null, 2));

		if (data.error) {
			throw new Error(data.error.message || 'LBRY download failed');
		}

		const result = data.result;

		// If there's a streaming URL, use it - this is the primary method
		if (result.streaming_url) {
			console.log('Original streaming URL:', result.streaming_url);

			// Convert the LBRY streaming URL to use our nginx proxy
			// LBRY returns: http://localhost:5280/stream/{hash}
			// We need: https://lbry.wild1.net/lbry-stream/{hash}
			//
			// Why? Port 5280 is not publicly accessible and only works on localhost
			// The nginx proxy on the LBRY server forwards /lbry-stream/ to localhost:5280/stream/
			const streamUrl = new URL(result.streaming_url);
			const streamHash = streamUrl.pathname.replace('/stream/', '');

			const lbryUrl = new URL(LBRY_SERVER_URL);
			const streamingUrl = `${lbryUrl.protocol}//${lbryUrl.hostname}/lbry-stream/${streamHash}`;

			console.log('Proxied streaming URL:', streamingUrl);

			try {
				// Fetch the file from the proxied streaming URL
				// This SvelteKit server maintains the connection to LBRY, preventing
				// the "inactive download" issue that occurs when browsers try direct access
				console.log('Fetching from streaming URL...');
				const fileResponse = await fetch(streamingUrl, {
					method: 'GET',
					signal: AbortSignal.timeout(60000) // 60 second timeout for large files
				});

				console.log('Streaming URL response status:', fileResponse.status);

				if (!fileResponse.ok) {
					throw new Error(`Streaming URL returned ${fileResponse.status}: ${fileResponse.statusText}`);
				}

				console.log('Successfully fetched from streaming URL, streaming to client...');

				// Stream the file directly to the browser
				// The browser will receive this as a download
				return new Response(fileResponse.body, {
					headers: {
						'Content-Type': 'application/octet-stream',
						'Content-Disposition': `attachment; filename="${fileName}"`
					}
				});
			} catch (streamError) {
				console.error('Streaming URL failed with error:', streamError);
				throw new Error(`Failed to download via streaming URL: ${streamError instanceof Error ? streamError.message : 'Unknown error'}`);
			}
		}

		// Fallback to file path method
		// Try multiple possible path fields
		const filePath =
			result.download_path ||
			result.file_name ||
			result.output_file ||
			(result.blobs_in_stream && result.blobs_in_stream[0]?.download_path);

		if (!filePath) {
			console.error('No file path found in result:', result);
			throw new Error('Could not determine file path from LBRY response');
		}

		console.log('File path:', filePath);

		// Check if the file is already downloaded
		if (!result.completed) {
			// The file is still downloading, we need to wait
			console.log('File is downloading, waiting for completion...');
			await waitForFile(filePath);
		}

		// Check if file exists and get its size
		try {
			const fileStats = await stat(filePath);
			console.log('File size:', fileStats.size);

			// Stream the file to the user
			const fileStream = createReadStream(filePath);

			return new Response(fileStream as any, {
				headers: {
					'Content-Type': 'application/octet-stream',
					'Content-Disposition': `attachment; filename="${fileName}"`,
					'Content-Length': fileStats.size.toString()
				}
			});
		} catch (err) {
			console.error('File not found at path:', filePath);
			console.error('Full LBRY result:', result);
			throw new Error(`File not found at expected path: ${filePath}`);
		}
	} catch (error) {
		console.error('Error downloading from LBRY:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to download from LBRY server' },
			{ status: 500 }
		);
	}
};
