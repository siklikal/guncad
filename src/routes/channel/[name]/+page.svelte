<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import ModelCard from '$lib/components/ModelCard.svelte';
	import { getProjectUrl } from '$lib/utils/projectUrl';

	let { data }: { data: PageData } = $props();

	interface Project {
		id: string;
		title: string;
		image: string;
		views: number;
		likes: number;
		user: {
			username: string;
			handle: string;
			avatar: string;
		};
	}

	let initialLoading = $state(true);
	let loading = $state(false);
	let projects = $state<Project[]>([]);
	let count = $state(0);
	let hasMore = $state(false);
	let channelAvatar = $state('');
	let channelDisplayName = $state('');

	let observer: IntersectionObserver;
	let loadMoreTrigger = $state<HTMLDivElement | undefined>(undefined);

	let channelName = $derived(data.channelName);
	let sortParam = $derived(data.sort || 'newest');
	let timeParam = $derived(data.time || 'alltime');

	let selectedSort = $state(sortParam);
	let selectedTime = $state(timeParam);
	let currentSort = $state(sortParam);
	let currentTime = $state(timeParam);

	const sortOptions = [
		{ value: 'newest', label: 'Newest' },
		{ value: 'updated', label: 'Recently Updated' },
		{ value: 'biggest', label: 'Biggest' },
		{ value: 'popular', label: 'Most Popular' }
	];

	const timeOptions = [
		{ value: 'alltime', label: 'All Time' },
		{ value: 'day', label: 'Today' },
		{ value: 'week', label: 'This Week' },
		{ value: 'month', label: 'This Month' },
		{ value: 'season', label: 'This Season' },
		{ value: 'year', label: 'This Year' }
	];

	$effect(() => {
		if (currentSort !== sortParam || currentTime !== timeParam) {
			currentSort = sortParam;
			currentTime = timeParam;
			selectedSort = sortParam;
			selectedTime = timeParam;
			fetchProjects();
		}
	});

	onMount(() => {
		fetchProjects();
	});

	async function fetchProjects() {
		initialLoading = true;
		projects = [];

		try {
			const apiUrl = new URL('/api/releases', window.location.origin);
			apiUrl.searchParams.set('limit', '20');
			apiUrl.searchParams.set('channel', `@${channelName}`);
			apiUrl.searchParams.set('sort', currentSort);
			apiUrl.searchParams.set('time', currentTime);

			const response = await fetch(apiUrl.toString());

			if (!response.ok) {
				projects = [];
				count = 0;
				hasMore = false;
				return;
			}

			const data = await response.json();

			projects = data.releases;
			count = data.count;
			hasMore = data.hasMore;

			if (projects.length > 0) {
				if (projects[0].user?.avatar) {
					channelAvatar = projects[0].user.avatar;
				}
				if (projects[0].user?.username) {
					channelDisplayName = projects[0].user.username;
				}
			}
		} catch (error) {
			console.error('Error fetching channel releases:', error);
			projects = [];
			count = 0;
			hasMore = false;
		} finally {
			initialLoading = false;
		}
	}

	$effect(() => {
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
					rootMargin: '200px',
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
			apiUrl.searchParams.set('channel', `@${channelName}`);
			apiUrl.searchParams.set('sort', currentSort);
			apiUrl.searchParams.set('time', currentTime);

			const response = await fetch(apiUrl.toString());

			if (!response.ok) {
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

	function updateFilters() {
		const params = new URLSearchParams();
		if (selectedSort && selectedSort !== 'newest') {
			params.set('sort', selectedSort);
		}
		if (selectedTime && selectedTime !== 'alltime') {
			params.set('time', selectedTime);
		}
		const queryString = params.toString();
		goto(queryString ? `/channel/${channelName}?${queryString}` : `/channel/${channelName}`, {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
	}
</script>

<svelte:head>
	<title>{channelDisplayName || 'Channel'} - GUNCAD</title>
	<meta name="description" content="Models by {channelDisplayName || 'this channel'}" />
</svelte:head>

<div class="px-4">
	<div class="mb-6 flex flex-wrap items-start justify-between gap-4">
		<div class="flex items-center gap-3">
			{#if channelAvatar && !initialLoading}
				<div
					class="h-12 w-12 shrink-0 rounded-full bg-cover bg-center"
					style="background-image: url('{channelAvatar !== 'https://guncadindex.com/static/images/default-avatar.png' ? channelAvatar : '/images/default-avatar.avif'}');"
				></div>
			{:else if initialLoading}
				<div class="h-12 w-12 animate-pulse rounded-full bg-neutral-700"></div>
			{/if}
			<div>
				{#if initialLoading}
					<div class="h-9 w-48 animate-pulse rounded bg-neutral-700 md:h-10"></div>
					<div class="mt-2 h-6 w-32 animate-pulse rounded bg-neutral-700"></div>
				{:else}
					<h1 class="text-3xl font-bold md:text-4xl">{channelDisplayName || channelName}</h1>
					<p class="mt-1 text-neutral-400">{count} models</p>
				{/if}
			</div>
		</div>
		<div class="flex items-center gap-2">
			<select
				class="rounded-lg border border-neutral-700 bg-black px-3 py-2 text-sm text-white"
				bind:value={selectedSort}
				onchange={updateFilters}
			>
				{#each sortOptions as option}
					<option value={option.value}>{option.label}</option>
				{/each}
			</select>
			<select
				class="rounded-lg border border-neutral-700 bg-black px-3 py-2 text-sm text-white"
				bind:value={selectedTime}
				onchange={updateFilters}
			>
				{#each timeOptions as option}
					<option value={option.value}>{option.label}</option>
				{/each}
			</select>
		</div>
	</div>

	{#if initialLoading}
		<div class="flex h-64 items-center justify-center">
			<div class="flex flex-col items-center gap-3">
				<div
					class="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"
				></div>
				<p class="text-neutral-400">Loading models...</p>
			</div>
		</div>
	{:else if projects.length > 0}
		<div
			class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-2 md:gap-5 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
		>
			{#each projects as project}
				<div class="animate-in fade-in" style="animation-duration: 400ms;">
					<ModelCard
						title={project.title}
						image={project.image}
						views={project.views}
						likes={project.likes}
						user={project.user}
						href={getProjectUrl(project.title, project.id)}
					/>
				</div>
			{/each}
		</div>

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
		{/if}
	{:else}
		<div class="flex h-64 items-center justify-center">
			<div class="text-center">
				<p class="text-xl text-neutral-400">No models found for this user</p>
			</div>
		</div>
	{/if}
</div>
