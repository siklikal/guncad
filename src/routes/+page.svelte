<script lang="ts">
	import { user, auth, loading } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import { readyToPrint } from '$lib/data/readyToPrint';
	import { blog } from '$lib/data/blog';
	import ModelSection from '$lib/components/ModelSection.svelte';
	import { getTagColorClass } from '$lib/utils/tagColors';
	import Fa from 'svelte-fa';
	import {
		faChevronRight,
		faChevronLeft,
		faGem,
		faStar,
		faFire,
		faEye
	} from '@fortawesome/free-solid-svg-icons';

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

{#if $loading}
	<div class="flex h-screen items-center justify-center">
		<div class="text-center">
			<div
				class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"
			></div>
			<p class="text-neutral-400">Loading...</p>
		</div>
	</div>
{:else if $user}
	<div>
		<div class="mx-auto max-w-[1920px] px-4 md:px-8">
			<div class="flex flex-col gap-5 xl:flex-row">
				<!-- <div class="carousel h-[600px] w-full flex-1 rounded-lg xl:h-[390px]"> -->
				<div class="carousel w-full rounded-lg lg:flex-1 xl:h-[390px]">
					<div id="slide1" class="relative carousel-item w-full overflow-hidden">
						<!-- Video Background -->
						<video
							autoplay
							muted
							loop
							playsinline
							class="absolute inset-0 h-full w-full object-cover"
						>
							<source src="/videos/hero.mp4" type="video/mp4" />
						</video>

						<!-- Semi-transparent overlay -->
						<div class="absolute inset-0 bg-blue-600/80"></div>

						<!-- Content (appears above overlay) -->
						<div class="relative flex h-full w-full flex-col items-start justify-center gap-4 p-8">
							<p class="text-5xl leading-tight font-bold">
								The Trusted Platform for <br />3D-Printed Firearm Innovation
							</p>
							<p class="text-2xl">Safe. Trusted. Community Approved.</p>
							<a href="/" class=" rounded-full bg-black px-8 py-3 font-bold text-white">Join Now</a>
						</div>
					</div>
				</div>

				<div class="flex flex-1 gap-5">
					<div class="flex h-[346px] flex-1 flex-col gap-2 xl:h-full" id="spotlight-exclusive">
						<a href={data.spotlightExclusive.url} class="group flex-1">
							<div
								class="h-full flex-1 rounded-lg bg-cover bg-center"
								style="background-image: url('{data.spotlightExclusive.image}');"
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
											{data.spotlightExclusive.title}
										</p>
									</div>
								</div>
							</div>
						</a>
						<a
							href="/premium-models"
							class="group/category flex w-full items-center justify-between rounded-lg bg-black px-4 py-2 no-underline"
						>
							<div class="flex items-center gap-2">
								<Fa icon={faGem} class="text-lg text-blue-600" />
								<span class="text-sm text-white group-hover/category:text-blue-600"
									>Exclusive Models</span
								>
							</div>
							<Fa icon={faChevronRight} />
						</a>
					</div>

					<div class="flex h-[346px] flex-1 flex-col gap-2 xl:h-full" id="spotlight-featured">
						<a href={data.spotlightFeatured.url} class="group flex-1">
							<div
								class="h-full flex-1 rounded-lg bg-cover bg-center"
								style="background-image: url('{data.spotlightFeatured.image}');"
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
											{data.spotlightFeatured.title}
										</p>
									</div>
								</div>
							</div>
						</a>
						<a
							href="/premium-models"
							class="group/category flex w-full items-center justify-between rounded-lg bg-black px-4 py-2 no-underline"
						>
							<div class="flex items-center gap-2">
								<Fa icon={faStar} class="text-lg text-green-600" />
								<span class="text-sm text-white group-hover/category:text-blue-600"
									>Featured Models</span
								>
							</div>
							<Fa icon={faChevronRight} />
						</a>
					</div>

					<div
						class="hidden h-[346px] flex-1 flex-col gap-2 lg:flex xl:h-full"
						id="spotlight-trending"
					>
						<a href={data.spotlightTrending.url} class="group flex-1">
							<div
								class="h-full flex-1 rounded-lg bg-cover bg-center"
								style="background-image: url('{data.spotlightTrending.image}');"
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
										<p class="p-4 font-semibold group-hover:text-blue-600">
											{data.spotlightTrending.title}
										</p>
									</div>
								</div>
							</div>
						</a>
						<a
							href="/premium-models"
							class="group/category flex w-full items-center justify-between rounded-lg bg-black px-4 py-2 no-underline"
						>
							<div class="flex items-center gap-2">
								<Fa icon={faFire} class="text-lg text-red-600" />
								<span class="text-sm text-white group-hover/category:text-blue-600"
									>Trending Models</span
								>
							</div>
							<Fa icon={faChevronRight} />
						</a>
					</div>
				</div>
			</div>

			<div class="mt-10 flex items-end gap-1.5">
				<a href="/" class="text-2xl leading-none font-bold">Popular Tags</a>
				<a href="/" class="flex items-end"><Fa icon={faChevronRight} class="text-xl" /></a>
			</div>

			<div class="my-5 flex items-center gap-4">
				<button
					onclick={scrollLeftBtn}
					class="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-black"
				>
					<Fa icon={faChevronLeft} class="text-xl" />
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
						{#if data.tags && data.tags.length > 0}
							{#each data.tags as tag}
								<a
									href="/tag/{tag.slug}"
									class="shrink-0 rounded-full border bg-black px-4 py-3 text-sm whitespace-nowrap {getTagColorClass(
										tag.slug
									)}"
								>
									{tag.name}
								</a>
							{/each}
						{:else}
							<p class="text-neutral-400">No tags available</p>
						{/if}
					</div>
				</div>

				<button
					onclick={scrollRightBtn}
					class="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-black"
				>
					<Fa icon={faChevronRight} class="text-xl" />
				</button>
			</div>

			<div class="mt-10 flex items-end gap-1.5">
				<a href="/" class="text-2xl leading-none font-bold">Collections</a>
				<a href="/" class="flex items-end"><Fa icon={faChevronRight} class="text-xl" /></a>
			</div>

			<div
				class="responsive-grid-5 my-5 grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
			>
				{#each data.collections as collection}
					<a href="/collections/{collection.title}" class="group">
						<div class="rounded-lg">
							<div
								class="grid grid-cols-2 grid-rows-2 gap-0.5 rounded-tl-lg rounded-tr-lg bg-neutral-400 p-0.5"
							>
								{#each collection.fetchedImages.slice(0, 4) as image, idx}
									<div
										class="h-32 bg-cover bg-center md:h-20 {idx === 0
											? 'rounded-tl-lg'
											: idx === 1
												? 'rounded-tr-lg'
												: ''}"
										style="background-image: url('{image}');"
									></div>
								{/each}
							</div>
							<div class="flex flex-col gap-2 rounded-br-lg rounded-bl-lg bg-black px-5 py-3">
								<div class="flex items-center justify-between">
									<p class="line-clamp-1 font-bold group-hover:text-blue-600">{collection.title}</p>
									<div class="flex items-center gap-1">
										<Fa icon={faEye} class="text-sm text-neutral-400" />
										<p class="text-sm text-neutral-400">
											{collection.views >= 1000
												? `${(collection.views / 1000).toFixed(1)}k`
												: collection.views}
										</p>
									</div>
								</div>
								<p class="line-clamp-3 text-xs leading-relaxed text-neutral-400">
									{collection.description}
								</p>
							</div>
						</div>
					</a>
				{/each}
			</div>

			<ModelSection title="Exclusive" items={data.exclusive} href="/exclusive" />

			<ModelSection title="Featured" items={data.featured} href="/featured" />

			<ModelSection title="Trending" items={data.trending} href="/trending" />

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

			<div class="mt-10 flex items-end gap-1.5">
				<a href="/" class="text-2xl leading-none font-bold">Blog</a>
				<a href="/" class="flex items-end"><Fa icon={faChevronRight} class="text-xl" /></a>
			</div>

			<div
				class="responsive-grid-5 my-5 grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
			>
				{#each blog as item, index}
					<a href="/wtf" class="group">
						<div class="rounded-lg">
							<div
								class="h-[222px] rounded-tl-lg rounded-tr-lg bg-cover bg-center"
								style="background-image: url('images/blog-{index + 1}.jpg');"
							></div>
							<div
								class="flex flex-1 flex-col justify-between gap-4 rounded-br-lg rounded-bl-lg bg-black p-4"
							>
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
{/if}

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
