import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

// Service role client for querying subscriptions
const supabaseAdmin = createClient(
	PUBLIC_SUPABASE_URL,
	SUPABASE_SERVICE_ROLE_KEY,
	{
		auth: {
			autoRefreshToken: false,
			persistSession: false
		}
	}
);

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const { modelId } = await request.json();

		if (!modelId) {
			return json({ error: 'Model ID is required' }, { status: 400 });
		}

		// Check if user is authenticated using the session from locals
		// (set up in hooks.server.ts)
		const session = locals.session;

		if (!session?.user) {
			return json(
				{
					canDownload: false,
					reason: 'not_authenticated'
				},
				{ status: 401 }
			);
		}

		const user = session.user;

		// Check for active subscription using admin client
		const { data: subscription, error: subError } = await supabaseAdmin
			.from('subscriptions')
			.select('id, status, started_at, expires_at')
			.eq('user_id', user.id)
			.eq('status', 'active')
			.gt('expires_at', new Date().toISOString())
			.order('expires_at', { ascending: false })
			.limit(1)
			.single();

		if (subError && subError.code !== 'PGRST116') {
			// PGRST116 = no rows returned, which is fine
			console.error('Error checking subscription:', subError);
			return json(
				{ error: 'Failed to check subscription status' },
				{ status: 500 }
			);
		}

		// Has active subscription
		if (subscription) {
			return json({
				canDownload: true,
				reason: 'subscription',
				subscription: {
					status: subscription.status,
					expiresAt: subscription.expires_at
				}
			});
		}

		// Check if user previously purchased this specific model
		const { data: purchase, error: purchaseError } = await supabaseAdmin
			.from('payments')
			.select('id, model_id')
			.eq('user_id', user.id)
			.eq('model_id', modelId)
			.eq('payment_type', 'model')
			.eq('status', 'completed')
			.limit(1)
			.single();

		if (purchaseError && purchaseError.code !== 'PGRST116') {
			console.error('Error checking model purchase:', purchaseError);
			return json(
				{ error: 'Failed to check purchase status' },
				{ status: 500 }
			);
		}

		// Has purchased this model
		if (purchase) {
			return json({
				canDownload: true,
				reason: 'purchased'
			});
		}

		// No entitlement found
		return json({
			canDownload: false,
			reason: 'no_subscription'
		});
	} catch (error) {
		console.error('Error in check-entitlement:', error);
		return json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
};
