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

	function getVisibilityClass(index: number) {
		if (index < 3) {
			return '';
		}
		if (index === 3) {
			return 'hidden md:block lg:hidden xl:block';
		}
		if (index === 4) {
			return 'hidden sm:block md:hidden 2xl:block';
		}
		return 'hidden';
	}

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

<div class="mt-10">
	<a href={href} class="group inline-flex items-end gap-1.5">
		<h2 class="text-2xl leading-none font-bold group-hover:text-blue-600">{title}</h2>
		<div class="flex items-end group-hover:text-blue-600"><Fa icon={faChevronRight} class="text-xl" /></div>
	</a>
</div>

	<div
		class="my-5 grid grid-cols-1 gap-4 sm:grid-cols-1 md:grid-cols-2 md:gap-5 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
	>
		{#each items as item, index}
			<div class={getVisibilityClass(index)}>
				<ModelCard
					title={item.title}
					image={item.image}
					views={item.views}
					likes={item.likes}
					user={item.user}
					badge={item.badge ?? null}
					href={item.id ? `/details/${item.id}` : '/'}
				/>
			</div>
		{/each}
	</div>
