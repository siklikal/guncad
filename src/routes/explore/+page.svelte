<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import Fa from 'svelte-fa';
	import { faXmark } from '@fortawesome/free-solid-svg-icons';
	import ModelCard from '$lib/components/ModelCard.svelte';

	let { data }: { data: PageData } = $props();

	interface Release {
		id: string;
		name: string;
		description: string;
		released: string;
		thumbnail: string;
		thumbnail_manager?: {
			small: string;
			large: string;
		};
		odysee_views?: number;
		odysee_likes?: number;
		channel?: {
			name: string;
			thumbnail_manager?: {
				small: string;
				large: string;
			};
		};
	}

	interface ReleasesResponse {
		count: number;
		next: string | null;
		previous: string | null;
		results: Release[];
	}

	interface Project {
		id: string;
		title: string;
		image: string;
		views: number;
		likes: number;
		user: {
			username: string;
			avatar: string;
		};
	}

	let initialLoading = $state(true);
	let loading = $state(false);
	let projects = $state<Project[]>([]);
	let count = $state(0);
	let hasMore = $state(false);
	let currentSearchQuery = $state(data.searchQuery);

	let observer: IntersectionObserver;
	let loadMoreTrigger = $state<HTMLDivElement | undefined>(undefined);

	let searchQuery = $derived(data.searchQuery);

	// Fetch initial data when component mounts or search query changes
	$effect(() => {
		if (currentSearchQuery !== searchQuery) {
			currentSearchQuery = searchQuery;
			fetchProjects();
		}
	});

	onMount(() => {
		fetchProjects();
	});

	async function fetchProjects() {
		console.log('fetchProjects called, searchQuery:', searchQuery);
		initialLoading = true;
		projects = [];

		try {
			// Use local API endpoint which proxies to GCI
			const apiUrl = new URL('/api/releases', window.location.origin);
			apiUrl.searchParams.set('limit', '20');

			// Only add search if present
			if (searchQuery) {
				apiUrl.searchParams.set('search', searchQuery);
			}

			console.log('Fetching from:', apiUrl.toString());

			const response = await fetch(apiUrl.toString());

			console.log('Response status:', response.status);

			if (!response.ok) {
				console.error('Failed to fetch releases, status:', response.status);
				projects = [];
				count = 0;
				hasMore = false;
				return;
			}

			const data = await response.json();
			console.log('API data received:', data);

			projects = data.releases;
			count = data.count;
			hasMore = data.hasMore;

			console.log('Projects loaded:', projects.length, 'projects');
		} catch (error) {
			console.error('Error fetching releases:', error);
			projects = [];
			count = 0;
			hasMore = false;
		} finally {
			initialLoading = false;
		}
	}

	$effect(() => {
		// Set up intersection observer for infinite scroll
		if (typeof window !== 'undefined' && loadMoreTrigger) {
			observer = new IntersectionObserver(
				(entries) => {
					const entry = entries[0];
					if (entry.isIntersecting && hasMore && !loading) {
						loadMore();
					}
				},
				{
					root: null,
					rootMargin: '200px', // Load more when 200px from bottom
					threshold: 0
				}
			);

			observer.observe(loadMoreTrigger);

			return () => {
				if (observer) {
					observer.disconnect();
				}
			};
		}
	});

	async function loadMore() {
		if (loading || !hasMore) return;

		loading = true;

		try {
			const offset = projects.length;
			const apiUrl = new URL('/api/releases', window.location.origin);
			apiUrl.searchParams.set('limit', '20');
			apiUrl.searchParams.set('offset', offset.toString());

			// Only add search if present
			if (searchQuery) {
				apiUrl.searchParams.set('search', searchQuery);
			}

			const response = await fetch(apiUrl.toString());

			if (!response.ok) {
				console.error('Failed to load more releases');
				return;
			}

			const data = await response.json();

			projects = [...projects, ...data.releases];
			hasMore = data.hasMore;
		} catch (error) {
			console.error('Error loading more releases:', error);
		} finally {
			loading = false;
		}
	}

	function clearSearch() {
		goto('/explore');
	}
</script>

<svelte:head>
	<title>Explore Models - GUNCAD</title>
	<meta name="description" content="Explore the latest 3D-printed firearm models and accessories" />
</svelte:head>

<div class="container mx-auto">
	<!-- Active Search Badge -->
	{#if searchQuery}
		<div class="mb-6">
			<button
				onclick={clearSearch}
				class="inline-flex items-center gap-2 rounded-full border border-neutral-600 bg-neutral-800 px-4 py-2 text-sm hover:bg-neutral-700"
			>
				<span>Search: <span class="font-semibold">{searchQuery}</span></span>
				<Fa icon={faXmark} class="text-lg" />
			</button>
			<p class="mt-2 text-sm text-neutral-400">{count} results found</p>
		</div>
	{:else}
		<div class="mb-6">
			<h1 class="text-3xl font-bold md:text-4xl">Latest Releases</h1>
			<p class="mt-2 text-neutral-400">{count} models available</p>
		</div>
	{/if}

	<!-- Loading State for Initial Data Fetch -->
	{#if initialLoading}
		<div class="flex h-64 items-center justify-center">
			<div class="flex flex-col items-center gap-3">
				<div
					class="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"
				></div>
				<p class="text-neutral-400">Loading results...</p>
			</div>
		</div>
	{:else if projects.length > 0}
		<!-- Results Grid -->
		<div
			class="responsive-grid-5 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-2 md:gap-5 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
		>
			{#each projects as project}
				<ModelCard
					title={project.title}
					image={project.image}
					views={project.views}
					likes={project.likes}
					user={project.user}
					href={`/details/${project.id}`}
				/>
			{/each}
		</div>

		<!-- Loading Trigger for Infinite Scroll -->
		{#if hasMore}
			<div bind:this={loadMoreTrigger} class="mt-8 flex justify-center py-8">
				{#if loading}
					<div class="flex flex-col items-center gap-3">
						<div
							class="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"
						></div>
						<p class="text-sm text-neutral-400">Loading more models...</p>
					</div>
				{:else}
					<p class="text-sm text-neutral-500">Scroll for more</p>
				{/if}
			</div>
		{:else if projects.length > 0}
			<div class="mt-8 flex justify-center py-8">
				<p class="text-sm text-neutral-500">No more models to load</p>
			</div>
		{/if}
	{:else}
		<div class="flex h-64 items-center justify-center">
			<div class="text-center">
				<p class="text-xl text-neutral-400">
					{searchQuery ? 'No models found for your search' : 'No models available'}
				</p>
				{#if searchQuery}
					<button
						onclick={clearSearch}
						class="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
					>
						Clear Search
					</button>
				{/if}
			</div>
		</div>
	{/if}
</div>
