import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';

export const GET: RequestHandler = async () => {
	try {
		const supabase = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

		// Try to query the payments table
		const { data, error } = await supabase
			.from('payments')
			.select('*')
			.limit(1);

		if (error) {
			return json({
				success: false,
				error: error.message,
				details: error
			});
		}

		return json({
			success: true,
			message: 'Database connection successful',
			tableExists: true,
			sampleData: data
		});
	} catch (error) {
		return json({
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error'
		});
	}
};
