import type { PageLoad } from './$types';

export const load: PageLoad = async ({ url }) => {
	// Only extract URL params - data fetching happens in onMount on the client
	const searchQuery = url.searchParams.get('search') || '';
	const sort = url.searchParams.get('sort') || '';
	const time = url.searchParams.get('time') || '';

	return {
		searchQuery,
		sort,
		time
	};
};
