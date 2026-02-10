import { collections } from '$lib/data/collections';

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
		const response = await fetch('/api/tags?limit=200', {
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
		return collectionsWithImages;
	} catch (error) {
		console.error('Error fetching collections:', error);
		return collections.map((collection) => ({
			...collection,
			fetchedImages: collection.images
		}));
	}
}

// Helper function to fetch projects by GCI API sort order
export async function fetchSortedProjects(
	sort: 'popular' | 'newest' | 'updated',
	limit: number = 5
) {
	try {
		const response = await fetch(`/api/gci-sorted?sort=${sort}&limit=${limit}`, {
			headers: { 'Content-Type': 'application/json' }
		});

		if (!response.ok) {
			console.error(`Failed to fetch ${sort} projects`);
			return [];
		}

		const data = await response.json();
		console.log(`${sort} projects fetched:`, data.projects.length);

		// Debug: Show first 3 newest projects
		if (sort === 'newest' && data.projects.length > 0) {
			const count = Math.min(3, data.projects.length);
			console.log(`[DEBUG] First ${count} newest projects:`, data.projects.slice(0, count));
		}

		if (data.projects.length > 0) {
			console.log(`${sort} first project sample:`, data.projects[0]);
		}
		return data.projects;
	} catch (error) {
		console.error(`Error fetching ${sort} projects:`, error);
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
		// Start fetching below-the-fold content using GCI sort API
		collections: fetchCollections(),
		popular: fetchSortedProjects('popular', 5),
		newest: fetchSortedProjects('newest', 5),
		recentlyUpdated: fetchSortedProjects('updated', 5)
	};
}
