import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const session = locals.session;

		if (!session?.user) {
			return json({ bookmarked: false }, { status: 401 });
		}

		const { modelId } = await request.json();

		if (!modelId) {
			return json({ error: 'Model ID is required' }, { status: 400 });
		}

		const supabase = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

		// Check if bookmark exists
		const { data } = await supabase
			.from('bookmarks')
			.select('id')
			.eq('user_id', session.user.id)
			.eq('model_id', modelId)
			.single();

		return json({ bookmarked: !!data });
	} catch (error) {
		console.error('[check-bookmark] Error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
