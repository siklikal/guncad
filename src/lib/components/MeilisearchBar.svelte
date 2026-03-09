<script lang="ts">
	import { MeiliSearch } from 'meilisearch';
	import { goto } from '$app/navigation';
	import { PUBLIC_MEILISEARCH_URL, PUBLIC_MEILISEARCH_SEARCH_KEY } from '$env/static/public';

	const client = new MeiliSearch({
		host: PUBLIC_MEILISEARCH_URL,
		apiKey: PUBLIC_MEILISEARCH_SEARCH_KEY
	});
	const index = client.index('releases');

	interface MeilisearchHit {
		objectID: string;
		model_name: string;
		model_name_slug: string;
		model_thumbnail: string;
		user: string;
		user_thumbnail: string;
	}

	let query = $state('');
	let results = $state<MeilisearchHit[]>([]);
	let isOpen = $state(false);
	let selectedIndex = $state(-1);
	let debounceTimer: ReturnType<typeof setTimeout>;
	let inputEl: HTMLInputElement;

	function handleInput() {
		clearTimeout(debounceTimer);
		const value = query.trim();
		if (!value) {
			results = [];
			isOpen = false;
			return;
		}
		debounceTimer = setTimeout(() => search(value), 150);
	}

	async function search(value: string) {
		try {
			const res = await index.search<MeilisearchHit>(value, { limit: 8 });
			results = res.hits;
			isOpen = results.length > 0;
			selectedIndex = -1;
		} catch {
			results = [];
			isOpen = false;
		}
	}

	function navigateToResult(hit: MeilisearchHit) {
		if (hit.model_name_slug) {
			goto(`/details/${hit.model_name_slug}`);
		}
		close();
	}

	function close() {
		isOpen = false;
		selectedIndex = -1;
		query = '';
		inputEl?.blur();
	}

	function submitSearch() {
		const q = query.trim();
		if (q) {
			goto(`/explore?search=${encodeURIComponent(q)}`);
		} else {
			goto('/explore');
		}
		close();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			close();
			return;
		}

		if (e.key === 'Enter') {
			e.preventDefault();
			if (isOpen && selectedIndex >= 0 && results[selectedIndex]) {
				navigateToResult(results[selectedIndex]);
			} else {
				submitSearch();
			}
			return;
		}

		if (!isOpen) return;

		if (e.key === 'ArrowDown') {
			e.preventDefault();
			selectedIndex = selectedIndex < results.length - 1 ? selectedIndex + 1 : 0;
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			selectedIndex = selectedIndex > 0 ? selectedIndex - 1 : results.length - 1;
		}
	}

	function handleBlur() {
		setTimeout(() => {
			isOpen = false;
			selectedIndex = -1;
		}, 200);
	}
</script>

<div class="relative w-full md:flex lg:w-[340px] xl:w-[400px]">
	<input
		bind:this={inputEl}
		bind:value={query}
		oninput={handleInput}
		onkeydown={handleKeydown}
		onblur={handleBlur}
		onfocus={() => {
			if (results.length > 0) isOpen = true;
		}}
		type="text"
		placeholder="Search..."
		class="h-9 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 text-sm text-white placeholder-neutral-500 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
	/>

	{#if isOpen && results.length > 0}
		<div
			class="absolute top-full left-0 z-[100] mt-1 max-h-[400px] w-full overflow-y-auto rounded-lg border border-neutral-700 bg-neutral-900 shadow-xl"
		>
			{#each results as hit, i (hit.objectID)}
				<button
					type="button"
					class="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-neutral-800
						{selectedIndex === i ? 'bg-neutral-800' : ''}"
					onmousedown={() => navigateToResult(hit)}
					onmouseenter={() => (selectedIndex = i)}
				>
					{#if hit.model_thumbnail}
						<div
							class="h-10 w-14 shrink-0 rounded bg-neutral-800 bg-cover bg-center"
							style="background-image: url('{hit.model_thumbnail}');"
						></div>
					{/if}
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-medium text-white">{hit.model_name}</p>
						{#if hit.user}
							<p class="truncate text-xs text-neutral-400">{hit.user}</p>
						{/if}
					</div>
				</button>
			{/each}
			<button
				type="button"
				class="w-full border-t border-neutral-700 px-3 py-2 text-center text-xs text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
				onmousedown={submitSearch}
			>
				View all results
			</button>
		</div>
	{/if}
</div>
