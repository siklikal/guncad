import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { hashSessionToken, SESSION_COOKIE_NAME } from '$lib/server/accountAuth';

export const POST: RequestHandler = async ({ cookies }) => {
	try {
		const token = cookies.get(SESSION_COOKIE_NAME);
		if (token) {
			const supabase = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
			const tokenHash = hashSessionToken(token);
			await supabase.from('auth_sessions').delete().eq('session_token_hash', tokenHash);
		}

		cookies.delete(SESSION_COOKIE_NAME, {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'lax'
		});

		return json({ success: true });
	} catch (error) {
		console.error('[account/logout] Error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
