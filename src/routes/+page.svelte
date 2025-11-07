<script lang="ts">
	import { user, auth } from '$lib/stores/auth';
	import { goto } from '$app/navigation';

	async function handleLogout() {
		const { error } = await auth.signOut();
		if (!error) {
			goto('/login');
		}
	}
</script>

<div class="min-h-screen bg-base-200 p-8">
	<div class="mx-auto max-w-4xl">
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<div class="flex items-center justify-between">
					<div>
						<h1 class="mb-2 text-4xl font-bold">Guncad</h1>
						{#if $user}
							<p class="text-lg">Logged in as: <span class="font-semibold">{$user.email}</span></p>
						{/if}
					</div>
					{#if $user}
						<button onclick={handleLogout} class="btn btn-outline btn-error"> Logout </button>
					{/if}
				</div>

				<div class="divider"></div>

				<p class="text-lg">You're successfully authenticated!</p>
			</div>
		</div>
	</div>
</div>
