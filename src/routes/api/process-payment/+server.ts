import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	ADN_TRANSACTION_KEY,
	ADN_API_ENDPOINT,
	SUPABASE_SERVICE_ROLE_KEY
} from '$env/static/private';
import { PUBLIC_ADN_API_LOGIN_ID, PUBLIC_MODEL_PURCHASE_PRICE, PUBLIC_SUPABASE_URL } from '$env/static/public';
import { createClient } from '@supabase/supabase-js';
import { checkGeoPurchase, getClientIp } from '$lib/server/geoCheck';
import { env } from '$env/dynamic/private';

interface PaymentRequest {
	opaqueDataDescriptor: string;
	opaqueDataValue: string;
	modelId: string;
	modelTitle: string;
	firstName: string;
	lastName: string;
	zipCode: string;
	guestPurchase?: boolean;
	userId?: string;
}

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const session = locals.session;

		const {
			opaqueDataDescriptor,
			opaqueDataValue,
			modelId,
			modelTitle,
			firstName,
			lastName,
			zipCode,
			guestPurchase,
			userId: providedUserId
		}: PaymentRequest = await request.json();

		// Determine the user ID for this payment
		let paymentUserId: string | null = null;
		if (guestPurchase) {
			// Guest purchase — no user association
			paymentUserId = null;
		} else if (providedUserId) {
			// Explicit user ID (new account or existing account option)
			paymentUserId = providedUserId;
		} else if (session?.user) {
			// Logged-in user (legacy flow)
			paymentUserId = session.user.id;
		} else {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Geo-restriction safety net
		if (env.BYPASS_GEO_CHECK !== 'true') {
			const ip = getClientIp(request);
			const geoResult = await checkGeoPurchase(ip);
			if (!geoResult.allowed) {
				return json({ success: false, error: geoResult.reason }, { status: 403 });
			}
		}

		// Build Authorize.Net API request
		// IMPORTANT: Field order matters in Authorize.Net XML schema!
		// - 'order' must come before 'billTo'
		// - Within 'order', 'invoiceNumber' must come before 'description'
		// - invoiceNumber has a max length of 20 characters
		const authNetRequest = {
			createTransactionRequest: {
				merchantAuthentication: {
					name: PUBLIC_ADN_API_LOGIN_ID,
					transactionKey: ADN_TRANSACTION_KEY
				},
				transactionRequest: {
					transactionType: 'authCaptureTransaction',
					amount: PUBLIC_MODEL_PURCHASE_PRICE,
					payment: {
						opaqueData: {
							dataDescriptor: opaqueDataDescriptor,
							dataValue: opaqueDataValue
						}
					},
					order: {
						invoiceNumber: `${Date.now()}`,
						description: `Model Purchase: ${modelTitle}`
					},
					billTo: {
						firstName: firstName,
						lastName: lastName,
						zip: zipCode
					}
				}
			}
		};

		// Call Authorize.Net API
		const response = await fetch(ADN_API_ENDPOINT, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(authNetRequest)
		});

		const responseData = await response.json();

		// Check if payment was successful
		if (responseData.messages.resultCode === 'Ok') {
			const transactionResponse = responseData.transactionResponse;

			if (transactionResponse.responseCode === '1') {
				// Payment approved — record in Supabase
				const supabase = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

				const { data: insertData, error: dbError } = await supabase.from('payments').insert({
					user_id: paymentUserId,
					model_id: modelId,
					amount: parseFloat(PUBLIC_MODEL_PURCHASE_PRICE),
					currency: 'USD',
					status: 'completed',
					payment_type: 'model',
					authorize_net_transaction_id: transactionResponse.transId,
					authorize_net_response_code: transactionResponse.responseCode,
					authorize_net_auth_code: transactionResponse.authCode,
					authorize_net_message: 'Payment successful'
				}).select();

				if (dbError) {
					console.error('[Payment] Failed to record payment in database:', dbError.message);
				}

				return json({
					success: true,
					transactionId: transactionResponse.transId,
					message: 'Payment successful'
				});
			} else {
				// Payment declined
				return json(
					{
						success: false,
						error: transactionResponse.errors?.[0]?.errorText || 'Payment declined'
					},
					{ status: 400 }
				);
			}
		} else {
			// API error
			return json(
				{
					success: false,
					error: responseData.messages.message[0].text || 'Payment processing failed'
				},
				{ status: 500 }
			);
		}
	} catch (error) {
		console.error('[Payment] Unexpected error:', error instanceof Error ? error.message : 'Unknown error');
		const errorMessage = error instanceof Error ? error.message : 'Internal server error';
		return json(
			{
				success: false,
				error: errorMessage
			},
			{ status: 500 }
		);
	}
};
