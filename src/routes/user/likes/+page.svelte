<script lang="ts">
	import Fa from 'svelte-fa';
	import { faHeart, faTrash } from '@fortawesome/free-solid-svg-icons';
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button/index.js';

	interface LikeItem {
		id: string;
		model_id: string;
		model_title: string;
		model_image: string;
		liked_at: string;
	}

	let likes = $state<LikeItem[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let removingLike = $state<string | null>(null);

	// Fetch likes on mount
	onMount(async () => {
		try {
			const response = await fetch('/api/user/likes');

			if (!response.ok) {
				throw new Error('Failed to fetch likes');
			}

			const data = await response.json();
			likes = data.likes || [];
		} catch (err) {
			console.error('Error loading likes:', err);
			error = 'Failed to load your liked models';
		} finally {
			loading = false;
		}
	});

	async function removeLike(modelId: string) {
		if (removingLike) return;

		removingLike = modelId;
		try {
			const response = await fetch('/api/project-stats/toggle-like', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ projectId: modelId })
			});

			if (response.ok) {
				likes = likes.filter((like) => like.model_id !== modelId);
			}
		} catch (error) {
			console.error('Failed to remove like:', error);
		} finally {
			removingLike = null;
		}
	}
</script>

<div class="container mx-auto px-4 py-8">
	<div class="mb-8">
		<h1 class="mb-2 text-4xl font-bold">Liked Models</h1>
		<p class="text-neutral-400">Models you've liked</p>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-16">
			<div class="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
		</div>
	{:else if error}
		<div class="rounded-lg border border-red-500 bg-red-500/10 p-4 text-red-400">
			{error}
		</div>
	{:else if likes.length === 0}
		<div
			class="flex flex-col items-center justify-center rounded-lg border border-neutral-700 bg-neutral-800/50 py-16"
		>
			<Fa icon={faHeart} class="mb-4 text-4xl text-neutral-600" />
			<h2 class="mb-2 text-xl font-semibold text-neutral-300">No likes yet</h2>
			<p class="text-neutral-400">
				You haven't liked any models. Browse the catalog to find models you enjoy.
			</p>
		</div>
	{:else}
		<!-- Desktop Table View -->
		<div class="hidden overflow-hidden rounded-lg border border-neutral-700 lg:block">
			<table class="w-full">
				<thead class="bg-neutral-800">
					<tr>
						<th class="px-6 py-4 text-left text-sm font-semibold text-neutral-300">Model</th>
						<th class="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold text-neutral-300">Action</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-neutral-700">
					{#each likes as like}
						<tr class="bg-neutral-800/30 hover:bg-neutral-800/50">
							<td class="px-6 py-4">
								<a
									href="/details/{like.model_id}"
									class="flex items-center gap-4 hover:opacity-80"
								>
									<div
										class="h-16 w-24 shrink-0 rounded-lg bg-cover bg-center"
										style="background-image: url('{like.model_image}');"
									></div>
									<div class="min-w-0">
										<p class="font-semibold text-white break-words">{like.model_title}</p>
									</div>
								</a>
							</td>
							<td class="whitespace-nowrap px-6 py-4 text-right">
								<Button
									size="sm"
									variant="destructive"
									onclick={() => removeLike(like.model_id)}
									disabled={removingLike === like.model_id}
								>
									{#snippet children()}
										<span class="inline-block w-4">
											{#if removingLike === like.model_id}
												<div class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
											{:else}
												<Fa icon={faTrash} class="text-sm" />
											{/if}
										</span>
										Unlike
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
			{#each likes as like}
				<div class="rounded-lg border border-neutral-700 bg-neutral-800/30 p-4">
					<a href="/details/{like.model_id}" class="block">
						<div
							class="mb-3 h-48 w-full rounded-lg bg-cover bg-center"
							style="background-image: url('{like.model_image}');"
						></div>
						<h3 class="mb-1 text-lg font-semibold text-white">{like.model_title}</h3>
					</a>

					<Button
						variant="destructive"
						class="mt-4 w-full"
						onclick={() => removeLike(like.model_id)}
						disabled={removingLike === like.model_id}
					>
						{#snippet children()}
							<span class="inline-block w-4">
								{#if removingLike === like.model_id}
									<div class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
								{:else}
									<Fa icon={faTrash} class="text-sm" />
								{/if}
							</span>
							Unlike
						{/snippet}
					</Button>
				</div>
			{/each}
		</div>
	{/if}
</div>
