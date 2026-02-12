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

		const user = session.user;

		const { projectId } = await request.json();

		if (!projectId) {
			return json({ error: 'Project ID is required' }, { status: 400 });
		}

		// Use service role client to bypass RLS for stats table
		const supabase = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

		// Check if user has already liked this project
		const { data: existingLike } = await supabase
			.from('user_likes')
			.select('id')
			.eq('user_id', user.id)
			.eq('project_id', projectId)
			.maybeSingle();

		let isLiked = false;

		if (existingLike) {
			// Unlike: remove from user_likes and decrement our_likes
			await Promise.all([
				supabase
					.from('user_likes')
					.delete()
					.eq('user_id', user.id)
					.eq('project_id', projectId),
				supabase.rpc('decrement_likes', { p_project_id: projectId })
			]);
			isLiked = false;
		} else {
			// Like: add to user_likes and increment our_likes
			await Promise.all([
				supabase.from('user_likes').insert({
					user_id: user.id,
					project_id: projectId
				}),
				supabase.rpc('increment_likes', { p_project_id: projectId })
			]);
			isLiked = true;
		}

		// Fetch all final data in parallel
		const [statsResult, bookmarksResult, downloadsResult] = await Promise.all([
			supabase.from('project_stats').select('*').eq('project_id', projectId).maybeSingle(),
			supabase
				.from('bookmarks')
				.select('*', { count: 'exact', head: true })
				.eq('model_id', projectId),
			supabase
				.from('downloads')
				.select('*', { count: 'exact', head: true })
				.eq('model_id', projectId)
		]);

		const stats = statsResult.data;
		const bookmarksCount = bookmarksResult.count;
		const downloadsCount = downloadsResult.count;

		return json({
			success: true,
			isLiked,
			stats: {
				views: (stats?.base_views || 0) + (stats?.our_views || 0),
				likes: (stats?.base_likes || 0) + (stats?.our_likes || 0),
				bookmarks: bookmarksCount || 0,
				downloads: (stats?.our_downloads || 0) + (downloadsCount || 0)
			}
		});
	} catch (error) {
		console.error('[toggle-like] Error:', error);
		return json({ error: 'Failed to toggle like' }, { status: 500 });
	}
};
