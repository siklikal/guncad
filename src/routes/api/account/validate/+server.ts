import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { isValidAccountNumber, normalizeAccountNumber } from '$lib/utils/accountNumber';
import { buildLookupToken } from '$lib/server/accountAuth';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { accountNumber } = await request.json();
		const normalized = normalizeAccountNumber(accountNumber || '');

		if (!isValidAccountNumber(normalized)) {
			return json({ valid: false, error: 'Account number must be 16 digits' }, { status: 400 });
		}

		const supabase = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
		const lookupToken = buildLookupToken(normalized);

		const { data: identity, error } = await supabase
			.from('account_identities')
			.select('user_id')
			.eq('lookup_token', lookupToken)
			.single();

		if (error || !identity) {
			return json({ valid: false, error: 'Account not found' }, { status: 404 });
		}

		const { data: profile } = await supabase
			.from('user_profiles')
			.select('status')
			.eq('id', identity.user_id)
			.single();

		if (!profile || profile.status !== 'active') {
			const status = profile?.status || 'unknown';
			return json(
				{ valid: false, error: `Account status: ${status}` },
				{ status: 403 }
			);
		}

		return json({ valid: true, userId: identity.user_id });
	} catch (error) {
		console.error('[account/validate] Error:', error);
		return json({ valid: false, error: 'Internal server error' }, { status: 500 });
	}
};
