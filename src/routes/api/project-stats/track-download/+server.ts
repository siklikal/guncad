import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { projectId } = await request.json();

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
			// Increment our_downloads
			const { error: updateError } = await supabase
				.from('project_stats')
				.update({
					our_downloads: existing.our_downloads + 1,
					updated_at: new Date().toISOString()
				})
				.eq('project_id', projectId);

			if (updateError) throw updateError;

			return json({
				success: true,
				downloads: existing.our_downloads + 1
			});
		} else {
			// Create new stats record
			const { error: insertError } = await supabase.from('project_stats').insert({
				project_id: projectId,
				base_views: 0,
				base_likes: 0,
				our_views: 0,
				our_likes: 0,
				our_downloads: 1
			});

			if (insertError) throw insertError;

			return json({
				success: true,
				downloads: 1
			});
		}
	} catch (error) {
		console.error('[track-download] Error:', error);
		return json({ error: 'Failed to track download' }, { status: 500 });
	}
};
