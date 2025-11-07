<script lang="ts">
	import { auth, user } from '$lib/stores/auth';
	import { goto } from '$app/navigation';

	let email = $state('');
	let password = $state('');
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

		loading = false;

		if (result.error) {
			error = result.error.message;
		} else {
			// Success! User will be redirected by the effect above
			if (isSignUp) {
				error = 'Check your email to confirm your account!';
			}
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-base-200 p-4">
	<div class="card w-full max-w-md bg-base-100 shadow-xl">
		<div class="card-body">
			<h1 class="mb-4 card-title justify-center text-3xl font-bold">
				{isSignUp ? 'Sign Up' : 'Sign in to Guncad'}
			</h1>

			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleSubmit();
				}}
			>
				<div class="form-control">
					<label class="label" for="email">
						<span class="label-text">Email</span>
					</label>
					<input
						id="email"
						type="email"
						bind:value={email}
						required
						placeholder="you@example.com"
						class="input-bordered input w-full"
					/>
				</div>

				<div class="form-control mt-4">
					<label class="label" for="password">
						<span class="label-text">Password</span>
					</label>
					<input
						id="password"
						type="password"
						bind:value={password}
						required
						placeholder="••••••••"
						minlength="6"
						class="input-bordered input w-full"
					/>
				</div>

				{#if error}
					<div class="mt-4 alert alert-error">
						<span>{error}</span>
					</div>
				{/if}

				<div class="form-control mt-6">
					<button class="btn w-full btn-primary" disabled={loading}>
						{#if loading}
							<span class="loading loading-spinner"></span> Loading...
						{:else}
							{isSignUp ? 'Sign Up' : 'Login'}
						{/if}
					</button>
				</div>
			</form>

			<!-- <div class="divider">OR</div>

			<p class="text-center">
				{isSignUp ? 'Already have an account?' : "Don't have an account?"}
				<button
					type="button"
					class="btn btn-link btn-sm"
					onclick={() => {
						isSignUp = !isSignUp;
						error = '';
					}}
				>
					{isSignUp ? 'Login' : 'Sign Up'}
				</button>
			</p> -->
		</div>
	</div>
</div>
