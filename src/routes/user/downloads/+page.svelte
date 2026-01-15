<script lang="ts">
	import type { PageData } from './$types';
	import Fa from 'svelte-fa';
	import { faDownload, faShoppingCart, faCalendar } from '@fortawesome/free-solid-svg-icons';
	import { Button } from '$lib/components/ui/button/index.js';

	let { data }: { data: PageData } = $props();

	// Track which model is currently downloading
	let downloadingModel = $state<string | null>(null);

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function formatPrice(amount: number, currency: string): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: currency || 'USD'
		}).format(amount);
	}

	async function handleDownload(modelId: string, modelTitle: string) {
		if (downloadingModel) return; // Prevent multiple simultaneous downloads

		downloadingModel = modelId;

		try {
			console.log('[Downloads] Starting download for:', modelId);

			// Construct the canonical LBRY URL
			const canonicalUrl = `lbry://${modelId}`;

			// Use the LBRY download endpoint
			const response = await fetch('/api/lbry-download', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					uri: canonicalUrl,
					fileName: `${modelTitle}.zip`
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Download failed');
			}

			// Extract filename from Content-Disposition header if available
			const contentDisposition = response.headers.get('Content-Disposition');
			const fileNameMatch = contentDisposition?.match(/filename="(.+)"/);
			const fileName = fileNameMatch ? fileNameMatch[1] : `${modelTitle}.zip`;

			// Convert response to blob and trigger browser download
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = fileName;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);

			console.log('[Downloads] Download completed');
		} catch (error) {
			console.error('[Downloads] Download error:', error);
			const errorMessage = error instanceof Error ? error.message : 'Download failed';
			alert(`Download failed: ${errorMessage}`);
		} finally {
			downloadingModel = null;
		}
	}
</script>

<div class="container mx-auto px-4 py-8">
	<div class="mb-8">
		<h1 class="mb-2 text-4xl font-bold">My Downloads</h1>
		<p class="text-neutral-400">Models you've purchased</p>
	</div>

	{#if data.error}
		<div class="rounded-lg border border-red-500 bg-red-500/10 p-4 text-red-400">
			{data.error}
		</div>
	{:else if data.purchases.length === 0}
		<div class="flex flex-col items-center justify-center rounded-lg border border-neutral-700 bg-neutral-800/50 py-16">
			<Fa icon={faShoppingCart} class="mb-4 text-4xl text-neutral-600" />
			<h2 class="mb-2 text-xl font-semibold text-neutral-300">No purchases yet</h2>
			<p class="mb-6 text-neutral-400">Purchase models to see them here</p>
			<Button>
				{#snippet children()}
					Browse Models
				{/snippet}
			</Button>
		</div>
	{:else}
		<!-- Desktop Table View -->
		<div class="hidden overflow-hidden rounded-lg border border-neutral-700 lg:block">
			<table class="w-full">
				<thead class="bg-neutral-800">
					<tr>
						<th class="px-6 py-4 text-left text-sm font-semibold text-neutral-300">Model</th>
						<th class="px-6 py-4 text-left text-sm font-semibold text-neutral-300"
							>Purchase Date</th
						>
						<th class="px-6 py-4 text-left text-sm font-semibold text-neutral-300">Price</th>
						<th class="px-6 py-4 text-right text-sm font-semibold text-neutral-300">Action</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-neutral-700">
					{#each data.purchases as purchase}
						<tr class="bg-neutral-800/30 hover:bg-neutral-800/50">
							<td class="px-6 py-4">
								<a
									href="/details/{purchase.model_id}"
									class="flex items-center gap-4 hover:opacity-80"
								>
									<div
										class="h-16 w-24 shrink-0 rounded-lg bg-cover bg-center"
										style="background-image: url('{purchase.model_image}');"
									></div>
									<div>
										<p class="font-semibold text-white">{purchase.model_title}</p>
									</div>
								</a>
							</td>
							<td class="px-6 py-4">
								<div class="flex items-center gap-2 text-neutral-300">
									<Fa icon={faCalendar} class="text-sm text-neutral-500" />
									<span>{formatDate(purchase.purchased_at)}</span>
								</div>
							</td>
							<td class="px-6 py-4">
								<span class="font-semibold text-green-400"
									>{formatPrice(purchase.amount, purchase.currency)}</span
								>
							</td>
							<td class="px-6 py-4 text-right">
								<Button
									size="sm"
									onclick={() => handleDownload(purchase.model_id, purchase.model_title)}
									disabled={downloadingModel === purchase.model_id}
								>
									{#snippet children()}
										{#if downloadingModel === purchase.model_id}
											<span class="loading loading-sm loading-spinner"></span>
										{:else}
											<Fa icon={faDownload} class="text-sm" />
										{/if}
										{downloadingModel === purchase.model_id ? 'Downloading...' : 'Download'}
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
			{#each data.purchases as purchase}
				<div class="rounded-lg border border-neutral-700 bg-neutral-800/30 p-4">
					<a href="/details/{purchase.model_id}" class="mb-4 block">
						<div
							class="mb-3 h-48 w-full rounded-lg bg-cover bg-center"
							style="background-image: url('{purchase.model_image}');"
						></div>
						<h3 class="mb-1 text-lg font-semibold text-white">{purchase.model_title}</h3>
					</a>

					<div class="mb-3 flex items-center justify-between text-sm">
						<div class="flex items-center gap-2 text-neutral-300">
							<Fa icon={faCalendar} class="text-sm text-neutral-500" />
							<span>{formatDate(purchase.purchased_at)}</span>
						</div>
						<span class="font-semibold text-green-400"
							>{formatPrice(purchase.amount, purchase.currency)}</span
						>
					</div>

					<Button
						class="w-full"
						onclick={() => handleDownload(purchase.model_id, purchase.model_title)}
						disabled={downloadingModel === purchase.model_id}
					>
						{#snippet children()}
							{#if downloadingModel === purchase.model_id}
								<span class="loading loading-sm loading-spinner"></span>
							{:else}
								<Fa icon={faDownload} class="text-sm" />
							{/if}
							{downloadingModel === purchase.model_id ? 'Downloading...' : 'Download'}
						{/snippet}
					</Button>
				</div>
			{/each}
		</div>
	{/if}
</div>
