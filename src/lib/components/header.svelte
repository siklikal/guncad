<script lang="ts">
	import Fa from 'svelte-fa';
	import { faBars, faTimes } from '@fortawesome/free-solid-svg-icons';
	import { browser } from '$app/environment';
	import { user, auth } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { LogOut, Settings, Download, Bookmark } from '@lucide/svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';

	let mobileMenuOpen = $state(false);

	async function handleLogout() {
		const { error } = await auth.signOut();
		if (!error) {
			goto('/login');
		}
	}

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;

		// Lock/unlock body scroll
		if (browser) {
			if (mobileMenuOpen) {
				document.body.style.overflow = 'hidden';
			} else {
				document.body.style.overflow = '';
			}
		}
	}

	function closeMobileMenu() {
		mobileMenuOpen = false;
		if (browser) {
			document.body.style.overflow = '';
		}
	}
</script>

<header class="sticky top-0 z-50 w-full bg-black">
	<div class="mx-auto max-w-[1920px] px-4 py-3 md:px-8">
		<div class="flex items-center justify-between gap-4">
			<div class="flex items-center gap-6">
				<a href="/" class="site-logo text-xl font-bold text-white uppercase">Guncad</a>
				<a href="/explore" class="link-primary hidden capitalize md:flex">explore</a>
				<a href="/collections" class="link-primary hidden capitalize md:flex">collections</a>
				<a href="/leaderboard" class="link-primary hidden capitalize md:flex">leaderboard</a>
				<a href="/downloads" class="link-primary hidden capitalize md:flex">downloads</a>
			</div>
			<div class="flex flex-1 items-center justify-end gap-4">
				<Input
					type="text"
					placeholder="Search..."
					class="w-full rounded-full md:flex lg:w-[340px] xl:w-[400px]"
				/>
				<div class="hidden md:flex">
					{#if $user}
						<DropdownMenu.Root>
							<DropdownMenu.Trigger><Button>My Account</Button></DropdownMenu.Trigger>
							<DropdownMenu.Content class="w-[200px]">
								<DropdownMenu.Group>
									<DropdownMenu.Item class="cursor-pointer" onclick={() => goto('/user/settings')}
										><Settings />Settings</DropdownMenu.Item
									>
									<DropdownMenu.Item class="cursor-pointer" onclick={() => goto('/user/downloads')}
										><Download />Downloads</DropdownMenu.Item
									>
									<DropdownMenu.Item class="cursor-pointer" onclick={() => goto('/user/bookmarks')}
										><Bookmark />Bookmarks</DropdownMenu.Item
									>
									<DropdownMenu.Item class="cursor-pointer" onclick={handleLogout}
										><LogOut />Sign Out</DropdownMenu.Item
									>
								</DropdownMenu.Group>
							</DropdownMenu.Content>
						</DropdownMenu.Root>
					{:else}
						<a href="/login" class="btn btn-sm btn-primary rounded-full capitalize">log in</a>
					{/if}
				</div>
				<button
					onclick={toggleMobileMenu}
					class="flex h-9 w-9 items-center justify-center md:hidden"
				>
					<Fa icon={mobileMenuOpen ? faTimes : faBars} class="cursor-pointer text-2xl" />
				</button>
			</div>
		</div>
	</div>
</header>

<!-- Mobile Menu -->
{#if mobileMenuOpen}
	<div
		id="mobile-menu"
		class="fixed inset-x-0 top-[57px] bottom-0 z-50 overflow-y-auto bg-neutral-900 md:hidden"
	>
		<div class="flex flex-col">
			<a
				href="/explore"
				onclick={closeMobileMenu}
				class="border-t border-b border-neutral-700 p-4 capitalize hover:bg-neutral-800">explore</a
			>
			<a
				href="/collections"
				onclick={closeMobileMenu}
				class="border-b border-neutral-700 p-4 capitalize hover:bg-neutral-800">collections</a
			>
			<a
				href="/leaderboard"
				onclick={closeMobileMenu}
				class="border-b border-neutral-700 p-4 capitalize hover:bg-neutral-800">leaderboard</a
			>
			<a
				href="/downloads"
				onclick={closeMobileMenu}
				class="border-b border-neutral-700 p-4 capitalize hover:bg-neutral-800">downloads</a
			>
			<div class="px-4 py-8">
				{#if $user}
					<button
						onclick={handleLogout}
						class="w-full cursor-pointer rounded-full bg-red-500 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600"
					>
						Sign Out
					</button>
				{:else}
					<a href="/login" class="btn btn-sm btn-primary rounded-full capitalize">log in</a>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.site-logo {
		font-family: 'Rubik Variable', sans-serif;
	}
</style>
