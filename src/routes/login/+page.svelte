<script lang="ts">
	import { auth, user } from '$lib/stores/auth';
	import { goto } from '$app/navigation';

	let email = $state('');
	let password = $state('');
	let username = $state('');
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
			? await auth.signUp(email, password, username)
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

				{#if isSignUp}
					<div class="form-control mt-4">
						<label class="label" for="username">
							<span class="label-text">Username</span>
						</label>
						<input
							id="username"
							type="text"
							bind:value={username}
							required
							placeholder="johndoe"
							class="input-bordered input w-full"
						/>
					</div>
				{/if}

				<div class="form-control mt-4">
					<label class="label" for="password">
						<span class="label-text">Password</span>
					</label>
					<div class="relative">
						<input
							id="password"
							type={showPassword ? 'text' : 'password'}
							bind:value={password}
							required
							placeholder="••••••••"
							minlength="6"
							class="input-bordered input w-full pr-12"
						/>
						<label class="swap absolute top-1/2 right-3 -translate-y-1/2 swap-rotate">
							<input type="checkbox" bind:checked={showPassword} class="opacity-0" />
							<svg
								class="swap-off h-5 w-5 fill-current"
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
							>
								<path
									d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
								/>
							</svg>
							<svg
								class="swap-on h-5 w-5 fill-current"
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
							>
								<path
									d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"
								/>
							</svg>
						</label>
					</div>
				</div>

				{#if isSignUp}
					<div class="form-control mt-4">
						<label class="label cursor-pointer justify-start gap-2">
							<input
								type="checkbox"
								bind:checked={acceptedTos}
								required
								class="checkbox checkbox-sm"
							/>
							<span class="label-text">
								I accept the <a href="/terms" target="_blank" class="link link-primary"
									>Terms of Service</a
								>
							</span>
						</label>
					</div>
				{/if}

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

			<div class="divider">OR</div>

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
			</p>
		</div>
	</div>
</div>
