<script lang="ts">
	import { page } from '$app/state';
	import { Settings, Download, Bookmark, Heart, User } from '@lucide/svelte';
	import { cn } from '$lib/utils';

	const navItems = [
		{ href: '/user/settings', label: 'Settings', icon: Settings },
		{ href: '/user/downloads', label: 'Downloads', icon: Download },
		{ href: '/user/likes', label: 'Liked', icon: Heart },
		{ href: '/user/bookmarks', label: 'Bookmarks', icon: Bookmark }
	];

	function isActive(href: string) {
		return page.url.pathname === href;
	}
</script>

<div class="container mx-auto flex">
	<!-- Sidebar -->
	<aside class="hidden w-64 border-r border-border bg-card md:block">
		<div class="sticky top-16 p-6">
			<h2 class="mb-4 text-lg font-semibold">Account</h2>
			<nav class="space-y-1">
				{#each navItems as item}
					<a
						href={item.href}
						class={cn(
							'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
							isActive(item.href)
								? 'bg-accent text-accent-foreground'
								: 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
						)}
					>
						<svelte:component this={item.icon} class="h-4 w-4" />
						{item.label}
					</a>
				{/each}
			</nav>
		</div>
	</aside>

	<!-- Main Content Area -->
	<main class="flex-1">
		<div class="mx-auto max-w-4xl">
			<slot />
		</div>
	</main>
</div>
