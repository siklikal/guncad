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
		handle: string;
		avatar: string;
	}

	export type BadgeType = 'exclusive' | 'featured' | 'trending' | null;

	interface ModelCardProps {
		title: string;
		image: string;
		views: number;
		likes: number;
		user: User;
		href?: string;
		badge?: BadgeType;
	}

	let { title, image, views, likes, user, href = '/', badge = null }: ModelCardProps = $props();

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
				class="rounded-lg bg-blue-600 bg-cover bg-center"
				style="background-image: url('{image}'); aspect-ratio: 14 / 9;"
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
		<div class="pt-2 pb-2">
			<a {href} class="line-clamp-1 text-sm font-semibold group-hover:text-blue-600 md:text-base">
				{title}
			</a>
		</div>
	</div>
	<div class="flex justify-between gap-1 pb-4 md:flex-row md:gap-4">
		<a href="/channel/{user.handle ? user.handle.replace('@', '') : user.username}" class="group/user flex min-w-0 flex-[0.45] items-center gap-1">
			<div
				class="h-5 w-5 shrink-0 rounded-full bg-cover bg-center"
				style="background-image: url('{user.avatar &&
				user.avatar !== 'https://guncadindex.com/static/images/default-avatar.png'
					? user.avatar
					: '/images/default-avatar.avif'}');"
			></div>
			<p class="truncate text-xs text-neutral-400 group-hover/user:text-blue-600">
				{user.username}
			</p>
		</a>
		<div class="flex flex-[0.55] justify-end gap-3">
			<div class="flex items-center gap-1 text-xs">
				<Fa icon={faEye} class="text-neutral-400" />
				<p>{formatNumber(views)}</p>
			</div>
			<div class="flex items-center gap-1 text-xs">
				<Fa icon={faDownload} class="text-neutral-400" />
				<p>0</p>
			</div>
			<div class="flex items-center gap-1 text-xs">
				<Fa icon={faHeart} class="text-neutral-400" />
				<p>{formatNumber(likes)}</p>
			</div>
		</div>
	</div>
	<!-- <div class="flex justify-between rounded-br-lg rounded-bl-lg bg-black p-4">
		<div class="flex items-center gap-1 text-xs">
			<Fa icon={faEye} />
			<p class="text-neutral-400">55</p>
		</div>
		<div class="flex items-center gap-1 text-xs">
			<Fa icon={faDownload} />
			<p class="text-neutral-400">55</p>
		</div>
		<div class="flex items-center gap-1 text-xs">
			<Fa icon={faHeart} />
			<p class="text-neutral-400">55</p>
		</div>
	</div> -->
</div>
