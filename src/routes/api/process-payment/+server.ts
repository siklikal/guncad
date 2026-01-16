import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	ADN_API_LOGIN_ID,
	ADN_TRANSACTION_KEY,
	ADN_SANDBOX_API_ENDPOINT,
	SUPABASE_SERVICE_ROLE_KEY
} from '$env/static/private';
import { PUBLIC_MODEL_PURCHASE_PRICE, PUBLIC_SUPABASE_URL } from '$env/static/public';
import { createClient } from '@supabase/supabase-js';

interface PaymentRequest {
	opaqueDataDescriptor: string;
	opaqueDataValue: string;
	modelId: string;
	modelTitle: string;
	zipCode: string;
}

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const session = locals.session;

		if (!session?.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const {
			opaqueDataDescriptor,
			opaqueDataValue,
			modelId,
			modelTitle,
			zipCode
		}: PaymentRequest = await request.json();

		console.log('[Payment] Processing payment for model:', modelId, 'User:', session.user.id);

		// Build Authorize.Net API request
		// IMPORTANT: Field order matters in Authorize.Net XML schema!
		// - 'order' must come before 'billTo'
		// - Within 'order', 'invoiceNumber' must come before 'description'
		// - invoiceNumber has a max length of 20 characters
		const authNetRequest = {
			createTransactionRequest: {
				merchantAuthentication: {
					name: ADN_API_LOGIN_ID,
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
						zip: zipCode
					}
				}
			}
		};

		console.log('[Payment] Calling Authorize.Net API...');

		// Call Authorize.Net API
		const response = await fetch(ADN_SANDBOX_API_ENDPOINT, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(authNetRequest)
		});

		const responseData = await response.json();

		console.log('[Payment] Authorize.Net response:', responseData);

		// Check if payment was successful
		if (responseData.messages.resultCode === 'Ok') {
			const transactionResponse = responseData.transactionResponse;

			if (transactionResponse.responseCode === '1') {
				// Payment approved
				console.log('[Payment] Payment approved:', transactionResponse.transId);

				// Record payment in Supabase
				const supabase = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

				// Test connection
				console.log('[Payment] Supabase URL:', PUBLIC_SUPABASE_URL);
				console.log('[Payment] Service role key exists:', !!SUPABASE_SERVICE_ROLE_KEY);

				console.log('[Payment] Recording payment with data:', {
					user_id: session.user.id,
					model_id: modelId,
					amount: parseFloat(PUBLIC_MODEL_PURCHASE_PRICE),
					transaction_id: transactionResponse.transId
				});

				const { data: insertData, error: dbError } = await supabase.from('payments').insert({
					user_id: session.user.id,
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
					console.error('[Payment] Failed to record payment in database:', dbError);
					console.error('[Payment] Error details:', JSON.stringify(dbError, null, 2));
					// Don't fail the request - payment was successful
				} else {
					console.log('[Payment] Payment recorded in database successfully:', insertData);
				}

				return json({
					success: true,
					transactionId: transactionResponse.transId,
					message: 'Payment successful'
				});
			} else {
				// Payment declined
				console.error('[Payment] Payment declined:', transactionResponse.errors);
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
			console.error('[Payment] API error:', responseData.messages);
			return json(
				{
					success: false,
					error: responseData.messages.message[0].text || 'Payment processing failed'
				},
				{ status: 500 }
			);
		}
	} catch (error) {
		console.error('[Payment] Error processing payment:', error);
		const errorMessage = error instanceof Error ? error.message : 'Internal server error';
		console.error('[Payment] Error details:', errorMessage);
		return json(
			{
				success: false,
				error: errorMessage
			},
			{ status: 500 }
		);
	}
};
