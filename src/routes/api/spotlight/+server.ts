import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { spotlightExclusive } from '$lib/data/spotlightExlcusive';
import { spotlightFeatured } from '$lib/data/spotlightFeatured';
import { spotlightTrending } from '$lib/data/spotlightTrending';

export const GET: RequestHandler = async ({ url: requestUrl }) => {
	try {
		const type = requestUrl.searchParams.get('type') || 'exclusive';

		// Select the appropriate URL based on type
		const urlMap: Record<string, string[]> = {
			exclusive: spotlightExclusive,
			featured: spotlightFeatured,
			trending: spotlightTrending
		};

		const urlArray = urlMap[type];
		if (!urlArray || urlArray.length === 0) {
			throw new Error(`Invalid spotlight type: ${type}`);
		}

		const url = urlArray[0];

		// Fetch the HTML page
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error('Failed to fetch spotlight page');
		}

		const html = await response.text();

		// Extract title from <h1> inside .detailview-meta
		const titleMatch = html.match(
			/<div[^>]*class="[^"]*detailview-meta[^"]*"[^>]*>[\s\S]*?<h1[^>]*>(.*?)<\/h1>/i
		);
		let title = 'Unknown Title';
		if (titleMatch) {
			// Decode HTML entities
			title = titleMatch[1]
				.replace(/&amp;/g, '&')
				.replace(/&lt;/g, '<')
				.replace(/&gt;/g, '>')
				.replace(/&quot;/g, '"')
				.replace(/&#x27;/g, "'")
				.replace(/&#039;/g, "'")
				.trim();
		}

		// Extract image from .expanded-image img src
		// The img tag itself has the expanded-image class
		let image = '';
		const expandedImageMatch = html.match(
			/<img[^>]*class="[^"]*expanded-image[^"]*"[^>]*src="([^"]+)"/i
		);
		if (expandedImageMatch) {
			image = expandedImageMatch[1];
			// If image doesn't start with http, make it absolute
			if (!image.startsWith('http')) {
				const urlObj = new URL(url);
				image = `${urlObj.protocol}//${urlObj.host}${image}`;
			}
		}

		return json({
			title,
			image,
			url
		});
	} catch (error) {
		console.error('Error fetching spotlight:', error);

		// Fallback URLs based on type
		const type = requestUrl.searchParams.get('type') || 'exclusive';
		const fallbackUrls: Record<string, string> = {
			exclusive: spotlightExclusive[0] || 'https://guncadindex.com/detail/Hello-Kitty-Beta-1:7',
			featured: spotlightFeatured[0] || 'https://guncadindex.com/detail/Chode-Muzzle-Brake:c',
			trending: spotlightTrending[0] || 'https://guncadindex.com/detail/DeadTrolls-PA6CF-20:0'
		};

		return json(
			{
				error: `Failed to fetch spotlight ${type}`,
				title: 'The Hello Kitty',
				image: 'https://guncadindex.com/media/thumbnails/thumbnail-d06fa14f-ffb0-4224-a851-bf241e474500-768.webp',
				url: fallbackUrls[type]
			},
			{ status: 500 }
		);
	}
};
