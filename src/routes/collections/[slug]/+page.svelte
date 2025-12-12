<script lang="ts">
	import type { PageData } from './$types';
	import ModelCard from '$lib/components/ModelCard.svelte';
	import Fa from 'svelte-fa';
	import { faEye } from '@fortawesome/free-solid-svg-icons';

	let { data }: { data: PageData } = $props();

	function formatNumber(num: number): string {
		return num >= 1000 ? `${(num / 1000).toFixed(1)}k` : num.toString();
	}
</script>

<svelte:head>
	<title>{data.collection.title} - GUNCAD</title>
	<meta name="description" content={data.collection.description} />
</svelte:head>

<div class="container mx-auto">
	<!-- Collection Header -->
	<div class="mb-8">
		<h1 class="mb-4 text-4xl font-bold md:text-5xl">{data.collection.title}</h1>
		<div class="mb-4 flex items-center gap-4">
			<div class="flex items-center gap-2">
				<Fa icon={faEye} class="text-neutral-400" />
				<span class="text-neutral-400">{formatNumber(data.collection.views)} views</span>
			</div>
			<span class="text-neutral-600">•</span>
			<span class="text-neutral-400">{data.projects.length} projects</span>
		</div>
		<p class="max-w-3xl text-lg text-neutral-400">
			{data.collection.description}
		</p>
	</div>

	<!-- Projects Grid -->
	{#if data.projects.length > 0}
		<div
			class="responsive-grid-5 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-2 md:gap-5 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
		>
			{#each data.projects as project}
				<ModelCard
					title={project.title}
					image={project.image}
					views={project.views}
					likes={project.likes}
					user={project.user}
					href={project.id ? `/details/${project.id}` : '/'}
				/>
			{/each}
		</div>
	{:else}
		<div class="flex h-64 items-center justify-center">
			<div class="text-center">
				<p class="text-xl text-neutral-400">No projects found in this collection</p>
			</div>
		</div>
	{/if}
</div>
