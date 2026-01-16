<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchCollections } from '$lib/api/homepage';
	import Fa from 'svelte-fa';
	import { faEye } from '@fortawesome/free-solid-svg-icons';
	import CollectionsSkeleton from '$lib/components/skeletons/CollectionsSkeleton.svelte';

	let collections = $state<any[]>([]);
	let loading = $state(true);

	onMount(async () => {
		try {
			collections = await fetchCollections();
		} catch (error) {
			console.error('Failed to load collections:', error);
		} finally {
			loading = false;
		}
	});
</script>

<div class="container mx-auto">
	<div class="mb-8">
		<h1 class="text-3xl font-bold md:text-4xl">Collections</h1>
		<p class="mt-2 text-neutral-400">
			Curated collections of projects organized by skill level and category
		</p>
	</div>

	{#if loading}
		<CollectionsSkeleton />
	{:else if collections.length > 0}
		<div
			class="responsive-grid-5 grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
		>
			{#each collections as collection}
				<a
					href="/collections/{collection.title.toLowerCase().replace(/\s+/g, '-')}"
					class="group"
				>
					<div class="rounded-lg">
						<div
							class="grid grid-cols-2 grid-rows-2 gap-0.5 rounded-tl-lg rounded-tr-lg bg-neutral-400 p-0.5"
						>
							{#each collection.fetchedImages.slice(0, 4) as image, idx}
								<div
									class="bg-cover bg-center {idx === 0
										? 'rounded-tl-lg'
										: idx === 1
											? 'rounded-tr-lg'
											: ''}"
									style="background-image: url('{image}'); aspect-ratio: 16 / 9;"
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
	{:else}
		<div class="flex h-64 items-center justify-center">
			<p class="text-neutral-400">No collections found</p>
		</div>
	{/if}
</div>
