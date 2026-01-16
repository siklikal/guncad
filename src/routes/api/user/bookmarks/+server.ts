import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';

export const GET: RequestHandler = async ({ locals, fetch }) => {
	try {
		const session = locals.session;

		if (!session?.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const supabase = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

		// Fetch user's bookmarks
		const { data: bookmarks, error } = await supabase
			.from('bookmarks')
			.select('*')
			.eq('user_id', session.user.id)
			.order('created_at', { ascending: false });

		if (error) {
			console.error('[user/bookmarks] Database error:', error);
			return json({ error: 'Failed to fetch bookmarks' }, { status: 500 });
		}

		// Fetch project details for each bookmark from GCI
		const bookmarksWithDetails = await Promise.all(
			(bookmarks || []).map(async (bookmark) => {
				try {
					// Fetch project details from GCI
					const gciUrl = `https://guncadindex.com/detail/${bookmark.model_id}`;
					const projectResponse = await fetch('/api/project-details', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ urls: [gciUrl] })
					});

					if (projectResponse.ok) {
						const projectData = await projectResponse.json();
						const project = projectData.projects[0];

						return {
							id: bookmark.id,
							model_id: bookmark.model_id,
							model_title: project?.title || bookmark.model_id,
							model_image: project?.image || 'https://via.placeholder.com/400x225/374151/9ca3af?text=No+Image',
							bookmarked_at: bookmark.created_at
						};
					}
				} catch (error) {
					console.error(`Failed to fetch details for ${bookmark.model_id}:`, error);
				}

				// Fallback if project details fetch fails
				return {
					id: bookmark.id,
					model_id: bookmark.model_id,
					model_title: bookmark.model_id,
					model_image: 'https://via.placeholder.com/400x225/374151/9ca3af?text=No+Image',
					bookmarked_at: bookmark.created_at
				};
			})
		);

		return json({ bookmarks: bookmarksWithDetails });
	} catch (error) {
		console.error('[user/bookmarks] Error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
