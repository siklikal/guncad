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
			.select('*')
			.eq('user_id', user.id)
			.eq('project_id', projectId)
			.single();

		let isLiked = false;

		if (existingLike) {
			// Unlike: remove from user_likes
			const { error: deleteError } = await supabase
				.from('user_likes')
				.delete()
				.eq('user_id', user.id)
				.eq('project_id', projectId);

			if (deleteError) throw deleteError;

			// Decrement our_likes in project_stats
			const { data: stats } = await supabase
				.from('project_stats')
				.select('*')
				.eq('project_id', projectId)
				.single();

			if (stats) {
				await supabase
					.from('project_stats')
					.update({
						our_likes: Math.max(0, stats.our_likes - 1),
						updated_at: new Date().toISOString()
					})
					.eq('project_id', projectId);
			}

			isLiked = false;
		} else {
			// Like: add to user_likes
			const { error: insertError } = await supabase.from('user_likes').insert({
				user_id: user.id,
				project_id: projectId
			});

			if (insertError) throw insertError;

			// Increment our_likes in project_stats (or create if doesn't exist)
			const { data: stats } = await supabase
				.from('project_stats')
				.select('*')
				.eq('project_id', projectId)
				.single();

			if (stats) {
				await supabase
					.from('project_stats')
					.update({
						our_likes: stats.our_likes + 1,
						updated_at: new Date().toISOString()
					})
					.eq('project_id', projectId);
			} else {
				// Create new stats record if it doesn't exist
				await supabase.from('project_stats').insert({
					project_id: projectId,
					base_views: 0,
					base_likes: 0,
					our_views: 0,
					our_likes: 1,
					our_downloads: 0
				});
			}

			isLiked = true;
		}

		// Fetch updated stats
		const { data: updatedStats } = await supabase
			.from('project_stats')
			.select('*')
			.eq('project_id', projectId)
			.single();

		// Get bookmarks count for this project
		const { count: bookmarksCount } = await supabase
			.from('bookmarks')
			.select('*', { count: 'exact', head: true })
			.eq('model_id', projectId);

		return json({
			success: true,
			isLiked,
			stats: {
				views: (updatedStats?.base_views || 0) + (updatedStats?.our_views || 0),
				likes: (updatedStats?.base_likes || 0) + (updatedStats?.our_likes || 0),
				bookmarks: bookmarksCount || 0,
				downloads: updatedStats?.our_downloads || 0
			}
		});
	} catch (error) {
		console.error('[toggle-like] Error:', error);
		return json({ error: 'Failed to toggle like' }, { status: 500 });
	}
};
