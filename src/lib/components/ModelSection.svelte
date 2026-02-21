<script lang="ts">
	import Fa from 'svelte-fa';
	import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
	import ModelCard, { type BadgeType } from './ModelCard.svelte';

	interface User {
		username: string;
		handle: string;
		avatar: string;
	}

	interface Model {
		title: string;
		image: string;
		views: number;
		likes: number;
		user: User;
		badge?: BadgeType;
		id?: string;
	}

	interface ModelSectionProps {
		title: string;
		items: Model[];
		href?: string;
		badge?: BadgeType; // section-level badge
	}

	let { title, items, href = '/collections', badge = null }: ModelSectionProps = $props();

	// Debug: Log items to check if they have IDs
	$effect(() => {
		if (items && items.length > 0) {
			console.log(`[ModelSection ${title}] First item:`, {
				hasId: !!items[0].id,
				id: items[0].id,
				title: items[0].title
			});
		}
	});
</script>

<a href={href} class="group mt-10 flex items-end gap-1.5">
	<h2 class="text-2xl leading-none font-bold group-hover:text-blue-600">{title}</h2>
	<div class="flex items-end group-hover:text-blue-600"><Fa icon={faChevronRight} class="text-xl" /></div>
</a>

<div
	class="responsive-grid-5 my-5 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-2 md:gap-5 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
>
	{#each items as item}
		<ModelCard
			title={item.title}
			image={item.image}
			views={item.views}
			likes={item.likes}
			user={item.user}
			badge={item.badge ?? null}
			href={item.id ? `/details/${item.id}` : '/'}
		/>
	{/each}
</div>
