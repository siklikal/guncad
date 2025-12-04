<script lang="ts">
	import Fa from 'svelte-fa';
	import {
		faGem,
		faStar,
		faFire,
		faEye,
		faDownload,
		faHeart
	} from '@fortawesome/free-solid-svg-icons';

	interface User {
		username: string;
		avatar: string;
	}

	export type BadgeType = 'exclusive' | 'featured' | 'trending' | null;

	interface ModelCardProps {
		title: string;
		image: string;
		views: number;
		likes: number;
		downloads: number;
		user: User;
		href?: string;
		badge?: BadgeType;
	}

	let {
		title,
		image,
		views,
		likes,
		downloads,
		user,
		href = '/',
		badge = null
	}: ModelCardProps = $props();

	function formatNumber(num: number): string {
		return num >= 1000 ? `${(num / 1000).toFixed(1)}k` : num.toString();
	}

	function getBadgeConfig(type: BadgeType) {
		switch (type) {
			case 'exclusive':
				return { icon: faGem, color: 'text-blue-600' };
			case 'featured':
				return { icon: faStar, color: 'text-green-600' };
			case 'trending':
				return { icon: faFire, color: 'text-red-600' };
			default:
				return null;
		}
	}

	const badgeConfig = getBadgeConfig(badge);
</script>

<div class="rounded-lg">
	<div class="group">
		<a {href} class="relative block" {title}>
			<div
				class="h-[200px] rounded-tl-lg rounded-tr-lg bg-cover bg-center"
				style="background-image: url('{image}');"
			>
				{#if badgeConfig}
					<div class="flex justify-end">
						<div
							class="flex h-8 w-8 items-center justify-center rounded-tr-lg rounded-bl-lg bg-black"
						>
							<Fa icon={badgeConfig.icon} class={`h-4 w-4 ${badgeConfig.color}`} />
						</div>
					</div>
				{/if}
			</div>
		</a>
		<div class="bg-black ps-4 pe-4 pt-4 pb-2 md:py-4 md:pb-2">
			<a {href} class="line-clamp-1 text-sm font-semibold group-hover:text-blue-600 md:text-base">
				{title}
			</a>
		</div>
	</div>
	<div
		class="flex flex-col justify-between gap-2 rounded-br-lg rounded-bl-lg bg-black px-4 pb-4 md:flex-row md:gap-4"
	>
		<a href="/user/{user.username}" class="group/user flex min-w-0 items-center gap-1">
			<div
				class="h-6 w-6 shrink-0 rounded-full bg-cover bg-center"
				style="background-image: url('{user.avatar}');"
			></div>
			<p class="truncate text-xs text-neutral-400 group-hover/user:text-blue-600 md:text-sm">
				{user.username}
			</p>
		</a>
		<div class="flex items-center justify-between gap-2.5 md:justify-end">
			<div class="flex items-center gap-1">
				<Fa icon={faEye} class="text-sm text-neutral-400" />
				<p class="text-xs text-neutral-400">
					{formatNumber(views)}
				</p>
			</div>
			<div class="flex items-center gap-1">
				<Fa icon={faDownload} class="text-sm text-neutral-400" />
				<p class="text-xs text-neutral-400">
					{formatNumber(downloads)}
				</p>
			</div>
			<div class="flex items-center gap-1">
				<Fa icon={faHeart} class="text-sm text-neutral-400" />
				<p class="text-xs text-neutral-400">
					{formatNumber(likes)}
				</p>
			</div>
		</div>
	</div>
</div>
