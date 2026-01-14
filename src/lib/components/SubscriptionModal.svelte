<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import Fa from 'svelte-fa';
	import { faXmark, faCheck, faInfinity } from '@fortawesome/free-solid-svg-icons';

	let {
		isOpen = $bindable(false),
		modelId,
		modelTitle,
		onSuccess = () => {}
	}: {
		isOpen: boolean;
		modelId: string;
		modelTitle: string;
		onSuccess?: () => void;
	} = $props();

	import { env } from '$env/dynamic/public';

	let processing = $state(false);
	let error = $state('');
	let cardNumber = $state(env.PUBLIC_ADN_TEST_CARD_NUMBER || '');
	let expiryMonth = $state(env.PUBLIC_ADN_TEST_CARD_EXPIRATION_MONTH || '');
	let expiryYear = $state(env.PUBLIC_ADN_TEST_CARD_EXPIRATION_YEAR || '');
	let cardCode = $state(env.PUBLIC_ADN_TEST_CARD_CODE_NUMBER || '');
	let zipCode = $state(env.PUBLIC_ADN_TEST_CARD_ZIP_CODE || '');

	// Get price from environment variable
	const price = env.PUBLIC_MODEL_PURCHASE_PRICE || '5.00';
	const priceFormatted = `$${parseFloat(price).toFixed(2)}`;

	function closeModal() {
		if (!processing) {
			isOpen = false;
			error = '';
			cardNumber = '';
			expiryMonth = '';
			expiryYear = '';
			cardCode = '';
			zipCode = '';
		}
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		processing = true;
		error = '';

		try {
			// Step 1: Prepare card data for Accept.js tokenization
			const secureData = {
				cardData: {
					cardNumber: cardNumber.replace(/\s/g, ''), // Remove spaces
					month: expiryMonth,
					year: expiryYear,
					cardCode: cardCode
				},
				authData: {
					clientKey: env.PUBLIC_ADN_PUBLIC_CLIENT_KEY,
					apiLoginID: env.PUBLIC_ADN_API_LOGIN_ID
				}
			};

			// Step 2: Call Accept.js to tokenize the card data
			// This returns a payment nonce (one-time-use token) instead of sending raw card data
			const tokenResponse = await new Promise<any>((resolve, reject) => {
				(window as any).Accept.dispatchData(secureData, (response: any) => {
					if (response.messages.resultCode === 'Error') {
						const errorMsg = response.messages.message
							.map((msg: any) => msg.text)
							.join(', ');
						reject(new Error(errorMsg));
					} else {
						resolve(response);
					}
				});
			});

			console.log('[Payment] Tokenization successful, processing payment...');

			// Step 3: Send tokenized payment data to our server
			const paymentResponse = await fetch('/api/process-payment', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					opaqueDataDescriptor: tokenResponse.opaqueData.dataDescriptor,
					opaqueDataValue: tokenResponse.opaqueData.dataValue,
					modelId: modelId,
					modelTitle: modelTitle,
					zipCode: zipCode
				})
			});

			const paymentData = await paymentResponse.json();

			if (!paymentResponse.ok || !paymentData.success) {
				throw new Error(paymentData.error || 'Payment processing failed');
			}

			console.log('[Payment] Payment successful:', paymentData.transactionId);

			// Step 4: Handle success
			closeModal();
			onSuccess();
		} catch (err) {
			console.error('[Payment] Payment error:', err);
			error = err instanceof Error ? err.message : 'Payment failed';
		} finally {
			processing = false;
		}
	}

	// Close modal when clicking backdrop
	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			closeModal();
		}
	}

	// Auto-format month input (max 12)
	function handleMonthInput(e: Event) {
		const input = e.target as HTMLInputElement;
		let value = input.value.replace(/\D/g, '');

		// Limit to 12
		if (parseInt(value) > 12) {
			value = '12';
		}
		// Pad with 0 if single digit and user typed 2 digits
		if (value.length === 2 && parseInt(value) <= 12) {
			expiryMonth = value;
		} else if (value.length === 1) {
			expiryMonth = value;
		} else {
			expiryMonth = value.slice(0, 2);
		}
	}

	// Auto-format year input (last 2 digits)
	function handleYearInput(e: Event) {
		const input = e.target as HTMLInputElement;
		const value = input.value.replace(/\D/g, '');
		expiryYear = value.slice(0, 2);
	}

	// Auto-format ZIP code
	function handleZipInput(e: Event) {
		const input = e.target as HTMLInputElement;
		const value = input.value.replace(/\D/g, '');
		zipCode = value.slice(0, 5);
	}
</script>

