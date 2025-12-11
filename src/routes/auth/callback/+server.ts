import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
	const token_hash = url.searchParams.get('token_hash');
	const type = url.searchParams.get('type');
	const code = url.searchParams.get('code');
	const next = url.searchParams.get('next') || '/user/settings';

	// Handle PKCE flow (code)
	if (code) {
		const { data, error } = await locals.supabase.auth.exchangeCodeForSession(code);

		if (error) {
			console.error('Error exchanging code for session:', error);
			throw redirect(303, `/user/settings?error=${encodeURIComponent(error.message)}`);
		}

		console.log('Successfully exchanged code, new email:', data.session?.user?.email);
		throw redirect(303, `/user/settings?success=Email updated successfully!`);
	}

	// Handle legacy flow (token_hash) for email verification
	if (token_hash && type) {
		const { data, error } = await locals.supabase.auth.verifyOtp({
			token_hash,
			type: type as any
		});

		if (error) {
			console.error('Error verifying OTP:', error);
			throw redirect(303, `/user/settings?error=${encodeURIComponent(error.message)}`);
		}

		console.log('Full OTP verification data:', JSON.stringify(data, null, 2));
		console.log('User email:', data.user?.email);
		console.log('Session exists:', !!data.session);

		// Set the session cookies after verification
		if (data.session) {
			await locals.supabase.auth.setSession({
				access_token: data.session.access_token,
				refresh_token: data.session.refresh_token
			});
			console.log('Session set with new email:', data.session.user?.email);
		}

		throw redirect(303, `/user/settings?success=Email updated successfully!`);
	}

	// No code or token provided - just redirect
	console.log('No code or token_hash found in callback');
	throw redirect(303, next);
};
