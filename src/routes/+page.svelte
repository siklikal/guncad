<script lang="ts">
	import { user, auth, loading } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import { CircleStar, ChevronRight } from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

	// Redirect to login if not authenticated (but wait for auth to load first)
	$effect(() => {
		if (!$loading && !$user) {
			goto('/login');
		}
	});

	async function handleLogout() {
		const { error } = await auth.signOut();
		if (!error) {
			goto('/login');
		}
	}
</script>

<div>
	<div class="mx-auto max-w-[1920px] px-8">
		<div class="flex gap-6">
			<div class="carousel h-[390px] w-full flex-1 rounded-lg">
				<div id="slide1" class="relative carousel-item w-full bg-neutral-700">
					<div class="flex h-full w-full flex-col items-start justify-center gap-4 p-8">
						<p class="text-3xl font-bold">How the Incentive System Works</p>
						<p class="text-lg">Free 3D models to download</p>
						<a href="#" class=" rounded-full bg-blue-600 px-8 py-3 font-bold text-white">Join Now</a
						>
					</div>
				</div>
			</div>

			<div class="flex flex-1 gap-6">
				<div class="flex flex-1 flex-col gap-2">
					<div
						class="flex-1 rounded-lg bg-cover bg-center"
						style="background-image: url('https://guncadindex.com/media/thumbnails/thumbnail-d06fa14f-ffb0-4224-a851-bf241e474500-768.webp');"
					>
						<div class="flex h-full flex-col justify-end">
							<div
								class="flex h-1/4 flex-col justify-end rounded-br-lg rounded-bl-lg bg-linear-to-t from-black to-transparent"
							>
								<p class="p-4">The Hello Kitty</p>
							</div>
						</div>
					</div>
					<a
						href="/premium-models"
						class="flex w-full items-center justify-between rounded-lg bg-black px-4 py-2 no-underline"
					>
						<div class="flex items-center gap-2">
							<CircleStar />
							<span class="text-sm text-white">Premium Models</span>
						</div>
						<ChevronRight />
					</a>
				</div>

				<div class="flex flex-1 flex-col gap-2">
					<div
						class="flex-1 rounded-lg bg-cover bg-center"
						style="background-image: url('https://guncadindex.com/media/thumbnails/thumbnail-30143aea-61f5-4d1c-b695-d0b077b0f81c-768_5MPqZeS.webp');"
					>
						<div class="flex h-full flex-col justify-end">
							<div
								class="flex h-1/4 flex-col justify-end rounded-br-lg rounded-bl-lg bg-linear-to-t from-black to-transparent"
							>
								<p class="p-4">M&P Remix</p>
							</div>
						</div>
					</div>
					<a
						href="/premium-models"
						class="flex w-full items-center justify-between rounded-lg bg-black px-4 py-2 no-underline"
					>
						<div class="flex items-center gap-2">
							<CircleStar />
							<span class="text-sm text-white">Premium Models</span>
						</div>
						<ChevronRight />
					</a>
				</div>

				<div class="flex flex-1 flex-col gap-2">
					<div
						class="flex-1 rounded-lg bg-cover bg-center"
						style="background-image: url('https://guncadindex.com/media/thumbnails/thumbnail-3fde3396-9743-4afa-88dd-993df763d50e-768_wvfmNXY.webp');"
					>
						<div class="flex h-full flex-col justify-end">
							<div
								class="flex h-1/4 flex-col justify-end rounded-br-lg rounded-bl-lg bg-linear-to-t from-black to-transparent"
							>
								<p class="p-4">Chode Muzzle Brake</p>
							</div>
						</div>
					</div>
					<a
						href="/premium-models"
						class="flex w-full items-center justify-between rounded-lg bg-black px-4 py-2 no-underline"
					>
						<div class="flex items-center gap-2">
							<CircleStar />
							<span class="text-sm text-white">Premium Models</span>
						</div>
						<ChevronRight />
					</a>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- <div class="min-h-screen bg-base-200 p-8">
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
</div> -->
