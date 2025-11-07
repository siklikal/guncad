<script lang="ts">
	import { user, auth } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

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

				<h2 class="mb-4 text-2xl font-bold">Last 5 Releases</h2>

				{#if data.error}
					<div class="alert alert-error">
						<span>{data.error}</span>
					</div>
				{:else if data.releases.length === 0}
					<p class="py-8 text-center">No releases found.</p>
				{:else}
					<div class="space-y-4">
						{#each data.releases as release}
							<div class="card bg-base-200">
								<div class="card-body">
									<div class="flex flex-col gap-4 md:flex-row">
										{#if release.thumbnail}
											<img
												src={release.thumbnail}
												alt={release.name}
												class="w-full rounded object-cover md:h-32 md:w-32"
											/>
										{/if}
										<div class="flex-1">
											<h3 class="mb-2 text-xl font-bold">{release.name}</h3>
											<p class="mb-2 text-sm">{release.description}</p>
											<p class="text-xs text-base-content/70">
												Released: {new Date(release.released).toLocaleDateString()}
											</p>
										</div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
