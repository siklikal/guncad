<script lang="ts">
	import Fa from 'svelte-fa';
	import { faBars, faTimes } from '@fortawesome/free-solid-svg-icons';
	import { browser } from '$app/environment';

	let mobileMenuOpen = $state(false);

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

<header class="w-full bg-black">
	<div class="mx-auto max-w-[1920px] px-4 py-3 md:px-8">
		<div class="flex items-center justify-between gap-4">
			<div class="flex items-center gap-6">
				<a href="/" class="site-logo text-xl font-bold text-white uppercase">Guncad</a>
				<a href="/explore" class="hidden link-primary capitalize md:flex">explore</a>
				<a href="/collections" class="hidden link-primary capitalize md:flex">collections</a>
				<a href="/leaderboard" class="hidden link-primary capitalize md:flex">leaderboard</a>
				<a href="/downloads" class="hidden link-primary capitalize md:flex">downloads</a>
			</div>
			<div class="flex flex-1 items-center justify-end gap-4">
				<input
					type="text"
					placeholder="Search..."
					class="input input-sm w-full rounded-full md:flex lg:w-[340px] xl:w-[400px]"
				/>
				<button class="btn rounded-full capitalize btn-sm btn-primary">log in</button>
				<button
					onclick={toggleMobileMenu}
					class="flex h-9 w-9 items-center justify-center md:hidden"
				>
					<Fa icon={mobileMenuOpen ? faTimes : faBars} class="cursor-pointer text-xl" />
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
		</div>
	</div>
{/if}

<style>
	.site-logo {
		font-family: 'Rubik Variable', sans-serif;
	}
</style>
