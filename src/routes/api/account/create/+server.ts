import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { buildLookupToken } from '$lib/server/accountAuth';
import { randomInt, randomUUID } from 'crypto';

const ACCOUNT_NUMBER_LENGTH = 16;
const MAX_RETRIES = 5;

function generateAccountNumber(): string {
	let out = '';
	for (let i = 0; i < ACCOUNT_NUMBER_LENGTH; i += 1) {
		out += randomInt(0, 10).toString();
	}
	return out;
}

function generateInternalEmail(): string {
	return `internal_${randomUUID()}@accounts.guncad.local`;
}

function generateInternalPassword(): string {
	return randomUUID() + randomUUID();
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { acceptedTos } = await request.json();
		if (!acceptedTos) {
			return json({ error: 'Terms of Service acceptance is required' }, { status: 400 });
		}

		const supabase = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

		for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
			const accountNumber = generateAccountNumber();
			const lookupToken = buildLookupToken(accountNumber);

			const { data: createdUser, error: createUserError } = await supabase.auth.admin.createUser({
				email: generateInternalEmail(),
				password: generateInternalPassword(),
				email_confirm: true,
				user_metadata: { account_number_enabled: true }
			});

			if (createUserError || !createdUser?.user) {
				return json({ error: createUserError?.message || 'Failed to create user' }, { status: 500 });
			}

			const userId = createdUser.user.id;

			const { error: identityError } = await supabase
				.from('account_identities')
				.insert({
					user_id: userId,
					lookup_token: lookupToken
				});

			if (identityError) {
				// Cleanup auth user on collision/failure so we don't leave orphaned users.
				await supabase.auth.admin.deleteUser(userId);

				const details = `${identityError.message} ${identityError.code ?? ''}`.toLowerCase();
				const isDuplicate =
					details.includes('already') ||
					details.includes('duplicate') ||
					details.includes('exists') ||
					details.includes('unique');
				if (isDuplicate) {
					continue;
				}
				return json({ error: identityError.message }, { status: 500 });
			}

			return json({ success: true, accountNumber });
		}

		return json({ error: 'Failed to generate a unique account number. Please retry.' }, { status: 500 });
	} catch (error) {
		console.error('[account/create] Error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
