import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { checkGeoPurchase, getClientIp } from '$lib/server/geoCheck';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async ({ request }) => {
	if (env.BYPASS_GEO_CHECK === 'true') {
		return json({ allowed: true });
	}

	const ip = getClientIp(request);
	const result = await checkGeoPurchase(ip);

	return json(result);
};
