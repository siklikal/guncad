<script lang="ts">
	import { goto } from '$app/navigation';
	import { onDestroy } from 'svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import { trigger as hapticTrigger } from '$lib/haptics';

	interface Suggestion {
		model_name: string;
		model_name_slug: string;
		model_thumbnail: string;
		user: string;
	}

	const MIN_QUERY_LENGTH = 2;
	const DEBOUNCE_MS = 220;

	let searchQuery = $state('');
	let suggestions = $state<Suggestion[]>([]);
	let showSuggestions = $state(false);
	let isLoading = $state(false);
	let instantSearchEnabled = $state(true);

	let debounceTimer: ReturnType<typeof setTimeout> | undefined;
	let requestId = 0;

	onDestroy(() => {
		if (debounceTimer) {
			clearTimeout(debounceTimer);
		}
	});

	function handleSearch(e: Event) {
		e.preventDefault();
		const query = searchQuery.trim();
		showSuggestions = false;

		if (query) {
			goto(`/explore?search=${encodeURIComponent(query)}`);
			searchQuery = '';
			suggestions = [];
		} else {
			goto('/explore');
		}
	}

	function handleFocus() {
		if (instantSearchEnabled && suggestions.length > 0) {
			showSuggestions = true;
		}
	}

	function handleBlur() {
		setTimeout(() => {
			showSuggestions = false;
		}, 120);
	}

	function handleInput() {
		if (debounceTimer) {
			clearTimeout(debounceTimer);
		}

		const query = searchQuery.trim();
		if (!instantSearchEnabled || query.length < MIN_QUERY_LENGTH) {
			suggestions = [];
			showSuggestions = false;
			isLoading = false;
			return;
		}

		debounceTimer = setTimeout(() => {
			void fetchSuggestions(query);
		}, DEBOUNCE_MS);
	}

	async function fetchSuggestions(query: string) {
		const currentRequestId = ++requestId;
		isLoading = true;

		try {
			const response = await fetch(`/api/meili-search?q=${encodeURIComponent(query)}&limit=8`);
			if (!response.ok) {
				throw new Error(`Suggestion request failed with ${response.status}`);
			}

			const payload = await response.json();
			if (currentRequestId !== requestId) {
				return;
			}

			suggestions = Array.isArray(payload.suggestions) ? payload.suggestions : [];
			showSuggestions = true;
		} catch (error) {
			if (currentRequestId !== requestId) {
				return;
			}
			console.error('[SearchBarMeili] Instant search disabled:', error);
			instantSearchEnabled = false;
			suggestions = [];
			showSuggestions = false;
		} finally {
			if (currentRequestId === requestId) {
				isLoading = false;
			}
		}
	}

	function openSuggestion(slug: string) {
		hapticTrigger('nudge');
		showSuggestions = false;
		suggestions = [];
		searchQuery = '';
		void goto(`/details/${encodeURIComponent(slug)}`);
	}
</script>

<div class="relative w-full md:flex lg:w-[340px] xl:w-[400px]">
	<form onsubmit={handleSearch} class="w-full">
		<Input
			type="text"
			bind:value={searchQuery}
			oninput={handleInput}
			onfocus={handleFocus}
			onblur={handleBlur}
			placeholder="Search..."
			autocomplete="off"
			class="w-full"
		/>
	</form>

	{#if instantSearchEnabled && showSuggestions}
		<div
			class="absolute top-full right-0 left-0 z-[60] mt-2 max-h-80 overflow-y-auto rounded-md border border-neutral-700 bg-neutral-900 shadow-xl"
		>
			{#if isLoading}
				<div class="px-3 py-2 text-sm text-neutral-400">Searching...</div>
			{:else if suggestions.length === 0 && searchQuery.trim().length >= MIN_QUERY_LENGTH}
				<div class="px-3 py-2 text-sm text-neutral-400">No results</div>
			{:else}
				{#each suggestions as item (item.model_name_slug)}
					<button
						type="button"
						class="flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-left hover:bg-neutral-800"
						onclick={() => openSuggestion(item.model_name_slug)}
					>
						{#if item.model_thumbnail}
							<img
								src={item.model_thumbnail}
								alt={item.model_name}
								class="h-10 w-10 rounded object-cover"
								loading="lazy"
							/>
						{:else}
							<div class="h-10 w-10 rounded bg-neutral-800"></div>
						{/if}
						<div class="min-w-0">
							<p class="truncate text-sm text-white">{item.model_name}</p>
							{#if item.user}
								<p class="truncate text-xs text-neutral-400">by {item.user}</p>
							{/if}
						</div>
					</button>
				{/each}
			{/if}
		</div>
	{/if}
</div>
