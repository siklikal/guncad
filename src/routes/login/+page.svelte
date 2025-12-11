<script lang="ts">
	import { auth, user } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Eye, EyeOff, Loader2 } from '@lucide/svelte';

	let email = $state('');
	let password = $state('');
	let acceptedTos = $state(false);
	let showPassword = $state(false);
	let isSignUp = $state(false);
	let error = $state('');
	let loading = $state(false);

	// If already logged in, redirect to home
	$effect(() => {
		if ($user) {
			goto('/');
		}
	});

	async function handleSubmit() {
		error = '';
		loading = true;

		const result = isSignUp
			? await auth.signUp(email, password)
			: await auth.signIn(email, password);

		if (result.error) {
			loading = false;
			error = result.error.message;
		} else {
			// Success! Keep loading true - the effect will redirect
			// and the loading spinner will stay visible during navigation
			if (isSignUp) {
				loading = false;
				// Check if user was actually created (user exists if it's a new signup)
				// If user is null but no error, it means email already exists
				if (
					result.data.user &&
					result.data.user.identities &&
					result.data.user.identities.length === 0
				) {
					error = 'An account with this email already exists. Please login instead.';
				} else {
					error = 'Check your email to confirm your account!';
				}
			}
			// For sign in, keep loading = true so spinner stays visible during redirect
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-neutral-950 p-4">
	<Card.Root class="w-full max-w-md">
		<Card.Header>
			<Card.Title class="text-center text-3xl">
				{isSignUp ? 'Sign Up' : 'Sign in to Guncad'}
			</Card.Title>
		</Card.Header>
		<Card.Content>
			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleSubmit();
				}}
			>
				<div class="space-y-4">
					<div class="space-y-2">
						<Label for="email">Email</Label>
						<Input
							id="email"
							type="email"
							bind:value={email}
							required
							placeholder="you@example.com"
						/>
					</div>

					<div class="space-y-2">
						<Label for="password">Password</Label>
						<div class="relative">
							<Input
								id="password"
								type={showPassword ? 'text' : 'password'}
								bind:value={password}
								required
								placeholder="••••••••"
								minlength="6"
								class="pr-10"
							/>
							<button
								type="button"
								onclick={() => (showPassword = !showPassword)}
								class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
							>
								{#if showPassword}
									<EyeOff class="h-4 w-4" />
								{:else}
									<Eye class="h-4 w-4" />
								{/if}
							</button>
						</div>
					</div>

					{#if isSignUp}
						<div class="flex items-center space-x-2">
							<Checkbox id="terms" bind:checked={acceptedTos} required />
							<Label for="terms" class="text-sm font-normal">
								I accept the <a href="/terms" target="_blank" class="text-primary hover:underline"
									>Terms of Service</a
								>
							</Label>
						</div>
					{/if}

					{#if error}
						<div class="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
							{error}
						</div>
					{/if}

					<Button type="submit" class="w-full" disabled={loading}>
						{#if loading}
							<Loader2 class="mr-2 h-4 w-4 animate-spin" />
							Loading...
						{:else}
							{isSignUp ? 'Sign Up' : 'Login'}
						{/if}
					</Button>
				</div>
			</form>

			<div class="relative my-6">
				<div class="absolute inset-0 flex items-center">
					<span class="w-full border-t"></span>
				</div>
				<div class="relative flex justify-center text-xs uppercase">
					<span class="bg-card px-2 text-muted-foreground">OR</span>
				</div>
			</div>

			<p class="text-center text-sm text-muted-foreground">
				{isSignUp ? 'Already have an account?' : "Don't have an account?"}
				<Button
					variant="link"
					class="px-1"
					onclick={() => {
						isSignUp = !isSignUp;
						error = '';
					}}
				>
					{isSignUp ? 'Login' : 'Sign Up'}
				</Button>
			</p>
		</Card.Content>
	</Card.Root>
</div>
