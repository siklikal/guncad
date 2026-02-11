import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { projectId, baseViews, baseLikes } = await request.json();
		const normalizedBaseViews =
			typeof baseViews === 'number' ? baseViews : Number(baseViews ?? 0);
		const normalizedBaseLikes =
			typeof baseLikes === 'number' ? baseLikes : Number(baseLikes ?? 0);

		if (!projectId) {
			return json({ error: 'Project ID is required' }, { status: 400 });
		}

		// Use service role client to bypass RLS
		const supabase = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

		// Try to get existing stats
		const { data: existing } = await supabase
			.from('project_stats')
			.select('*')
			.eq('project_id', projectId)
			.single();

		if (existing) {
			// Update: increment our_views and update base stats if provided
			const updates: any = {
				our_views: existing.our_views + 1,
				updated_at: new Date().toISOString()
			};

			// Update base stats if provided (cache latest from GCI)
			if (baseViews !== undefined) {
				updates.base_views = normalizedBaseViews;
			}
			if (baseLikes !== undefined) {
				updates.base_likes = normalizedBaseLikes;
			}

			const { error: updateError } = await supabase
				.from('project_stats')
				.update(updates)
				.eq('project_id', projectId);

			if (updateError) throw updateError;

			// Return combined stats
			return json({
				success: true,
				stats: {
					views: (updates.base_views ?? existing.base_views ?? 0) + updates.our_views,
					likes: (updates.base_likes ?? existing.base_likes ?? 0) + (existing.our_likes ?? 0),
					downloads: existing.our_downloads
				}
			});
		} else {
			// Insert new record
			const { error: insertError } = await supabase.from('project_stats').insert({
				project_id: projectId,
				base_views: normalizedBaseViews,
				base_likes: normalizedBaseLikes,
				our_views: 1, // First view on our site
				our_likes: 0,
				our_downloads: 0
			});

			if (insertError) throw insertError;

			// Return combined stats
			return json({
				success: true,
				stats: {
					views: normalizedBaseViews + 1,
					likes: normalizedBaseLikes,
					downloads: 0
				}
			});
		}
	} catch (error) {
		console.error('[track-view] Error:', error);
		return json({ error: 'Failed to track view' }, { status: 500 });
	}
};
