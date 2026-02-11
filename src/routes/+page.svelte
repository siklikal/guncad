<script lang="ts">
	import { user, auth, loading } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import { readyToPrint } from '$lib/data/readyToPrint';
	import ModelSection from '$lib/components/ModelSection.svelte';
	import { fetchHomepageData } from '$lib/api/homepage';
	import Fa from 'svelte-fa';
	import {
		faChevronRight,
		faGem,
		faStar,
		faFire
	} from '@fortawesome/free-solid-svg-icons';
	import ModelsSkeleton from '$lib/components/skeletons/ModelsSkeleton.svelte';

	let { data }: { data: PageData } = $props();

	// Homepage data - start fetching immediately with pending promises to show skeletons
	let pageData = $state<any>({
		spotlightExclusive: { title: 'The Hello Kitty', image: '', url: '', views: 0, likes: 0 },
		spotlightFeatured: { title: 'Chode Muzzle Brake', image: '', url: '', views: 0, likes: 0 },
		spotlightTrending: { title: 'DeadTrolls PA6CF', image: '', url: '', views: 0, likes: 0 },
		tags: [],
		// Use pending promises to show skeletons immediately
		collections: new Promise(() => {}),
		popular: new Promise(() => {}),
		newest: new Promise(() => {}),
		recentlyUpdated: new Promise(() => {})
	});

	onMount(async () => {
		pageData = await fetchHomepageData();
	});

	// Note: Authentication is now handled server-side in hooks.server.ts
	// This prevents the flash of content before redirect that occurred with client-side checks

	async function handleLogout() {
		const { error } = await auth.signOut();
		if (!error) {
			goto('/login');
		}
	}

</script>

