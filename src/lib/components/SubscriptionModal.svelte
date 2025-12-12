<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import Fa from 'svelte-fa';
	import { faXmark, faCheck, faInfinity } from '@fortawesome/free-solid-svg-icons';

	let {
		isOpen = $bindable(false),
		onSuccess = () => {}
	}: {
		isOpen: boolean;
		onSuccess?: () => void;
	} = $props();

	let processing = $state(false);
	let error = $state('');
	let cardNumber = $state('');
	let expirationDate = $state('');
	let cardCode = $state('');

	function closeModal() {
		if (!processing) {
			isOpen = false;
			error = '';
			cardNumber = '';
			expirationDate = '';
			cardCode = '';
		}
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		processing = true;
		error = '';

		try {
			// TODO: Integrate Accept.js tokenization
			// For now, show placeholder error
			throw new Error('Payment processing not yet implemented');
		} catch (err) {
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

	// Format expiration date as MM/YY
	function formatExpirationDate(value: string) {
		const cleaned = value.replace(/\D/g, '');
		if (cleaned.length >= 2) {
			return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
		}
		return cleaned;
	}

	function handleExpirationInput(e: Event) {
		const input = e.target as HTMLInputElement;
		expirationDate = formatExpirationDate(input.value);
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
				class="absolute right-4 top-4 rounded-full p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white disabled:opacity-50"
				aria-label="Close modal"
			>
				<Fa icon={faXmark} class="text-xl" />
			</button>

			<!-- Header -->
			<div class="border-b border-neutral-700 px-6 py-5">
				<h2 class="text-2xl font-bold">Subscribe to Download</h2>
				<p class="mt-1 text-sm text-neutral-400">Get unlimited access to all models</p>
			</div>

			<!-- Content -->
			<div class="p-6">
				<!-- Pricing Card -->
				<div class="mb-6 rounded-lg border border-neutral-700 bg-neutral-800 p-5">
					<div class="flex items-center justify-between">
						<div>
							<h3 class="text-lg font-semibold">Yearly Subscription</h3>
							<p class="text-sm text-neutral-400">Unlimited downloads</p>
						</div>
						<div class="text-right">
							<div class="text-3xl font-bold">$60</div>
							<div class="text-sm text-neutral-400">per year</div>
						</div>
					</div>

					<!-- Benefits -->
					<div class="mt-4 space-y-2 border-t border-neutral-700 pt-4">
						<div class="flex items-center gap-2 text-sm">
							<Fa icon={faCheck} class="text-green-500" />
							<span>Unlimited model downloads</span>
						</div>
						<div class="flex items-center gap-2 text-sm">
							<Fa icon={faInfinity} class="text-green-500" />
							<span>Access to all exclusive content</span>
						</div>
						<div class="flex items-center gap-2 text-sm">
							<Fa icon={faCheck} class="text-green-500" />
							<span>Download history tracking</span>
						</div>
					</div>
				</div>

				<!-- Payment Form -->
				<form onsubmit={handleSubmit} class="space-y-4">
					<!-- Card Number -->
					<div>
						<label for="cardNumber" class="mb-1 block text-sm font-medium">
							Card Number
						</label>
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

					<!-- Expiration and CVV -->
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label for="expirationDate" class="mb-1 block text-sm font-medium">
								Expiration Date
							</label>
							<input
								type="text"
								id="expirationDate"
								value={expirationDate}
								oninput={handleExpirationInput}
								placeholder="MM/YY"
								disabled={processing}
								required
								maxlength="5"
								class="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none disabled:opacity-50"
							/>
						</div>
						<div>
							<label for="cardCode" class="mb-1 block text-sm font-medium"> CVV </label>
							<input
								type="text"
								id="cardCode"
								bind:value={cardCode}
								placeholder="123"
								disabled={processing}
								required
								maxlength="4"
								class="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none disabled:opacity-50"
							/>
						</div>
					</div>

					<!-- Error Message -->
					{#if error}
						<div class="rounded-lg border border-red-600 bg-red-900/20 px-4 py-3 text-sm text-red-400">
							{error}
						</div>
					{/if}

					<!-- Submit Button -->
					<Button type="submit" disabled={processing} class="w-full" size="lg">
						{#if processing}
							<span class="loading loading-sm loading-spinner"></span>
							Processing...
						{:else}
							Subscribe for $60/year
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
