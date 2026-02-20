import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.session?.user) {
		return json({ user: null });
	}

	return json({ user: locals.session.user });
};
