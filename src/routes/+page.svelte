<script lang="ts">
	import { user, auth, loading } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import {
		Eye,
		CircleStar,
		ChevronRight,
		ChevronLeft,
		Crown,
		Flame,
		Sparkles,
		Clock,
		Weight,
		Layers2,
		Wrench,
		Printer
	} from '@lucide/svelte';
	import { popularTags } from '$lib/data/tags';
	import { collections } from '$lib/data/collections';
	import { readyToPrint } from '$lib/data/readyToPrint';
	import { blog } from '$lib/data/blog';

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

	let carouselElement: HTMLDivElement;
	let showLeftGradient = $state(false);
	let showRightGradient = $state(true);

	function updateGradients() {
		if (!carouselElement) return;

		const { scrollLeft, scrollWidth, clientWidth } = carouselElement;
		showLeftGradient = scrollLeft > 0;
		showRightGradient = scrollLeft < scrollWidth - clientWidth - 10;
	}

	function scrollLeftBtn() {
		carouselElement?.scrollBy({ left: -300, behavior: 'smooth' });
	}

	function scrollRightBtn() {
		carouselElement?.scrollBy({ left: 300, behavior: 'smooth' });
	}
</script>

<div>
	<div class="mx-auto max-w-[1920px] px-8">
		<div class="flex gap-5">
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

			<div class="flex flex-1 gap-5">
				<div class="flex flex-1 flex-col gap-2">
					<div
						class="flex-1 rounded-lg bg-cover bg-center"
						style="background-image: url('https://guncadindex.com/media/thumbnails/thumbnail-d06fa14f-ffb0-4224-a851-bf241e474500-768.webp');"
					>
						<div class="flex h-full flex-col justify-between">
							<div class="flex justify-end p-3">
								<div class="rounded-full bg-black p-1">
									<CircleStar class="h-7 w-7 leading-0 text-blue-600" />
								</div>
							</div>
							<div
								class="flex h-1/4 flex-col justify-end rounded-br-lg rounded-bl-lg bg-linear-to-t from-black via-black/70 to-transparent"
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
							<CircleStar class="h-5 text-blue-600" />
							<span class="text-sm text-white">Exclusive Models</span>
						</div>
						<ChevronRight />
					</a>
				</div>

				<div class="flex flex-1 flex-col gap-2">
					<div
						class="flex-1 rounded-lg bg-cover bg-center"
						style="background-image: url('https://guncadindex.com/media/thumbnails/thumbnail-30143aea-61f5-4d1c-b695-d0b077b0f81c-768_5MPqZeS.webp');"
					>
						<div class="flex h-full flex-col justify-between">
							<div class="flex justify-end p-3">
								<div class="rounded-full bg-black p-2">
									<Flame class="h-5 w-5 leading-0 text-red-600" />
								</div>
							</div>
							<div
								class="flex h-1/4 flex-col justify-end rounded-br-lg rounded-bl-lg bg-linear-to-t from-black via-black/70 to-transparent"
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
							<Flame class="h-5 text-red-600" />
							<span class="text-sm text-white">Trending Models</span>
						</div>
						<ChevronRight />
					</a>
				</div>

				<div class="flex flex-1 flex-col gap-2">
					<div
						class="flex-1 rounded-lg bg-cover bg-center"
						style="background-image: url('https://guncadindex.com/media/thumbnails/thumbnail-3fde3396-9743-4afa-88dd-993df763d50e-768_wvfmNXY.webp');"
					>
						<div class="flex h-full flex-col justify-between">
							<div class="flex justify-end p-3">
								<div class="rounded-full bg-black p-2">
									<Sparkles class="h-5 w-5 leading-0 text-green-600" />
								</div>
							</div>
							<div
								class="flex h-1/4 flex-col justify-end rounded-br-lg rounded-bl-lg bg-linear-to-t from-black via-black/70 to-transparent"
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
							<Sparkles class="h-5 text-green-600" />
							<span class="text-sm text-white">Featured Models</span>
						</div>
						<ChevronRight />
					</a>
				</div>
			</div>
		</div>
		<a href="/popular-tags" class="mt-10 flex items-center gap-1 text-2xl font-bold">
			Popular Tags
			<ChevronRight class="h-7 w-7" />
		</a>

		<div class="my-5 flex items-center gap-4">
			<button
				onclick={scrollLeftBtn}
				class="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full bg-black"
			>
				<ChevronLeft class="h-5 w-5 -translate-x-px" />
			</button>

			<div class="relative w-full overflow-hidden">
				<!-- Left gradient fade -->
				{#if showLeftGradient}
					<div
						class="pointer-events-none absolute top-0 left-0 z-10 h-full w-24 bg-linear-to-r from-neutral-900 to-transparent"
					></div>
				{/if}

				<!-- Right gradient fade -->
				{#if showRightGradient}
					<div
						class="pointer-events-none absolute top-0 right-0 z-10 h-full w-24 bg-linear-to-l from-neutral-900 to-transparent"
					></div>
				{/if}

				<div
					bind:this={carouselElement}
					onscroll={updateGradients}
					class="scrollbar-hide flex w-full space-x-2 overflow-x-auto scroll-smooth"
				>
					{#each popularTags as tag}
						<a
							href="/tag"
							class="shrink-0 rounded-full border bg-black px-4 py-3 text-sm whitespace-nowrap {tag.classes}"
						>
							{tag.name}
						</a>
					{/each}
				</div>
			</div>

			<button
				onclick={scrollRightBtn}
				class="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full bg-black"
			>
				<ChevronRight class="h-5 w-5 translate-x-px" />
			</button>
		</div>

		<a href="/collections" class="mt-10 mb-5 flex items-center gap-1 text-2xl font-bold">
			Collections
			<ChevronRight class="h-7 w-7" />
		</a>

		<div
			class="responsive-grid-5 grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
		>
			{#each collections as collection}
				<div>
					<div class="flex justify-center">
						<div class="h-4 w-11/12 rounded-tl-lg rounded-tr-lg bg-neutral-700"></div>
					</div>
					<div class="rounded-lg shadow-lg shadow-neutral-800">
						<div
							class="h-[170px] rounded-tl-lg rounded-tr-lg bg-cover bg-center"
							style="background-image: url('{collection.image}');"
						></div>
						<div
							class="flex items-center justify-between rounded-br-lg rounded-bl-lg bg-black px-5 py-3"
						>
							<p class="line-clamp-1 font-bold">{collection.title}</p>
							<div class="flex items-center gap-2">
								<Eye class="h-4 w-4 text-neutral-400" />
								<p class="text-sm text-neutral-400">
									{collection.views >= 1000
										? `${(collection.views / 1000).toFixed(1)}k`
										: collection.views}
								</p>
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>

		<a href="/collections" class="mt-10 mb-5 flex items-center gap-1 text-2xl font-bold">
			Ready to Print
			<ChevronRight class="h-7 w-7" />
		</a>

		<div
			class="responsive-grid-5 grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
		>
			{#each readyToPrint as item}
				<div class="flex flex-col gap-4 rounded-lg bg-black p-4">
					<div
						class="h-48 w-full shrink-0 rounded-lg bg-cover bg-center"
						style="background-image: url('{item.image}');"
					></div>
					<div class="flex flex-1 flex-col justify-between gap-4">
						<a
							href="/item/{item.id}"
							class="line-clamp-1 text-lg leading-none font-semibold hover:text-blue-500"
						>
							{item.title}
						</a>
						<div class="grid grid-cols-2 justify-between gap-2">
							<div class="flex items-center gap-2">
								<Wrench class="h-5 w-5 text-neutral-600" />
								<p class="text-sm">{item.printer}</p>
							</div>
							<div class="flex items-center gap-2">
								<Layers2 class="h-5 w-5 text-neutral-600" />
								<p class="text-sm">{item.plates} Plate{item.plates > 1 ? 's' : ''}</p>
							</div>
							<div class="flex items-center gap-2">
								<Clock class="h-5 w-5 text-neutral-600" />
								<p class="text-sm">{item.time}</p>
							</div>
							<div class="flex items-center gap-2">
								<Weight class="h-5 w-5 text-neutral-600" />
								<p class="text-sm">{item.weight}</p>
							</div>
						</div>
						<button class="w-full rounded-full bg-blue-600 p-2">
							<div class="flex items-center justify-center gap-1">
								<Printer class="h-4 w-4" />
								<p class="text-sm text-white">Print</p>
							</div>
						</button>
					</div>
				</div>
			{/each}
		</div>

		<a href="/collections" class="mt-10 mb-5 flex items-center gap-1 text-2xl font-bold">
			Blog
			<ChevronRight class="h-7 w-7" />
		</a>

		<div
			class="responsive-grid-5 grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
		>
			{#each blog as item, index}
				<a href="/wtf" class="group">
					<div class="flex flex-col gap-4 rounded-lg bg-black p-4">
						<div
							class="h-48 w-full shrink-0 rounded-lg bg-cover bg-center"
							style="background-image: url('images/blog-{index + 1}.jpg');"
						></div>
						<div class="flex flex-1 flex-col justify-between gap-4">
							<p class="line-clamp-2 font-semibold group-hover:text-blue-600">
								{item.title}
							</p>
							<p class="text-sm text-neutral-400">
								{item.category}
							</p>
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
