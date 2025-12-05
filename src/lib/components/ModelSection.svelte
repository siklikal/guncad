<script lang="ts">
	import Fa from 'svelte-fa';
	import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
	import ModelCard, { type BadgeType } from './ModelCard.svelte';

	interface User {
		username: string;
		avatar: string;
	}

	interface Model {
		title: string;
		image: string;
		views: number;
		likes: number;
		user: User;
		badge?: BadgeType;
	}

	interface ModelSectionProps {
		title: string;
		items: Model[];
		href?: string;
		badge?: BadgeType; // section-level badge
	}

	let { title, items, href = '/collections', badge = null }: ModelSectionProps = $props();
</script>

<div class="mt-10 flex items-end gap-1.5">
	<a href="/" class="text-2xl leading-none font-bold">{title}</a>
	<a href="/" class="flex items-end"><Fa icon={faChevronRight} class="text-xl" /></a>
</div>

<div
	class="responsive-grid-5 my-5 grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-2 md:gap-5 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
>
	{#each items as item}
		<ModelCard
			title={item.title}
			image={item.image}
			views={item.views}
			likes={item.likes}
			user={item.user}
			badge={item.badge ?? null}
		/>
	{/each}
</div>
