import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit';
import { supabase } from '$lib/supabase';

export const handle: Handle = async ({ event, resolve }) => {
	// Get the session from cookies
	const {
		data: { session }
	} = await supabase.auth.getSession();

	// Public routes that don't require authentication
	const publicRoutes = ['/login'];
	const isPublicRoute = publicRoutes.some((route) => event.url.pathname.startsWith(route));

	// If not authenticated and trying to access protected route
	if (!session && !isPublicRoute) {
		throw redirect(303, '/login');
	}

	// If authenticated and trying to access login page, redirect to home
	if (session && event.url.pathname === '/login') {
		throw redirect(303, '/');
	}

	return resolve(event);
};