{#if isOpen}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
		onclick={handleBackdropClick}
		role="presentation"
	>
		<!-- Modal -->
		<div
			class="relative w-full max-w-lg overflow-hidden rounded-lg border border-neutral-700 bg-neutral-900 shadow-xl"
		>
			<!-- Close Button -->
			<button
				type="button"
				onclick={closeModal}
				disabled={processing}
				class="absolute top-4 right-4 rounded-full p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white disabled:opacity-50"
				aria-label="Close modal"
			>
				<Fa icon={faXmark} class="text-xl" />
			</button>

			<!-- Header -->
			<div class="border-b border-neutral-700 px-6 py-5">
				<h2 class="text-2xl font-bold">Purchase Model</h2>
				<p class="mt-1 text-sm text-neutral-400">One-time purchase for instant download</p>
			</div>

			<!-- Content -->
			<div class="p-6">
				<!-- Pricing Card -->
				<div class="mb-6 rounded-lg border border-neutral-700 bg-neutral-800 p-5">
					<div class="flex items-center justify-between">
						<div>
							<h3 class="text-lg font-semibold">One-Time Purchase</h3>
							<p class="text-sm text-neutral-400">Instant access to this model</p>
						</div>
						<div class="text-right">
							<div class="text-3xl font-bold">{priceFormatted}</div>
							<div class="text-sm text-neutral-400">one-time</div>
						</div>
					</div>

					<!-- Benefits -->
					<!-- <div class="mt-4 space-y-2 border-t border-neutral-700 pt-4">
						<div class="flex items-center gap-2 text-sm">
							<Fa icon={faCheck} class="text-green-500" />
							<span>Instant download access</span>
						</div>
					</div> -->
				</div>

				<!-- Payment Form -->
				<form onsubmit={handleSubmit} class="space-y-4">
					<!-- Card Number -->
					<div>
						<label for="cardNumber" class="mb-1 block text-sm font-medium"> Card Number </label>
						<input
							type="text"
							id="cardNumber"
							bind:value={cardNumber}
							placeholder="1234 5678 9012 3456"
							disabled={processing}
							required
							maxlength="19"
							class="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none disabled:opacity-50"
						/>
					</div>

					<!-- Expiration Date (MM/YY) -->
					<div class="grid grid-cols-3 gap-3">
						<div class="col-span-1">
							<label for="expiryMonth" class="mb-1 block text-sm font-medium"> Month </label>
							<input
								type="text"
								id="expiryMonth"
								bind:value={expiryMonth}
								oninput={handleMonthInput}
								placeholder="MM"
								disabled={processing}
								required
								maxlength="2"
								pattern="[0-9]*"
								inputmode="numeric"
								class="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-center text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none disabled:opacity-50"
							/>
						</div>
						<div class="col-span-1">
							<label for="expiryYear" class="mb-1 block text-sm font-medium"> Year </label>
							<input
								type="text"
								id="expiryYear"
								bind:value={expiryYear}
								oninput={handleYearInput}
								placeholder="YY"
								disabled={processing}
								required
								maxlength="2"
								pattern="[0-9]*"
								inputmode="numeric"
								class="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-center text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none disabled:opacity-50"
							/>
						</div>
						<div class="col-span-1">
							<label for="cardCode" class="mb-1 block text-sm font-medium"> CVV </label>
							<input
								type="text"
								id="cardCode"
								bind:value={cardCode}
								placeholder="123"
								disabled={processing}
								required
								maxlength="4"
								pattern="[0-9]*"
								inputmode="numeric"
								class="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-center text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none disabled:opacity-50"
							/>
						</div>
					</div>

					<!-- Billing ZIP Code -->
					<div>
						<label for="zipCode" class="mb-1 block text-sm font-medium"> Billing ZIP Code </label>
						<input
							type="text"
							id="zipCode"
							bind:value={zipCode}
							oninput={handleZipInput}
							placeholder="12345"
							disabled={processing}
							required
							maxlength="5"
							pattern="[0-9]*"
							inputmode="numeric"
							class="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none disabled:opacity-50"
						/>
					</div>

					<!-- Error Message -->
					{#if error}
						<div
							class="rounded-lg border border-red-600 bg-red-900/20 px-4 py-3 text-sm text-red-400"
						>
							{error}
						</div>
					{/if}

					<!-- Submit Button -->
					<Button type="submit" disabled={processing} class="w-full" size="lg">
						{#if processing}
							<span class="loading loading-sm loading-spinner"></span>
							Processing...
						{:else}
							Purchase
						{/if}
					</Button>

					<!-- Security Notice -->
					<p class="text-center text-xs text-neutral-500">
						Your payment information is secure and encrypted
					</p>
				</form>
			</div>
		</div>
	</div>
{/if}
