<script lang="ts">
	import Fa from 'svelte-fa';
	import { faBookmark, faCalendar, faTrash } from '@fortawesome/free-solid-svg-icons';
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button/index.js';

	interface Bookmark {
		id: string;
		model_id: string;
		model_title: string;
		model_image: string;
		bookmarked_at: string;
	}

	let bookmarks = $state<Bookmark[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let removingBookmark = $state<string | null>(null);

	// Fetch bookmarks on mount
	onMount(async () => {
		try {
			const response = await fetch('/api/user/bookmarks');

			if (!response.ok) {
				throw new Error('Failed to fetch bookmarks');
			}

			const data = await response.json();
			bookmarks = data.bookmarks || [];
		} catch (err) {
			console.error('Error loading bookmarks:', err);
			error = 'Failed to load your bookmarks';
		} finally {
			loading = false;
		}
	});

	async function removeBookmark(modelId: string) {
		if (removingBookmark) return;

		removingBookmark = modelId;
		try {
			const response = await fetch('/api/bookmarks/toggle', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ modelId })
			});

			if (response.ok) {
				// Remove from local state
				bookmarks = bookmarks.filter((b) => b.model_id !== modelId);
			}
		} catch (error) {
			console.error('Failed to remove bookmark:', error);
		} finally {
			removingBookmark = null;
		}
	}

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<style>
	.spinner {
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		width: 16px;
		height: 16px;
		animation: spin 0.6s linear infinite;
		display: inline-block;
	}

	.spinner-lg {
		width: 48px;
		height: 48px;
		border-width: 3px;
		border-color: rgba(255, 255, 255, 0.3);
		border-top-color: white;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>

<div class="container mx-auto px-4 py-8">
	<div class="mb-8">
		<h1 class="mb-2 text-4xl font-bold">My Bookmarks</h1>
		<p class="text-neutral-400">Models you've saved for later</p>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-16">
			<div class="spinner spinner-lg"></div>
		</div>
	{:else if error}
		<div class="rounded-lg border border-red-500 bg-red-500/10 p-4 text-red-400">
			{error}
		</div>
	{:else if bookmarks.length === 0}
		<div
			class="flex flex-col items-center justify-center rounded-lg border border-neutral-700 bg-neutral-800/50 py-16"
		>
			<Fa icon={faBookmark} class="mb-4 text-4xl text-neutral-600" />
			<h2 class="mb-2 text-xl font-semibold text-neutral-300">No bookmarks yet</h2>
			<p class="text-neutral-400">
				You haven't bookmarked any models. Browse the catalog to save models you're interested in.
			</p>
		</div>
	{:else}
		<!-- Desktop Table View -->
		<div class="hidden overflow-hidden rounded-lg border border-neutral-700 lg:block">
			<table class="w-full">
				<thead class="bg-neutral-800">
					<tr>
						<th class="px-6 py-4 text-left text-sm font-semibold text-neutral-300">Model</th>
						<th class="px-6 py-4 text-left text-sm font-semibold text-neutral-300"
							>Bookmarked Date</th
						>
						<th class="px-6 py-4 text-right text-sm font-semibold text-neutral-300">Action</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-neutral-700">
					{#each bookmarks as bookmark}
						<tr class="bg-neutral-800/30 hover:bg-neutral-800/50">
							<td class="px-6 py-4">
								<a
									href="/details/{bookmark.model_id}"
									class="flex items-center gap-4 hover:opacity-80"
								>
									<div
										class="h-16 w-24 shrink-0 rounded-lg bg-cover bg-center"
										style="background-image: url('{bookmark.model_image}');"
									></div>
									<div>
										<p class="font-semibold text-white">{bookmark.model_title}</p>
									</div>
								</a>
							</td>
							<td class="px-6 py-4">
								<div class="flex items-center gap-2 text-neutral-300">
									<Fa icon={faCalendar} class="text-sm text-neutral-500" />
									<span>{formatDate(bookmark.bookmarked_at)}</span>
								</div>
							</td>
							<td class="px-6 py-4 text-right">
								<Button
									size="sm"
									variant="destructive"
									onclick={() => removeBookmark(bookmark.model_id)}
									disabled={removingBookmark === bookmark.model_id}
								>
									{#snippet children()}
										<span class="inline-block w-4">
											{#if removingBookmark === bookmark.model_id}
												<div class="spinner"></div>
											{:else}
												<Fa icon={faTrash} class="text-sm" />
											{/if}
										</span>
										Remove
									{/snippet}
								</Button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Mobile Card View -->
		<div class="space-y-4 lg:hidden">
			{#each bookmarks as bookmark}
				<div class="rounded-lg border border-neutral-700 bg-neutral-800/30 p-4">
					<a href="/details/{bookmark.model_id}" class="block">
						<div
							class="mb-3 h-48 w-full rounded-lg bg-cover bg-center"
							style="background-image: url('{bookmark.model_image}');"
						></div>
						<h3 class="mb-1 text-lg font-semibold text-white">{bookmark.model_title}</h3>
					</a>

					<div class="mt-3 mb-3 flex items-center gap-2 text-sm text-neutral-300">
						<Fa icon={faCalendar} class="text-sm text-neutral-500" />
						<span>{formatDate(bookmark.bookmarked_at)}</span>
					</div>

					<Button
						variant="destructive"
						class="w-full"
						onclick={() => removeBookmark(bookmark.model_id)}
						disabled={removingBookmark === bookmark.model_id}
					>
						{#snippet children()}
							<span class="inline-block w-4">
								{#if removingBookmark === bookmark.model_id}
									<div class="spinner"></div>
								{:else}
									<Fa icon={faTrash} class="text-sm" />
								{/if}
							</span>
							Remove Bookmark
						{/snippet}
					</Button>
				</div>
			{/each}
		</div>
	{/if}
</div>
