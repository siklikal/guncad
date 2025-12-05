import type { PageServerLoad } from './$types';

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

		return {
			releases: releasesData.results,
			tags: tagsData.results,
			spotlightExclusive: spotlightExclusiveData,
			spotlightFeatured: spotlightFeaturedData,
			spotlightTrending: spotlightTrendingData
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
				url: 'https://guncadindex.com/detail/Hello-Kitty-Beta-1:7'
			},
			spotlightFeatured: {
				title: 'Chode Muzzle Brake',
				image:
					'https://guncadindex.com/media/thumbnails/thumbnail-d06fa14f-ffb0-4224-a851-bf241e474500-768.webp',
				url: 'https://guncadindex.com/detail/Chode-Muzzle-Brake:c'
			},
			spotlightTrending: {
				title: 'DeadTrolls PA6CF',
				image:
					'https://guncadindex.com/media/thumbnails/thumbnail-d06fa14f-ffb0-4224-a851-bf241e474500-768.webp',
				url: 'https://guncadindex.com/detail/DeadTrolls-PA6CF-20:0'
			},
			error: 'Failed to load data'
		};
	}
};
