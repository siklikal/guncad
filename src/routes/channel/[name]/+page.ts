import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, url }) => {
	const channelName = params.name;
	const sort = url.searchParams.get('sort') || '';
	const time = url.searchParams.get('time') || '';

	return {
		channelName,
		sort,
		time
	};
};
