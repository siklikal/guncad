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

		// Create Supabase client with service role
		const supabase = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

		// Get all completed purchases for this user
		const { data: payments, error } = await supabase
			.from('payments')
			.select('*')
			.eq('user_id', session.user.id)
			.eq('status', 'completed')
			.eq('payment_type', 'model')
			.order('created_at', { ascending: false });

		if (error) {
			console.error('[user/purchases] Database error:', error);
			return json({ error: 'Failed to fetch purchases' }, { status: 500 });
		}

		// Batch fetch all project details from GCI in a single API call
		let purchasesWithDetails = [];

		if (payments && payments.length > 0) {
			// Build array of all GCI URLs
			const gciUrls = payments.map(
				(payment) => `https://guncadindex.com/detail/${payment.model_id}`
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

					// Map projects to purchases (order is preserved)
					purchasesWithDetails = payments.map((payment, index) => {
						const project = projects[index];

						return {
							id: payment.id,
							model_id: payment.model_id,
							model_title: project?.title || payment.model_id,
							model_image:
								project?.image ||
								'https://via.placeholder.com/400x225/374151/9ca3af?text=No+Image',
							amount: payment.amount,
							currency: payment.currency,
							purchased_at: payment.created_at,
							transaction_id: payment.authorize_net_transaction_id
						};
					});
				} else {
					// If batch fetch fails, return payments with fallback data
					purchasesWithDetails = payments.map((payment) => ({
						id: payment.id,
						model_id: payment.model_id,
						model_title: payment.model_id,
						model_image: 'https://via.placeholder.com/400x225/374151/9ca3af?text=No+Image',
						amount: payment.amount,
						currency: payment.currency,
						purchased_at: payment.created_at,
						transaction_id: payment.authorize_net_transaction_id
					}));
				}
			} catch (error) {
				console.error('[user/purchases] Failed to fetch project details:', error);
				// Return payments with fallback data
				purchasesWithDetails = payments.map((payment) => ({
					id: payment.id,
					model_id: payment.model_id,
					model_title: payment.model_id,
					model_image: 'https://via.placeholder.com/400x225/374151/9ca3af?text=No+Image',
					amount: payment.amount,
					currency: payment.currency,
					purchased_at: payment.created_at,
					transaction_id: payment.authorize_net_transaction_id
				}));
			}
		}

		return json({ purchases: purchasesWithDetails });
	} catch (error) {
		console.error('[user/purchases] Error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
