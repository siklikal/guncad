import { collections } from '$lib/data/collections';
import { exclusive } from '$lib/data/exclusive';
import { featured } from '$lib/data/featured';
import { trending } from '$lib/data/trending';

interface Tag {
	id: string;
	slug: string;
	name: string;
	description: string;
	color: string;
	text_color: string;
}

interface TagsResponse {
	count: number;
	next: string | null;
	previous: string | null;
	results: Tag[];
}

// Helper function to fetch tags
export async function fetchTags() {
	try {
		const response = await fetch('https://guncadindex.com/api/tags/?format=json&limit=200', {
			headers: { Accept: 'application/json' }
		});
		if (!response.ok) throw new Error('Failed to fetch tags');
		const data: TagsResponse = await response.json();
		console.log('Tags fetched:', data.results.length, 'tags');
		return data.results;
	} catch (error) {
		console.error('Error fetching tags:', error);
		return [];
	}
}

// Helper function to fetch spotlights
export async function fetchSpotlights() {
	try {
		const [exclusiveResponse, featuredResponse, trendingResponse] = await Promise.all([
			fetch('/api/spotlight?type=exclusive'),
			fetch('/api/spotlight?type=featured'),
			fetch('/api/spotlight?type=trending')
		]);

		const spotlightExclusive = exclusiveResponse.ok ? await exclusiveResponse.json() : null;
		const spotlightFeatured = featuredResponse.ok ? await featuredResponse.json() : null;
		const spotlightTrending = trendingResponse.ok ? await trendingResponse.json() : null;

		// Add project IDs
		if (spotlightExclusive?.url) {
			spotlightExclusive.id = spotlightExclusive.url.split('/detail/')[1];
		}
		if (spotlightFeatured?.url) {
			spotlightFeatured.id = spotlightFeatured.url.split('/detail/')[1];
		}
		if (spotlightTrending?.url) {
			spotlightTrending.id = spotlightTrending.url.split('/detail/')[1];
		}

		console.log('Spotlights fetched');
		return {
			exclusive: spotlightExclusive || {
				title: 'The Hello Kitty',
				image: 'https://guncadindex.com/media/thumbnails/thumbnail-d06fa14f-ffb0-4224-a851-bf241e474500-768.webp',
				url: 'https://guncadindex.com/detail/Hello-Kitty-Beta-1:7',
				views: 0,
				likes: 0
			},
			featured: spotlightFeatured || {
				title: 'Chode Muzzle Brake',
				image: 'https://guncadindex.com/media/thumbnails/thumbnail-d06fa14f-ffb0-4224-a851-bf241e474500-768.webp',
				url: 'https://guncadindex.com/detail/Chode-Muzzle-Brake:c',
				views: 0,
				likes: 0
			},
			trending: spotlightTrending || {
				title: 'DeadTrolls PA6CF',
				image: 'https://guncadindex.com/media/thumbnails/thumbnail-d06fa14f-ffb0-4224-a851-bf241e474500-768.webp',
				url: 'https://guncadindex.com/detail/DeadTrolls-PA6CF-20:0',
				views: 0,
				likes: 0
			}
		};
	} catch (error) {
		console.error('Error fetching spotlights:', error);
		return {
			exclusive: {
				title: 'The Hello Kitty',
				image: 'https://guncadindex.com/media/thumbnails/thumbnail-d06fa14f-ffb0-4224-a851-bf241e474500-768.webp',
				url: 'https://guncadindex.com/detail/Hello-Kitty-Beta-1:7',
				views: 0,
				likes: 0
			},
			featured: {
				title: 'Chode Muzzle Brake',
				image: 'https://guncadindex.com/media/thumbnails/thumbnail-d06fa14f-ffb0-4224-a851-bf241e474500-768.webp',
				url: 'https://guncadindex.com/detail/Chode-Muzzle-Brake:c',
				views: 0,
				likes: 0
			},
			trending: {
				title: 'DeadTrolls PA6CF',
				image: 'https://guncadindex.com/media/thumbnails/thumbnail-d06fa14f-ffb0-4224-a851-bf241e474500-768.webp',
				url: 'https://guncadindex.com/detail/DeadTrolls-PA6CF-20:0',
				views: 0,
				likes: 0
			}
		};
	}
}

// Helper function to fetch collections
export async function fetchCollections() {
	try {
		const collectionImagePromises = collections.map(async (collection) => {
			const response = await fetch('/api/collection-images', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ urls: collection.projects })
			});

			if (!response.ok) {
				console.error(`Failed to fetch images for collection: ${collection.title}`);
				return { ...collection, fetchedImages: collection.images };
			}

			const data = await response.json();
			return { ...collection, fetchedImages: data.images };
		});

		const collectionsWithImages = await Promise.all(collectionImagePromises);
		console.log('Collections with images fetched:', collectionsWithImages.length);
		return collectionsWithImages;
	} catch (error) {
		console.error('Error fetching collections:', error);
		return collections.map((collection) => ({
			...collection,
			fetchedImages: collection.images
		}));
	}
}

// Helper function to fetch project category
export async function fetchProjectCategory(
	urls: string[],
	badge: 'exclusive' | 'featured' | 'trending'
) {
	try {
		const response = await fetch('/api/project-details', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ urls })
		});

		if (!response.ok) {
			console.error(`Failed to fetch ${badge} projects`);
			return [];
		}

		const data = await response.json();
		const projects = data.projects.map((project: any, index: number) => {
			const projectId = urls[index].split('/detail/')[1];
			return { ...project, badge, id: projectId };
		});

		console.log(`${badge} projects fetched:`, projects.length);
		return projects;
	} catch (error) {
		console.error(`Error fetching ${badge} projects:`, error);
		return [];
	}
}

export async function fetchHomepageData() {
	// CRITICAL PATH: Above-the-fold content (wait for these)
	const [spotlights, tags] = await Promise.all([fetchSpotlights(), fetchTags()]);

	return {
		spotlightExclusive: spotlights.exclusive,
		spotlightFeatured: spotlights.featured,
		spotlightTrending: spotlights.trending,
		tags: tags,
		// Start fetching below-the-fold content
		collections: fetchCollections(),
		exclusive: fetchProjectCategory(exclusive, 'exclusive'),
		featured: fetchProjectCategory(featured, 'featured'),
		trending: fetchProjectCategory(trending, 'trending')
	};
}
