import type { PageServerLoad } from './$types';
import { collections } from '$lib/data/collections';
import { exclusive } from '$lib/data/exclusive';
import { featured } from '$lib/data/featured';
import { trending } from '$lib/data/trending';

interface Release {
	id: string;
	name: string;
	description: string;
	released: string;
	thumbnail: string;
}

interface ReleasesResponse {
	count: number;
	next: string | null;
	previous: string | null;
	results: Release[];
}

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

export const load: PageServerLoad = async ({ fetch }) => {
	try {
		// Fetch releases, tags, and all spotlights in parallel
		const [
			releasesResponse,
			tagsResponse,
			spotlightExclusiveResponse,
			spotlightFeaturedResponse,
			spotlightTrendingResponse
		] = await Promise.all([
			fetch('https://guncadindex.com/api/releases/?limit=5', {
				headers: {
					Accept: 'application/json'
				}
			}),
			fetch('https://guncadindex.com/api/tags/?format=json&limit=200', {
				headers: {
					Accept: 'application/json'
				}
			}),
			fetch('/api/spotlight?type=exclusive'),
			fetch('/api/spotlight?type=featured'),
			fetch('/api/spotlight?type=trending')
		]);

		if (!releasesResponse.ok) {
			throw new Error('Failed to fetch releases');
		}

		if (!tagsResponse.ok) {
			throw new Error('Failed to fetch tags');
		}

		if (!spotlightExclusiveResponse.ok) {
			throw new Error('Failed to fetch spotlight exclusive');
		}

		if (!spotlightFeaturedResponse.ok) {
			throw new Error('Failed to fetch spotlight featured');
		}

		if (!spotlightTrendingResponse.ok) {
			throw new Error('Failed to fetch spotlight trending');
		}

		const releasesData: ReleasesResponse = await releasesResponse.json();
		const tagsData: TagsResponse = await tagsResponse.json();
		const spotlightExclusiveData = await spotlightExclusiveResponse.json();
		const spotlightFeaturedData = await spotlightFeaturedResponse.json();
		const spotlightTrendingData = await spotlightTrendingResponse.json();

		console.log('Tags fetched:', tagsData.results.length, 'tags');
		console.log('Releases fetched:', releasesData.results.length, 'releases');
		console.log('Spotlight exclusive fetched:', spotlightExclusiveData.title);
		console.log('Spotlight featured fetched:', spotlightFeaturedData.title);
		console.log('Spotlight trending fetched:', spotlightTrendingData.title);

		// Fetch images for each collection in parallel
		const collectionImagePromises = collections.map(async (collection) => {
			const response = await fetch('/api/collection-images', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
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

		// Fetch project details for exclusive, featured, and trending in parallel
		const [exclusiveResponse, featuredResponse, trendingResponse] = await Promise.all([
			fetch('/api/project-details', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ urls: exclusive })
			}),
			fetch('/api/project-details', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ urls: featured })
			}),
			fetch('/api/project-details', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ urls: trending })
			})
		]);

		let exclusiveProjects = [];
		let featuredProjects = [];
		let trendingProjects = [];

		if (exclusiveResponse.ok) {
			const data = await exclusiveResponse.json();
			exclusiveProjects = data.projects.map((project: any) => ({
				...project,
				badge: 'exclusive'
			}));
			console.log('Exclusive projects fetched:', exclusiveProjects.length);
		}

		if (featuredResponse.ok) {
			const data = await featuredResponse.json();
			featuredProjects = data.projects.map((project: any) => ({
				...project,
				badge: 'featured'
			}));
			console.log('Featured projects fetched:', featuredProjects.length);
		}

		if (trendingResponse.ok) {
			const data = await trendingResponse.json();
			trendingProjects = data.projects.map((project: any) => ({
				...project,
				badge: 'trending'
			}));
			console.log('Trending projects fetched:', trendingProjects.length);
		}

		return {
			releases: releasesData.results,
			tags: tagsData.results,
			spotlightExclusive: spotlightExclusiveData,
			spotlightFeatured: spotlightFeaturedData,
			spotlightTrending: spotlightTrendingData,
			collections: collectionsWithImages,
			exclusive: exclusiveProjects,
			featured: featuredProjects,
			trending: trendingProjects
		};
	} catch (error) {
		console.error('Error fetching data:', error);
		return {
			releases: [],
			tags: [],
			spotlightExclusive: {
				title: 'The Hello Kitty',
				image:
					'https://guncadindex.com/media/thumbnails/thumbnail-d06fa14f-ffb0-4224-a851-bf241e474500-768.webp',
				url: 'https://guncadindex.com/detail/Hello-Kitty-Beta-1:7',
				views: 0,
				likes: 0
			},
			spotlightFeatured: {
				title: 'Chode Muzzle Brake',
				image:
					'https://guncadindex.com/media/thumbnails/thumbnail-d06fa14f-ffb0-4224-a851-bf241e474500-768.webp',
				url: 'https://guncadindex.com/detail/Chode-Muzzle-Brake:c',
				views: 0,
				likes: 0
			},
			spotlightTrending: {
				title: 'DeadTrolls PA6CF',
				image:
					'https://guncadindex.com/media/thumbnails/thumbnail-d06fa14f-ffb0-4224-a851-bf241e474500-768.webp',
				url: 'https://guncadindex.com/detail/DeadTrolls-PA6CF-20:0',
				views: 0,
				likes: 0
			},
			collections: collections.map((collection) => ({
				...collection,
				fetchedImages: collection.images
			})),
			exclusive: [],
			featured: [],
			trending: [],
			error: 'Failed to load data'
		};
	}
};
