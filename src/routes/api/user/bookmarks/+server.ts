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

		// Batch fetch all project details from GCI in a single API call
		let bookmarksWithDetails = [];

		if (bookmarks && bookmarks.length > 0) {
			// Build array of all GCI URLs
			const gciUrls = bookmarks.map(
				(bookmark) => `https://guncadindex.com/detail/${bookmark.model_id}`
			);

			try {
				// Single batched API call to fetch all project details
				const projectResponse = await fetch('/api/project-details', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ urls: gciUrls })
				});

				if (projectResponse.ok) {
					const projectData = await projectResponse.json();
					const projects = projectData.projects;

					// Map projects to bookmarks (order is preserved)
					bookmarksWithDetails = bookmarks.map((bookmark, index) => {
						const project = projects[index];

						return {
							id: bookmark.id,
							model_id: bookmark.model_id,
							model_title: project?.title || bookmark.model_id,
							model_image:
								project?.image ||
								'https://via.placeholder.com/400x225/374151/9ca3af?text=No+Image',
							bookmarked_at: bookmark.created_at
						};
					});
				} else {
					// If batch fetch fails, return bookmarks with fallback data
					bookmarksWithDetails = bookmarks.map((bookmark) => ({
						id: bookmark.id,
						model_id: bookmark.model_id,
						model_title: bookmark.model_id,
						model_image: 'https://via.placeholder.com/400x225/374151/9ca3af?text=No+Image',
						bookmarked_at: bookmark.created_at
					}));
				}
			} catch (error) {
				console.error('[user/bookmarks] Failed to fetch project details:', error);
				// Return bookmarks with fallback data
				bookmarksWithDetails = bookmarks.map((bookmark) => ({
					id: bookmark.id,
					model_id: bookmark.model_id,
					model_title: bookmark.model_id,
					model_image: 'https://via.placeholder.com/400x225/374151/9ca3af?text=No+Image',
					bookmarked_at: bookmark.created_at
				}));
			}
		}

		return json({ bookmarks: bookmarksWithDetails });
	} catch (error) {
		console.error('[user/bookmarks] Error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
