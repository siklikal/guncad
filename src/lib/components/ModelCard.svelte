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

	type BadgeType = 'exclusive' | 'featured' | 'trending' | null;

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
					<div class="flex justify-end p-2">
						<div class="flex h-8 w-8 items-center justify-center rounded-full bg-black">
							<Fa icon={badgeConfig.icon} class={`h-4 w-4 ${badgeConfig.color}`} />
						</div>
					</div>
				{/if}
			</div>
		</a>
		<div class="bg-black p-4">
			<a {href} class="line-clamp-2 block font-semibold group-hover:text-blue-600">
				{title}
			</a>
		</div>
	</div>
	<div class="flex justify-between gap-4 rounded-br-lg rounded-bl-lg bg-black px-4 pb-4">
		<a href="/user/{user.username}" class="group/user flex min-w-0 items-center gap-1">
			<div
				class="h-6 w-6 shrink-0 rounded-full bg-cover bg-center"
				style="background-image: url('{user.avatar}');"
			></div>
			<p class="truncate text-sm text-neutral-400 group-hover/user:text-blue-600">
				{user.username}
			</p>
		</a>
		<div class="flex items-center gap-2.5">
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
