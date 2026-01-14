import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	ADN_API_LOGIN_ID,
	ADN_TRANSACTION_KEY,
	ADN_SANDBOX_API_ENDPOINT
} from '$env/static/private';
import { PUBLIC_MODEL_PURCHASE_PRICE } from '$env/static/public';

interface PaymentRequest {
	opaqueDataDescriptor: string;
	opaqueDataValue: string;
	modelId: string;
	modelTitle: string;
	zipCode: string;
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const {
			opaqueDataDescriptor,
			opaqueDataValue,
			modelId,
			modelTitle,
			zipCode
		}: PaymentRequest = await request.json();

		console.log('[Payment] Processing payment for model:', modelId);

		// Build Authorize.Net API request
		// IMPORTANT: Field order matters! 'order' must come before 'billTo'
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
						description: `Model Purchase: ${modelTitle}`,
						invoiceNumber: `MODEL-${modelId}-${Date.now()}`
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

				// TODO: Record purchase in database
				// TODO: Grant download access to user

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
		return json(
			{
				success: false,
				error: 'Internal server error'
			},
			{ status: 500 }
		);
	}
};
