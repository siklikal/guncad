import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { isValidAccountNumber, normalizeAccountNumber } from '$lib/utils/accountNumber';
import {
	buildLookupToken,
	generateOpaqueSessionToken,
	getSessionExpiryDate,
	hashSessionToken,
	SESSION_COOKIE_NAME
} from '$lib/server/accountAuth';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const { accountNumber } = await request.json();
		const normalized = normalizeAccountNumber(accountNumber || '');

		if (!isValidAccountNumber(normalized)) {
			return json({ error: 'Account number must be 16 digits' }, { status: 400 });
		}

		const supabase = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
		const lookupToken = buildLookupToken(normalized);

		const { data: identity, error } = await supabase
			.from('account_identities')
			.select('user_id')
			.eq('lookup_token', lookupToken)
			.single();

		if (error || !identity) {
			return json({ error: 'Invalid account number' }, { status: 401 });
		}

		const { data: profile } = await supabase
			.from('user_profiles')
			.select('status')
			.eq('id', identity.user_id)
			.single();

		if (!profile || profile.status !== 'active') {
			return json({ error: 'Account is pending approval' }, { status: 403 });
		}

		const sessionToken = generateOpaqueSessionToken();
		const sessionTokenHash = hashSessionToken(sessionToken);
		const expiresAt = getSessionExpiryDate();

		const { error: sessionError } = await supabase
			.from('auth_sessions')
			.insert({
				user_id: identity.user_id,
				session_token_hash: sessionTokenHash,
				expires_at: expiresAt.toISOString()
			});

		if (sessionError) {
			return json({ error: sessionError.message }, { status: 500 });
		}

		cookies.set(SESSION_COOKIE_NAME, sessionToken, {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			expires: expiresAt
		});

		return json({ success: true });
	} catch (error) {
		console.error('[account/login] Error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
