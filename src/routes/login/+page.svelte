<script lang="ts">
	import { auth, user } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Loader2 } from '@lucide/svelte';
	import { formatAccountNumber, formatAccountNumberInput } from '$lib/utils/accountNumber';
	import AccountNumberCard from '$lib/components/AccountNumberCard.svelte';

	let accountNumber = $state('');
	let acceptedTos = $state(false);
	let createdAccountNumber = $state('');
	let error = $state('');
	let loadingLogin = $state(false);
	let loadingCreate = $state(false);

	$effect(() => {
		if ($user) {
			goto('/');
		}
	});

	function handleAccountInput(value: string) {
		accountNumber = formatAccountNumberInput(value);
	}

	function handleAccountPaste(event: ClipboardEvent) {
		event.preventDefault();
		const pasted = event.clipboardData?.getData('text') ?? '';
		accountNumber = formatAccountNumberInput(pasted);
	}

	async function handleLogin() {
		error = '';
		loadingLogin = true;

		const result = await auth.signIn(accountNumber);
		if (result.error) {
			loadingLogin = false;
			error = result.error.message;
			return;
		}
	}

	async function handleCreateAccount() {
		error = '';
		loadingCreate = true;
		createdAccountNumber = '';

		const result = await auth.createAccount(acceptedTos);
		loadingCreate = false;

		if (result.error) {
			error = result.error.message;
			return;
		}

		createdAccountNumber = formatAccountNumber(result.data.accountNumber);
		accountNumber = createdAccountNumber;
	}

</script>

<div class="flex flex-1 items-center justify-center">
	<Card.Root class="w-full max-w-md">
		<Card.Header>
			<Card.Title class="text-center text-3xl">Guncad</Card.Title>
			<Card.Description class="pt-2 text-center">
				Use your 16-digit account number to sign in.
			</Card.Description>
		</Card.Header>

		<Card.Content>
			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleLogin();
				}}
				class="space-y-4"
			>
				<div class="space-y-2">
					<Label for="account-number">Account Number</Label>
					<Input
						id="account-number"
						type="text"
						value={accountNumber}
						oninput={(e) => handleAccountInput((e.target as HTMLInputElement).value)}
						onpaste={handleAccountPaste}
						required
						maxlength={19}
						inputmode="numeric"
					/>
				</div>

				{#if error}
					<div class="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
						{error}
					</div>
				{/if}

				<Button type="submit" class="w-full" disabled={loadingLogin}>
					{#if loadingLogin}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
						Signing in...
					{:else}
						Sign In
					{/if}
				</Button>
			</form>

			<div class="relative my-6">
				<div class="absolute inset-0 flex items-center">
					<span class="w-full border-t"></span>
				</div>
				<div class="relative flex justify-center text-xs uppercase">
					<span class="bg-card px-2 text-muted-foreground">Create New Account</span>
				</div>
			</div>

			<div class="space-y-4">
				<div class="flex items-center gap-2">
					<Checkbox id="terms" bind:checked={acceptedTos} />
					<Label for="terms" class="text-sm font-normal">
						I accept the <a href="/terms" target="_blank" class="text-primary hover:underline"
							>Terms of Service</a
						>
					</Label>
				</div>

				<Button
					type="button"
					variant="outline"
					class="w-full"
					disabled={loadingCreate || !acceptedTos}
					onclick={handleCreateAccount}
				>
					{#if loadingCreate}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
						Creating...
					{:else}
						Generate Account Number
					{/if}
				</Button>

				{#if createdAccountNumber}
					<AccountNumberCard
						accountNumber={createdAccountNumber}
						description="This is your login credential. Copy it and use it in the field above to sign in."
					/>
				{/if}
			</div>
		</Card.Content>
	</Card.Root>
</div>
