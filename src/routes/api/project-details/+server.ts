import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

async function scrapeProjectDetails(url: string): Promise<{
	title: string;
	image: string;
	url: string;
	views: number;
	likes: number;
	user: {
		username: string;
		avatar: string;
	};
}> {
	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Failed to fetch ${url}`);
		}

		const html = await response.text();

		// Extract title from <h1> inside .detailview-meta
		const titleMatch = html.match(
			/<div[^>]*class="[^"]*detailview-meta[^"]*"[^>]*>[\s\S]*?<h1[^>]*>(.*?)<\/h1>/i
		);
		let title = 'Unknown Title';
		if (titleMatch) {
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
		let image = '';
		const expandedImageMatch = html.match(
			/<img[^>]*class="[^"]*expanded-image[^"]*"[^>]*src="([^"]+)"/i
		);
		if (expandedImageMatch) {
			image = expandedImageMatch[1];
			if (!image.startsWith('http')) {
				const urlObj = new URL(url);
				image = `${urlObj.protocol}//${urlObj.host}${image}`;
			}
		}

		// Extract views and likes from .odysee-stats-wrapper
		let views = 0;
		let likes = 0;

		const statsWrapperMatch = html.match(
			/<div[^>]*class="[^"]*odysee-stats-wrapper[^"]*"[^>]*>([\s\S]*?)<\/div>/i
		);

		if (statsWrapperMatch) {
			const statsContent = statsWrapperMatch[1];

			// Extract views - first span with SVG (eye icon)
			const viewsMatch = statsContent.match(
				/<span[^>]*>[\s\S]*?<svg[^>]*>[\s\S]*?<\/svg>\s*(\d+)/i
			);
			if (viewsMatch) {
				views = parseInt(viewsMatch[1], 10);
			}

			// Extract likes - span with class "upvote"
			const likesMatch = statsContent.match(
				/<span[^>]*class="[^"]*upvote[^"]*"[^>]*>[\s\S]*?<svg[^>]*>[\s\S]*?<\/svg>\s*(\d+)/i
			);
			if (likesMatch) {
				likes = parseInt(likesMatch[1], 10);
			}
		}

		// Extract user data
		let username = 'Unknown User';
		let avatar = 'https://guncadindex.com/static/images/default-avatar.png';

		// Extract avatar from img with class "channel-thumbnail"
		const avatarMatch = html.match(
			/<img[^>]*class="[^"]*channel-thumbnail[^"]*"[^>]*src="([^"]+)"/i
		);
		if (avatarMatch) {
			avatar = avatarMatch[1];
			if (!avatar.startsWith('http')) {
				const urlObj = new URL(url);
				avatar = `${urlObj.protocol}//${urlObj.host}${avatar}`;
			}
		}

		// Extract username from the 2nd span inside .detailview-meta
		// First, extract the entire .detailview-meta div
		const metaMatch = html.match(
			/<div[^>]*class="[^"]*detailview-meta[^"]*"[^>]*>([\s\S]*?)<\/div>/i
		);
		if (metaMatch) {
			const metaContent = metaMatch[1];
			// Find all span tags and get the 2nd one
			const spanMatches = metaContent.match(/<span[^>]*>[\s\S]*?<\/span>/gi);
			if (spanMatches && spanMatches.length >= 2) {
				// Get the 2nd span (index 1)
				const secondSpan = spanMatches[1];
				// Extract the <a> tag content from this span
				const usernameMatch = secondSpan.match(/<a[^>]*>(.*?)<\/a>/i);
				if (usernameMatch) {
					username = usernameMatch[1].trim();
				}
			}
		}

		return {
			title,
			image: image || 'https://guncadindex.com/media/thumbnails/thumbnail-d06fa14f-ffb0-4224-a851-bf241e474500-768.webp',
			url,
			views,
			likes,
			user: {
				username,
				avatar
			}
		};
	} catch (error) {
		console.error(`Error scraping project details from ${url}:`, error);
		return {
			title: 'Unknown Title',
			image: 'https://guncadindex.com/media/thumbnails/thumbnail-d06fa14f-ffb0-4224-a851-bf241e474500-768.webp',
			url,
			views: 0,
			likes: 0,
			user: {
				username: 'Unknown User',
				avatar: 'https://guncadindex.com/static/images/default-avatar.png'
			}
		};
	}
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { urls } = await request.json();

		if (!urls || !Array.isArray(urls)) {
			return json({ error: 'Invalid request: urls array required' }, { status: 400 });
		}

		// Scrape all project details in parallel
		const projects = await Promise.all(urls.map((url: string) => scrapeProjectDetails(url)));

		return json({ projects });
	} catch (error) {
		console.error('Error fetching project details:', error);
		return json({ error: 'Failed to fetch project details' }, { status: 500 });
	}
};
