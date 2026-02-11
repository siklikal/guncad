import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';

export const GET: RequestHandler = async ({ params, locals }) => {
	try {
		const { projectId } = params;

		if (!projectId) {
			return json({ error: 'Project ID is required' }, { status: 400 });
		}

		const session = locals.session;
		const user = session?.user;

		// Use service role client
		const supabase = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

		// Fetch project stats
		const { data: stats } = await supabase
			.from('project_stats')
			.select('*')
			.eq('project_id', projectId)
			.single();

		// Check if current user has liked this project
		let isLiked = false;
		if (user) {
			const { data: userLike } = await supabase
				.from('user_likes')
				.select('*')
				.eq('user_id', user.id)
				.eq('project_id', projectId)
				.single();

			isLiked = !!userLike;
		}

		// Get bookmarks count for this project
		const { count: bookmarksCount } = await supabase
			.from('bookmarks')
			.select('*', { count: 'exact', head: true })
			.eq('model_id', projectId);

		// Get downloads count for this project
		const { count: downloadsCount } = await supabase
			.from('downloads')
			.select('*', { count: 'exact', head: true })
			.eq('model_id', projectId);

		return json({
			success: true,
			stats: {
				views: (stats?.base_views || 0) + (stats?.our_views || 0),
				likes: (stats?.base_likes || 0) + (stats?.our_likes || 0),
				bookmarks: bookmarksCount || 0,
				downloads: (stats?.our_downloads || 0) + (downloadsCount || 0)
			},
			isLiked
		});
	} catch (error) {
		console.error('[project-stats] Error:', error);
		return json({ error: 'Failed to fetch project stats' }, { status: 500 });
	}
};
