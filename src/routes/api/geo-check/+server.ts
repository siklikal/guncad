import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { checkGeoPurchase, getClientIp } from '$lib/server/geoCheck';

export const GET: RequestHandler = async ({ request }) => {
	const ip = getClientIp(request);
	const result = await checkGeoPurchase(ip);

	return json(result);
};
