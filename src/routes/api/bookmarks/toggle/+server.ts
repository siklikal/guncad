import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const session = locals.session;

		if (!session?.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { modelId } = await request.json();

		if (!modelId) {
			return json({ error: 'Model ID is required' }, { status: 400 });
		}

		const supabase = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

		// Check if bookmark exists
		const { data: existing } = await supabase
			.from('bookmarks')
			.select('id')
			.eq('user_id', session.user.id)
			.eq('model_id', modelId)
			.single();

		if (existing) {
			// Remove bookmark
			const { error } = await supabase
				.from('bookmarks')
				.delete()
				.eq('user_id', session.user.id)
				.eq('model_id', modelId);

			if (error) {
				console.error('[toggle-bookmark] Error removing bookmark:', error);
				return json({ error: 'Failed to remove bookmark' }, { status: 500 });
			}

			return json({ bookmarked: false });
		} else {
			// Add bookmark
			const { error } = await supabase.from('bookmarks').insert({
				user_id: session.user.id,
				model_id: modelId
			});

			if (error) {
				console.error('[toggle-bookmark] Error adding bookmark:', error);
				return json({ error: 'Failed to add bookmark' }, { status: 500 });
			}

			return json({ bookmarked: true });
		}
	} catch (error) {
		console.error('[toggle-bookmark] Error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
