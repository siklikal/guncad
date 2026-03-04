import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

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

		if (purchase) {
			return json({
				canDownload: true,
				reason: 'purchased'
			});
		}

		// No entitlement found
		return json({
			canDownload: false,
			reason: 'no_purchase'
		});
	} catch (error) {
		console.error('Error in check-entitlement:', error);
		return json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
};
