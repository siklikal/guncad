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

	// Get the current session from cookies
	const {
		data: { session }
	} = await event.locals.supabase.auth.getSession();

	event.locals.session = session;

	// Define protected routes (routes that require authentication)
	const protectedRoutes = ['/', '/details', '/collections', '/tag', '/exclusive', '/featured', '/trending', '/premium-models'];
	const publicRoutes = ['/login', '/terms'];

	// Check if current path is a protected route
	const isProtectedRoute = protectedRoutes.some((route) =>
		event.url.pathname === route || event.url.pathname.startsWith(route + '/')
	);

	// If accessing a protected route without a session, redirect to login
	if (isProtectedRoute && !session) {
		throw redirect(303, '/login');
	}

	// If accessing login page while already logged in, redirect to home
	if (event.url.pathname === '/login' && session) {
		throw redirect(303, '/');
	}

	return resolve(event);
};
