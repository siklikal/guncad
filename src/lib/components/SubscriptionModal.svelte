<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import Fa from 'svelte-fa';
	import { faXmark, faCheck, faInfinity } from '@fortawesome/free-solid-svg-icons';
	import { Copy, Loader2 } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { auth } from '$lib/stores/auth';
	import {
		formatAccountNumber,
		normalizeAccountNumber,
		isValidAccountNumber
	} from '$lib/utils/accountNumber';

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
	let firstName = $state('');
	let lastName = $state('');
	let cardNumber = $state(env.PUBLIC_ADN_TEST_CARD_NUMBER || '');
	let expiryMonth = $state(env.PUBLIC_ADN_TEST_CARD_EXPIRATION_MONTH || '');
	let expiryYear = $state(env.PUBLIC_ADN_TEST_CARD_EXPIRATION_YEAR || '');
	let cardCode = $state(env.PUBLIC_ADN_TEST_CARD_CODE_NUMBER || '');
	let zipCode = $state(env.PUBLIC_ADN_TEST_CARD_ZIP_CODE || '');

	// Account option state
	type AccountOption = 'instant' | 'new_account' | 'existing_account';
	let accountOption = $state<AccountOption>('instant');
	let generatedAccountNumber = $state('');
	let generatedUserId = $state('');
	let generatingAccount = $state(false);
	let accountGenerated = $state(false);
	let existingAccountNumber = $state('');
	let copied = $state(false);

	// Disable purchase button when new account is selected but not yet generated
	let purchaseDisabled = $derived(
		processing ||
			(accountOption === 'new_account' && !accountGenerated)
	);

	// Get price from environment variable
	const price = env.PUBLIC_MODEL_PURCHASE_PRICE || '5.00';
	const priceFormatted = `$${parseFloat(price).toFixed(2)}`;

	function closeModal() {
		if (!processing) {
			isOpen = false;
			error = '';
			firstName = '';
			lastName = '';
			cardNumber = '';
			expiryMonth = '';
			expiryYear = '';
			cardCode = '';
			zipCode = '';
			accountOption = 'instant';
			generatedAccountNumber = '';
			generatedUserId = '';
			generatingAccount = false;
			accountGenerated = false;
			existingAccountNumber = '';
			copied = false;
		}
	}

	async function handleGenerateAccount() {
		generatingAccount = true;
		error = '';

		try {
			const result = await auth.createAccount(true);

			if (result.error) {
				error = result.error.message;
				return;
			}

			generatedAccountNumber = formatAccountNumber(result.data.accountNumber);
			// We need the user_id — sign in immediately to get a session, then extract user_id
			const loginResult = await auth.signIn(result.data.accountNumber);
			if (loginResult.error) {
				error = 'Account created but failed to activate. Please save your number and try again.';
				return;
			}

			// Fetch session to get user ID
			const sessionRes = await fetch('/api/account/session');
			const sessionData = await sessionRes.json();
			generatedUserId = sessionData.user?.id || '';

			accountGenerated = true;
		} catch (err) {
			error = 'Failed to generate account. Please try again.';
			console.error('[Payment] Account generation error:', err);
		} finally {
			generatingAccount = false;
		}
	}

	async function handleCopy() {
		if (!generatedAccountNumber) return;
		await navigator.clipboard.writeText(normalizeAccountNumber(generatedAccountNumber));
		copied = true;
		setTimeout(() => {
			copied = false;
		}, 1800);
	}

	function handleExistingAccountInput(value: string) {
		const normalized = normalizeAccountNumber(value).slice(0, 16);
		existingAccountNumber = formatAccountNumber(normalized);
	}

	function handleExistingAccountPaste(event: ClipboardEvent) {
		event.preventDefault();
		const pasted = event.clipboardData?.getData('text') ?? '';
		handleExistingAccountInput(pasted);
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		processing = true;
		error = '';

		try {
			let existingUserId: string | undefined;

			// Pre-validate for existing account option
			if (accountOption === 'existing_account') {
				const normalized = normalizeAccountNumber(existingAccountNumber);
				if (!isValidAccountNumber(normalized)) {
					error = 'Account number must be 16 digits';
					processing = false;
					return;
				}

				// Validate account exists and is active
				const validateRes = await fetch('/api/account/validate', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ accountNumber: normalized })
				});

				const validateData = await validateRes.json();

				if (!validateData.valid) {
					toast.error(validateData.error || 'Account validation failed');
					processing = false;
					return;
				}

				existingUserId = validateData.userId;
			}

			// Step 1: Prepare card data for Accept.js tokenization
			const secureData = {
				cardData: {
					cardNumber: cardNumber.replace(/\s/g, ''),
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

			// Step 3: Build payment body based on account option
			const paymentBody: Record<string, any> = {
				opaqueDataDescriptor: tokenResponse.opaqueData.dataDescriptor,
				opaqueDataValue: tokenResponse.opaqueData.dataValue,
				modelId: modelId,
				modelTitle: modelTitle,
				firstName: firstName,
				lastName: lastName,
				zipCode: zipCode
			};

			if (accountOption === 'instant') {
				paymentBody.guestPurchase = true;
			} else if (accountOption === 'new_account') {
				paymentBody.userId = generatedUserId;
			} else if (accountOption === 'existing_account') {
				paymentBody.userId = existingUserId;
			}

			// Step 4: Send tokenized payment data to our server
			const paymentResponse = await fetch('/api/process-payment', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(paymentBody)
			});

			const paymentData = await paymentResponse.json();

			if (!paymentResponse.ok || !paymentData.success) {
				throw new Error(paymentData.error || 'Payment processing failed');
			}

			console.log('[Payment] Payment successful:', paymentData.transactionId);

			// Step 5: Auto-login for existing account option
			if (accountOption === 'existing_account') {
				const loginResult = await auth.signIn(existingAccountNumber);
				if (loginResult.error) {
					console.error('[Payment] Auto-login failed:', loginResult.error);
				}
			}

			// Step 6: Handle success
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

		if (parseInt(value) > 12) {
			value = '12';
		}
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
			class="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-neutral-700 bg-neutral-900 shadow-xl"
		>
			<!-- Close Button -->
			<button
				type="button"
				onclick={closeModal}
				disabled={processing}
				class="absolute top-4 right-4 z-10 rounded-full p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white disabled:opacity-50"
				aria-label="Close modal"
			>
				<Fa icon={faXmark} class="text-xl" />
			</button>

			<!-- Header -->
			<div class="border-b border-neutral-700 px-6 py-4">
				<h2 class="text-xl font-bold">Purchase Model — {priceFormatted}</h2>
				<p class="text-sm text-neutral-400">One-time download</p>
			</div>

			<!-- Content -->
			<div class="p-6 pt-4">

				<!-- Payment Form -->
				<form onsubmit={handleSubmit} class="space-y-3">
					<!-- Name -->
					<div class="grid grid-cols-2 gap-3">
						<div>
							<label for="firstName" class="mb-1 block text-sm font-medium">First Name</label>
							<input
								type="text"
								id="firstName"
								bind:value={firstName}
								disabled={processing}
								required
								class="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none disabled:opacity-50"
							/>
						</div>
						<div>
							<label for="lastName" class="mb-1 block text-sm font-medium">Last Name</label>
							<input
								type="text"
								id="lastName"
								bind:value={lastName}
								disabled={processing}
								required
								class="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none disabled:opacity-50"
							/>
						</div>
					</div>

					<!-- Card Number + Expiry -->
					<div class="grid grid-cols-2 gap-3">
						<div>
							<label for="cardNumber" class="mb-1 block text-sm font-medium">Card Number</label>
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
						<div class="grid grid-cols-2 gap-2">
							<div>
								<label for="expiryMonth" class="mb-1 block text-sm font-medium">Month</label>
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
									class="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none disabled:opacity-50"
								/>
							</div>
							<div>
								<label for="expiryYear" class="mb-1 block text-sm font-medium">Year</label>
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
									class="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none disabled:opacity-50"
								/>
							</div>
						</div>
					</div>

					<!-- CVV + ZIP -->
					<div class="grid grid-cols-2 gap-3">
						<div>
							<label for="cardCode" class="mb-1 block text-sm font-medium">CVV</label>
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
								class="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none disabled:opacity-50"
							/>
						</div>
						<div>
							<label for="zipCode" class="mb-1 block text-sm font-medium">Billing ZIP</label>
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
					</div>

					<!-- Download Option -->
					<div class="space-y-3 border-t border-neutral-700 pt-4">
						<p class="text-sm font-medium text-neutral-300">Download Option</p>

						<!-- Option 1: Instant download only -->
						<label
							class="flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors {accountOption === 'instant' ? 'border-blue-600 bg-blue-600/10' : 'border-neutral-700 hover:border-neutral-600'}"
						>
							<input
								type="radio"
								name="accountOption"
								value="instant"
								bind:group={accountOption}
								disabled={processing}
								class="mt-0.5 accent-blue-600"
							/>
							<div>
								<p class="text-sm font-medium">Instant download only</p>
								<p class="text-xs text-neutral-400">
									Not saved. If lost, you must purchase again.
								</p>
							</div>
						</label>

						<!-- Option 2: Save to new account -->
						<label
							class="flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors {accountOption === 'new_account' ? 'border-blue-600 bg-blue-600/10' : 'border-neutral-700 hover:border-neutral-600'}"
						>
							<input
								type="radio"
								name="accountOption"
								value="new_account"
								bind:group={accountOption}
								disabled={processing}
								class="mt-0.5 accent-blue-600"
							/>
							<div class="flex-1">
								<p class="text-sm font-medium">Save to new account</p>
								<p class="text-xs text-neutral-400">
									A new account number will be created. You can use it later to download again.
								</p>
							</div>
						</label>

						{#if accountOption === 'new_account'}
							<div class="ml-6">
								{#if !accountGenerated}
									<Button
										type="button"
										variant="outline"
										size="sm"
										disabled={generatingAccount}
										onclick={handleGenerateAccount}
									>
										{#if generatingAccount}
											<Loader2 class="mr-2 h-4 w-4 animate-spin" />
											Generating...
										{:else}
											Generate Account Number
										{/if}
									</Button>
								{:else}
									<div class="rounded-md border border-blue-700 bg-blue-900/20 p-3">
										<p class="text-xs text-neutral-300">
											Save this number — it will not be displayed again for security.
										</p>
										<div class="mt-2 flex items-center justify-between gap-2">
											<p class="font-mono text-lg">{generatedAccountNumber}</p>
											<Button size="sm" type="button" variant="outline" onclick={handleCopy}>
												<Copy class="mr-1 h-3.5 w-3.5" />
												{copied ? 'Copied' : 'Copy'}
											</Button>
										</div>
									</div>
								{/if}
							</div>
						{/if}

						<!-- Option 3: Use existing account -->
						<label
							class="flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors {accountOption === 'existing_account' ? 'border-blue-600 bg-blue-600/10' : 'border-neutral-700 hover:border-neutral-600'}"
						>
							<input
								type="radio"
								name="accountOption"
								value="existing_account"
								bind:group={accountOption}
								disabled={processing}
								class="mt-0.5 accent-blue-600"
							/>
							<div class="flex-1">
								<p class="text-sm font-medium">Use existing account</p>
								<p class="text-xs text-neutral-400">
									Enter your 16-digit account number to save this purchase.
								</p>
							</div>
						</label>

						{#if accountOption === 'existing_account'}
							<div class="ml-6">
								<input
									type="text"
									value={existingAccountNumber}
									oninput={(e) =>
										handleExistingAccountInput((e.target as HTMLInputElement).value)}
									onpaste={handleExistingAccountPaste}
									placeholder="XXXX XXXX XXXX XXXX"
									disabled={processing}
									maxlength={19}
									inputmode="numeric"
									class="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 font-mono text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none disabled:opacity-50"
								/>
							</div>
						{/if}
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
					<Button type="submit" disabled={purchaseDisabled} class="w-full" size="lg">
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