<div>
		<div class="mx-auto max-w-[1920px] md:px-4">
			<div class="flex flex-col gap-5 xl:flex-row">
				<!-- <div class="carousel h-[600px] w-full flex-1 rounded-lg xl:h-[390px]"> -->
				<div class="carousel h-[390px] w-full rounded-lg lg:flex-1">
					<div id="slide1" class="relative carousel-item h-full w-full overflow-hidden rounded-lg">
						<!-- Video Background with poster -->
						<video
							autoplay
							muted
							loop
							playsinline
							poster="/images/hero-poster.jpg"
							preload="metadata"
							class="absolute inset-0 h-full w-full object-cover"
						>
							<source src="/videos/hero.mp4" type="video/mp4" />
							Your browser does not support the video tag.
						</video>

						<!-- Semi-transparent overlay -->
						<div class="absolute inset-0 bg-blue-600/80"></div>

						<!-- Content (appears above overlay) -->
						<div class="relative flex h-full w-full flex-col items-start justify-center gap-4 p-8">
							<p class="text-[26px] leading-tight font-bold md:text-5xl">
								The Trusted Platform for <span class="inline md:block"
									>3D-Printed Firearm Innovation</span
								>
							</p>
							<p class="text-[16px] md:text-2xl">Safe. Trusted. Community Approved.</p>
							<a href="/" class=" rounded-full bg-black px-8 py-3 font-bold text-white">Join Now</a>
						</div>
					</div>
				</div>

				<div class="flex flex-1 flex-col gap-5 md:flex-row">
					<div class="flex h-[250px] flex-col gap-2 md:flex-1 xl:h-full" id="spotlight-exclusive">
						<a
							href={pageData.spotlightExclusive.id
								? `/details/${pageData.spotlightExclusive.id}`
								: pageData.spotlightExclusive.url}
							class="group flex-1"
						>
							<div
								class="h-full flex-1 rounded-lg bg-cover bg-center"
								style="background-image: url('{pageData.spotlightExclusive.image}');"
							>
								<div class="flex h-full flex-col justify-between">
									<div class="flex justify-end">
										<div class="flex h-10 w-10 items-center justify-center rounded-bl-lg bg-black">
											<Fa icon={faFire} class="text-xl text-red-600" />
										</div>
									</div>
									<div
										class="flex h-1/4 flex-col justify-end rounded-br-lg rounded-bl-lg bg-linear-to-t from-black via-black/70 to-transparent"
									>
										<p class="line-clamp-1 p-4 font-semibold group-hover:text-blue-600">
											The Hello Kitty
										</p>
									</div>
								</div>
							</div>
						</a>
						<a
							href="/search?sort=popular"
							class="group/category flex w-full items-center justify-between rounded-lg bg-black px-4 py-2 no-underline"
						>
							<div class="flex items-center gap-2">
								<Fa icon={faFire} class="text-lg text-red-600" />
								<span class="text-sm text-white group-hover/category:text-blue-600"
									>Most Popular</span
								>
							</div>
							<Fa icon={faChevronRight} />
						</a>
					</div>

					<div class="flex h-[250px] flex-col gap-2 md:flex-1 xl:h-full" id="spotlight-featured">
						<a
							href={pageData.spotlightFeatured.id
								? `/details/${pageData.spotlightFeatured.id}`
								: pageData.spotlightFeatured.url}
							class="group flex-1"
						>
							<div
								class="h-full flex-1 rounded-lg bg-cover bg-center"
								style="background-image: url('{pageData.spotlightFeatured.image}');"
							>
								<div class="flex h-full flex-col justify-between">
									<div class="flex justify-end">
										<div class="flex h-10 w-10 items-center justify-center rounded-bl-lg bg-black">
											<Fa icon={faStar} class="text-xl text-green-600" />
										</div>
									</div>
									<div
										class="flex h-1/4 flex-col justify-end rounded-br-lg rounded-bl-lg bg-linear-to-t from-black via-black/70 to-transparent"
									>
										<p class="p-4 font-semibold group-hover:text-blue-600">
											{pageData.spotlightFeatured.title}
										</p>
									</div>
								</div>
							</div>
						</a>
						<a
							href="/search?sort=newest"
							class="group/category flex w-full items-center justify-between rounded-lg bg-black px-4 py-2 no-underline"
						>
							<div class="flex items-center gap-2">
								<Fa icon={faStar} class="text-lg text-green-600" />
								<span class="text-sm text-white group-hover/category:text-blue-600"
									>Newest</span
								>
							</div>
							<Fa icon={faChevronRight} />
						</a>
					</div>

					<div class="flex h-[250px] flex-col gap-2 md:flex-1 xl:h-full" id="spotlight-trending">
						<a
							href={pageData.spotlightTrending.id
								? `/details/${pageData.spotlightTrending.id}`
								: pageData.spotlightTrending.url}
							class="group flex-1"
						>
							<div
								class="h-full flex-1 rounded-lg bg-cover bg-center"
								style="background-image: url('{pageData.spotlightTrending.image}');"
							>
								<div class="flex h-full flex-col justify-between">
									<div class="flex justify-end">
										<div class="flex h-10 w-10 items-center justify-center rounded-bl-lg bg-black">
											<Fa icon={faGem} class="text-xl text-blue-600" />
										</div>
									</div>
									<div
										class="flex h-1/4 flex-col justify-end rounded-br-lg rounded-bl-lg bg-linear-to-t from-black via-black/70 to-transparent"
									>
										<p class="p-4 font-semibold group-hover:text-blue-600">
											{pageData.spotlightTrending.title}
										</p>
									</div>
								</div>
							</div>
						</a>
						<a
							href="/search?sort=updated"
							class="group/category flex w-full items-center justify-between rounded-lg bg-black px-4 py-2 no-underline"
						>
							<div class="flex items-center gap-2">
								<Fa icon={faGem} class="text-lg text-blue-600" />
								<span class="text-sm text-white group-hover/category:text-blue-600"
									>Recently Updated</span
								>
							</div>
							<Fa icon={faChevronRight} />
						</a>
					</div>
				</div>
			</div>

			{#await pageData.popular}
				<div class="mt-10">
					<div class="flex items-end gap-1.5">
						<a href="/explore?sort=popular&time=alltime" class="text-2xl leading-none font-bold hover:text-blue-600">Most Popular</a>
						<a href="/explore?sort=popular&time=alltime" class="flex items-end hover:text-blue-600"><Fa icon={faChevronRight} class="text-xl" /></a>
					</div>
					<div class="my-5">
						<ModelsSkeleton />
					</div>
				</div>
			{:then popular}
				<ModelSection title="Most Popular" items={popular} href="/explore?sort=popular&time=alltime" />
			{/await}

			{#await pageData.newest}
				<div class="mt-10">
					<div class="flex items-end gap-1.5">
						<a href="/explore?sort=newest&time=alltime" class="text-2xl leading-none font-bold hover:text-blue-600">Newest</a>
						<a href="/explore?sort=newest&time=alltime" class="flex items-end hover:text-blue-600"><Fa icon={faChevronRight} class="text-xl" /></a>
					</div>
					<div class="my-5">
						<ModelsSkeleton />
					</div>
				</div>
			{:then newest}
				<ModelSection title="Newest" items={newest} href="/explore?sort=newest&time=alltime" />
			{/await}

			{#await pageData.recentlyUpdated}
				<div class="mt-10">
					<div class="flex items-end gap-1.5">
						<a href="/explore?sort=updated&time=alltime" class="text-2xl leading-none font-bold hover:text-blue-600">Recently Updated</a>
						<a href="/explore?sort=updated&time=alltime" class="flex items-end hover:text-blue-600"><Fa icon={faChevronRight} class="text-xl" /></a>
					</div>
					<div class="my-5">
						<ModelsSkeleton />
					</div>
				</div>
			{:then recentlyUpdated}
				<ModelSection title="Recently Updated" items={recentlyUpdated} href="/explore?sort=updated&time=alltime" />
			{/await}

			<div class="mt-10 hidden items-end gap-1.5">
				<a href="/" class="text-2xl leading-none font-bold">Ready to Print</a>
				<a href="/" class="flex items-end"><Fa icon={faChevronRight} class="text-xl" /></a>
			</div>

			<div
				class="responsive-grid-5 grid hidden grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
			>
				{#each readyToPrint as item}
					<a href="/" class="group">
						<div class="flex flex-col gap-4 rounded-lg bg-black p-4">
							<div
								class="h-48 w-full shrink-0 rounded-lg bg-cover bg-center"
								style="background-image: url('{item.image}');"
							></div>
							<div class="flex flex-1 flex-col justify-between gap-4">
								<p
									class="line-clamp-1 text-lg leading-none font-semibold group-hover:text-blue-500"
								>
									{item.title}
								</p>
								<div class="grid grid-cols-2 justify-between gap-2">
									<div class="flex items-center gap-2">
										<i class="fa-solid fa-wrench text-neutral-600" style="font-size: 20px;"></i>
										<p class="text-sm">{item.printer}</p>
									</div>
									<div class="flex items-center gap-2">
										<i class="fa-solid fa-layer-group text-neutral-600" style="font-size: 20px;"
										></i>
										<p class="text-sm">{item.plates} Plate{item.plates > 1 ? 's' : ''}</p>
									</div>
									<div class="flex items-center gap-2">
										<i class="fa-solid fa-clock text-neutral-600" style="font-size: 20px;"></i>
										<p class="text-sm">{item.time}</p>
									</div>
									<div class="flex items-center gap-2">
										<i class="fa-solid fa-weight-hanging text-neutral-600" style="font-size: 20px;"
										></i>
										<p class="text-sm">{item.weight}</p>
									</div>
								</div>
								<button class="w-full rounded-full bg-blue-600 p-2">
									<div class="flex items-center justify-center gap-1">
										<i class="fa-solid fa-print" style="font-size: 14px;"></i>
										<p class="text-sm text-white">Print</p>
									</div>
								</button>
							</div>
						</div>
					</a>
				{/each}
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
						<button onclick={handleLogout} class="rounded-lg bg-red-500 px-6 py-2 font-semibold text-white hover:bg-red-600 transition-colors">
							Sign Out
						</button>
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
