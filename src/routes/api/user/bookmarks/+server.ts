import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';

interface BookmarkWithDetails {
	id: string;
	model_id: string;
	model_title: string;
	model_image: string;
	bookmarked_at: string;
}

interface ProjectDetailsSummary {
	title?: string;
	image?: string;
	url?: string;
}

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
		let bookmarksWithDetails: BookmarkWithDetails[] = [];

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
					const projects: ProjectDetailsSummary[] = Array.isArray(projectData.projects)
						? projectData.projects
						: [];
					const projectsByUrl = new Map(
						projects
							.filter((project) => typeof project.url === 'string' && project.url.length > 0)
							.map((project) => [project.url!, project] as const)
					);

					bookmarksWithDetails = bookmarks.map((bookmark) => {
						const projectUrl = `https://guncadindex.com/detail/${bookmark.model_id}`;
						const project = projectsByUrl.get(projectUrl);
						const resolvedTitle =
							project?.title && project.title !== 'Unknown Title' ? project.title : bookmark.model_id;
						const resolvedImage =
							project?.title && project.title !== 'Unknown Title' && project.image
								? project.image
								: 'https://via.placeholder.com/400x225/374151/9ca3af?text=No+Image';

						return {
							id: bookmark.id,
							model_id: bookmark.model_id,
							model_title: resolvedTitle,
							model_image: resolvedImage,
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
