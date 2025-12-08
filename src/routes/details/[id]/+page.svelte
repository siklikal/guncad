<script lang="ts">
	import type { PageData } from './$types';
	import Fa from 'svelte-fa';
	import {
		faEye,
		faHeart,
		faGem,
		faStar,
		faFire,
		faBookmark,
		faShare,
		faDownload
	} from '@fortawesome/free-solid-svg-icons';
	import { getTagColorClass } from '$lib/utils/tagColors';

	let { data }: { data: PageData } = $props();

	function formatNumber(num: number): string {
		return num >= 1000 ? `${(num / 1000).toFixed(1)}k` : num.toString();
	}

	function getBadgeConfig(type: string | null) {
		switch (type) {
			case 'exclusive':
				return { icon: faGem, color: 'text-blue-600', label: 'Exclusive' };
			case 'featured':
				return { icon: faStar, color: 'text-green-600', label: 'Featured' };
			case 'trending':
				return { icon: faFire, color: 'text-red-600', label: 'Trending' };
			default:
				return null;
		}
	}

	const badgeConfig = data.project?.badge ? getBadgeConfig(data.project.badge) : null;
</script>

<div class="container mx-auto">
	{#if data.error}
		<div class="alert alert-error">
			<span>{data.error}</span>
		</div>
	{:else if data.project}
		<div class="grid gap-8 lg:grid-cols-2">
			<!-- Project Image -->
			<div class="relative">
				<div
					class="rounded-lg bg-cover bg-center"
					style="background-image: url('{data.project.image}'); aspect-ratio: 16 / 9;"
				>
					{#if badgeConfig}
						<div class="flex justify-end">
							<div class="flex items-center gap-2 rounded-tr-lg rounded-bl-lg bg-black px-4 py-2">
								<Fa icon={badgeConfig.icon} class={`text-lg ${badgeConfig.color}`} />
								<span class="text-sm font-semibold text-white">{badgeConfig.label}</span>
							</div>
						</div>
					{/if}
				</div>
			</div>

			<!-- Project Details -->
			<div class="flex flex-col gap-6">
				<div>
					<h1 class="mb-4 text-3xl font-bold md:text-4xl">{data.project.title}</h1>

					<!-- User Info -->
					<a
						href="/user/{data.project.user.username}"
						class="group/user inline-flex items-center gap-1"
					>
						<div
							class="h-8 w-8 shrink-0 rounded-full bg-cover bg-center"
							style="background-image: url('{data.project.user.avatar}');"
						></div>
						<div>
							<p class="text-sm font-semibold group-hover/user:text-blue-600">
								{data.project.user.username}
							</p>
						</div>
					</a>
				</div>

				{#if data.project.tags && data.project.tags.length > 0}
					<div class="flex flex-wrap gap-2">
						{#each data.project.tags as tag}
							<a
								href="/tag/{tag.toLowerCase()}"
								class="shrink-0 rounded-full border bg-black px-3 py-2 text-xs whitespace-nowrap {getTagColorClass(
									tag.toLowerCase()
								)}"
							>
								{tag}
							</a>
						{/each}
					</div>
				{/if}

				<div class="flex justify-between rounded-lg border border-neutral-400">
					<div
						class="flex flex-1 items-center justify-center gap-2 rounded-tl-lg rounded-bl-lg border-r border-neutral-400 bg-neutral-800 p-3"
					>
						<Fa icon={faEye} class="text-sm text-neutral-400 md:text-lg" />
						<p class="text-sm font-semibold md:text-lg">{formatNumber(data.project.views)}</p>
					</div>
					<div
						class="flex flex-1 items-center justify-center gap-2 border-r border-neutral-400 bg-neutral-800 p-3"
					>
						<Fa icon={faHeart} class="text-sm text-neutral-400 md:text-lg" />
						<p class="text-sm font-semibold md:text-lg">{formatNumber(data.project.likes)}</p>
					</div>
					<div
						class="flex flex-1 items-center justify-center gap-2 border-r border-neutral-400 bg-neutral-800 p-3"
					>
						<Fa icon={faBookmark} class="text-sm text-neutral-400 md:text-lg" />
						<p class="text-sm font-semibold md:text-lg">{formatNumber(data.project.likes)}</p>
					</div>
					<a href="/" class="flex h-full flex-1 border-r border-neutral-400">
						<div class="flex flex-1 items-center justify-center gap-2 bg-neutral-800 p-3">
							<Fa icon={faDownload} class="text-sm text-neutral-400 md:text-lg" />
							<p class="text-sm font-semibold md:text-lg">{formatNumber(data.project.likes)}</p>
						</div>
					</a>
					<a href="/" class="group flex h-full flex-1">
						<div
							class="flex flex-1 items-center justify-center gap-2 rounded-tr-lg rounded-br-lg bg-neutral-800 p-3 group-hover:bg-neutral-700"
						>
							<Fa icon={faShare} class="text-sm text-neutral-400 md:text-lg" />
						</div>
					</a>
				</div>

				<div>
					<p
						class="wrap-brea-words rounded-lg bg-black p-6 text-sm leading-relaxed whitespace-pre-wrap"
					>
						{data.project.description || 'No description available'}
					</p>
				</div>
			</div>
		</div>
	{:else}
		<div class="flex h-64 items-center justify-center">
			<div class="text-center">
				<div
					class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"
				></div>
				<p class="text-neutral-400">Loading project...</p>
			</div>
		</div>
	{/if}
</div>
