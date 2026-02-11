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

		// Fetch user's likes
		const { data: likes, error } = await supabase
			.from('user_likes')
			.select('*')
			.eq('user_id', session.user.id)
			.order('created_at', { ascending: false });

		if (error) {
			console.error('[user/likes] Database error:', error);
			return json({ error: 'Failed to fetch likes' }, { status: 500 });
		}

		let likesWithDetails: Array<{
			id: string;
			model_id: string;
			model_title: string;
			model_image: string;
			liked_at: string;
		}> = [];

		if (likes && likes.length > 0) {
			const gciUrls = likes.map((like) => `https://guncadindex.com/detail/${like.project_id}`);

			try {
				const projectResponse = await fetch('/api/project-details', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ urls: gciUrls })
				});

				if (projectResponse.ok) {
					const projectData = await projectResponse.json();
					const projects = projectData.projects;

					likesWithDetails = likes.map((like, index) => {
						const project = projects[index];

						return {
							id: like.id,
							model_id: like.project_id,
							model_title: project?.title || like.project_id,
							model_image:
								project?.image ||
								'https://via.placeholder.com/400x225/374151/9ca3af?text=No+Image',
							liked_at: like.created_at
						};
					});
				} else {
					likesWithDetails = likes.map((like) => ({
						id: like.id,
						model_id: like.project_id,
						model_title: like.project_id,
						model_image: 'https://via.placeholder.com/400x225/374151/9ca3af?text=No+Image',
						liked_at: like.created_at
					}));
				}
			} catch (error) {
				console.error('[user/likes] Failed to fetch project details:', error);
				likesWithDetails = likes.map((like) => ({
					id: like.id,
					model_id: like.project_id,
					model_title: like.project_id,
					model_image: 'https://via.placeholder.com/400x225/374151/9ca3af?text=No+Image',
					liked_at: like.created_at
				}));
			}
		}

		return json({ likes: likesWithDetails });
	} catch (error) {
		console.error('[user/likes] Error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
