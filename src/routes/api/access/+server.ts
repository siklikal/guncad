import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import {
	ACCESS_COOKIE_NAME,
	ACCESS_COOKIE_TTL_DAYS,
	computeAccessToken
} from '$lib/server/accessAuth';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const { password } = await request.json();

		if (!password) {
			return json({ error: 'Access code is required' }, { status: 400 });
		}

		if (!env.BETA_ACCESS_PASSWORD) {
			return json({ error: 'Beta access not configured' }, { status: 500 });
		}

		if (password !== env.BETA_ACCESS_PASSWORD) {
			return json({ error: 'Invalid access code' }, { status: 401 });
		}

		const token = computeAccessToken(env.BETA_ACCESS_PASSWORD);
		const expires = new Date();
		expires.setDate(expires.getDate() + ACCESS_COOKIE_TTL_DAYS);

		cookies.set(ACCESS_COOKIE_NAME, token, {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			expires
		});

		return json({ success: true });
	} catch (error) {
		console.error('[access] Error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
