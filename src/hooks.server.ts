import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit';
import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

/**
 * SvelteKit server hook that runs on EVERY request before any page loads
 *
 * This ensures authentication is checked server-side BEFORE rendering any page,
 * preventing the flash of unauthenticated content that occurs with client-side checks.
 *
 * Protected routes (require login):
 * - / (home page)
 * - /details/*
 * - /collections/*
 * - /tag/*
 * - /exclusive
 * - /featured
 * - /trending
 * - /premium-models
 *
 * Public routes (no login required):
 * - /login
 * - /terms
 */
export const handle: Handle = async ({ event, resolve }) => {
	// Create a Supabase client for server-side auth checking
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

	// Get the current user (validates JWT token with Supabase auth server)
	const {
		data: { user },
		error
	} = await event.locals.supabase.auth.getUser();

	// Create session object from user if authenticated
	event.locals.session = user
		? {
				user,
				access_token: '',
				refresh_token: '',
				expires_in: 0,
				expires_at: 0,
				token_type: 'bearer'
		  }
		: null;

	// Define protected routes (routes that require authentication)
	const protectedRoutes = ['/', '/details', '/collections', '/tag', '/exclusive', '/featured', '/trending', '/premium-models', '/user'];
	const publicRoutes = ['/login', '/terms', '/pending-approval'];

	// Check if current path is a protected route
	const isProtectedRoute = protectedRoutes.some((route) =>
		event.url.pathname === route || event.url.pathname.startsWith(route + '/')
	);

	// If accessing a protected route without a session, redirect to login
	if (isProtectedRoute && !event.locals.session) {
		throw redirect(303, '/login');
	}

	// If user has a session, check if they're approved
	if (event.locals.session && isProtectedRoute) {
		const { data: profile } = await event.locals.supabase
			.from('user_profiles')
			.select('is_approved')
			.eq('id', event.locals.session.user.id)
			.single();

		// If user is not approved, redirect to pending approval page
		if (profile && !profile.is_approved) {
			throw redirect(303, '/pending-approval');
		}
	}

	// If accessing login page while already logged in and approved, redirect to home
	if (event.url.pathname === '/login' && event.locals.session) {
		const { data: profile } = await event.locals.supabase
			.from('user_profiles')
			.select('is_approved')
			.eq('id', event.locals.session.user.id)
			.single();

		if (profile?.is_approved) {
			throw redirect(303, '/');
		} else {
			throw redirect(303, '/pending-approval');
		}
	}

	return resolve(event);
};
