import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

async function scrapeImage(url: string): Promise<string> {
	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Failed to fetch ${url}`);
		}

		const html = await response.text();

		// Extract image from .expanded-image img src
		const expandedImageMatch = html.match(
			/<img[^>]*class="[^"]*expanded-image[^"]*"[^>]*src="([^"]+)"/i
		);

		if (expandedImageMatch) {
			let image = expandedImageMatch[1];
			// If image doesn't start with http, make it absolute
			if (!image.startsWith('http')) {
				const urlObj = new URL(url);
				image = `${urlObj.protocol}//${urlObj.host}${image}`;
			}
			return image;
		}

		// Fallback to a default image if scraping fails
		return 'https://guncadindex.com/media/thumbnails/thumbnail-d06fa14f-ffb0-4224-a851-bf241e474500-768.webp';
	} catch (error) {
		console.error(`Error scraping image from ${url}:`, error);
		return 'https://guncadindex.com/media/thumbnails/thumbnail-d06fa14f-ffb0-4224-a851-bf241e474500-768.webp';
	}
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { urls } = await request.json();

		if (!urls || !Array.isArray(urls)) {
			return json({ error: 'Invalid request: urls array required' }, { status: 400 });
		}

		// Scrape all images in parallel
		const images = await Promise.all(urls.map((url: string) => scrapeImage(url)));

		return json({ images });
	} catch (error) {
		console.error('Error fetching collection images:', error);
		return json({ error: 'Failed to fetch collection images' }, { status: 500 });
	}
};
