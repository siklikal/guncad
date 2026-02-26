<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Loader2 } from '@lucide/svelte';

	let accessCode = $state('');
	let error = $state('');
	let loading = $state(false);

	async function handleSubmit() {
		error = '';
		loading = true;

		try {
			const response = await fetch('/api/access', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ password: accessCode })
			});

			const data = await response.json();

			if (!response.ok) {
				error = data.error || 'Invalid access code';
				return;
			}

			goto('/');
		} catch {
			error = 'Something went wrong. Please try again.';
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-neutral-950 p-4">
	<Card.Root class="w-full max-w-md">
		<Card.Header>
			<Card.Title class="text-center text-3xl">Guncad</Card.Title>
			<Card.Description class="pt-2 text-center">
				This site is in private preview. Enter the access code to continue.
			</Card.Description>
		</Card.Header>

		<Card.Content>
			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleSubmit();
				}}
				class="space-y-4"
			>
				<div class="space-y-2">
					<Label for="access-code">Access Code</Label>
					<Input
						id="access-code"
						type="password"
						bind:value={accessCode}
						placeholder="Enter access code"
						required
					/>
				</div>

				{#if error}
					<div class="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
						{error}
					</div>
				{/if}

				<Button type="submit" class="w-full" disabled={loading}>
					{#if loading}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
						Verifying...
					{:else}
						Enter
					{/if}
				</Button>
			</form>
		</Card.Content>
	</Card.Root>
</div>
