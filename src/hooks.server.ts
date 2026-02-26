import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { hashSessionToken, SESSION_COOKIE_NAME } from '$lib/server/accountAuth';
import { isValidAccessCookie } from '$lib/server/accessAuth';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			get: (key) => event.cookies.get(key),
			set: (key, value, options) => {
				event.cookies.set(key, value, { ...options, path: '/' });
			},
			remove: (key, options) => {
				event.cookies.delete(key, { ...options, path: '/' });
			}
		}
	});

	// --- Account session (optional, for user-specific features) ---
	event.locals.session = null;

	const sessionToken = event.cookies.get(SESSION_COOKIE_NAME);
	if (sessionToken) {
		const tokenHash = hashSessionToken(sessionToken);
		const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

		const { data: authSession } = await supabaseAdmin
			.from('auth_sessions')
			.select('user_id, expires_at')
			.eq('session_token_hash', tokenHash)
			.gt('expires_at', new Date().toISOString())
			.single();

		if (authSession) {
			const { data: profile } = await supabaseAdmin
				.from('user_profiles')
				.select('status')
				.eq('id', authSession.user_id)
				.single();

			const isActive = profile?.status === 'active';

			if (isActive) {
				event.locals.session = {
					user: {
						id: authSession.user_id
					}
				};

				await supabaseAdmin
					.from('auth_sessions')
					.update({ last_seen_at: new Date().toISOString() })
					.eq('session_token_hash', tokenHash);
			} else {
				await supabaseAdmin.from('auth_sessions').delete().eq('session_token_hash', tokenHash);
				event.cookies.delete(SESSION_COOKIE_NAME, {
					path: '/',
					httpOnly: true,
					secure: true,
					sameSite: 'lax'
				});
			}
		} else {
			event.cookies.delete(SESSION_COOKIE_NAME, {
				path: '/',
				httpOnly: true,
				secure: true,
				sameSite: 'lax'
			});
		}
	}

	// --- Beta access gate (site-wide password protection) ---
	const publicRoutes = ['/access', '/api'];
	const isPublicRoute = publicRoutes.some(
		(route) => event.url.pathname === route || event.url.pathname.startsWith(route + '/')
	);

	if (!isPublicRoute) {
		const accessCookie = event.cookies.get('guncad_access');
		if (!isValidAccessCookie(accessCookie)) {
			throw redirect(303, '/access');
		}
	}

	// Redirect logged-in users away from login page
	if (event.url.pathname === '/login' && event.locals.session) {
		throw redirect(303, '/');
	}

	// Account-specific routes require a session
	const accountRoutes = ['/user'];
	const isAccountRoute = accountRoutes.some(
		(route) => event.url.pathname === route || event.url.pathname.startsWith(route + '/')
	);

	if (isAccountRoute && !event.locals.session) {
		throw redirect(303, '/login');
	}

	return resolve(event);
};
