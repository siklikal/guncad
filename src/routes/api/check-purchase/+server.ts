import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const session = locals.session;

		if (!session?.user) {
			return json({ purchased: false }, { status: 401 });
		}

		const { modelId } = await request.json();

		if (!modelId) {
			return json({ error: 'Model ID is required' }, { status: 400 });
		}

		// Create Supabase client with service role to bypass RLS
		const supabase = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

		// Check if user has purchased this model
		const { data, error } = await supabase
			.from('payments')
			.select('id')
			.eq('user_id', session.user.id)
			.eq('model_id', modelId)
			.eq('status', 'completed')
			.eq('payment_type', 'model')
			.limit(1);

		if (error) {
			console.error('[check-purchase] Database error:', error);
			return json({ error: 'Failed to check purchase status' }, { status: 500 });
		}

		return json({ purchased: data && data.length > 0 });
	} catch (error) {
		console.error('[check-purchase] Error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
