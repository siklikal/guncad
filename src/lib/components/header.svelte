<script lang="ts">
	import Fa from 'svelte-fa';
	import { faBars } from '@fortawesome/free-solid-svg-icons';
</script>

<header class="w-full bg-black">
	<div class="mx-auto max-w-[1920px] px-4 py-3 md:px-8">
		<div class="flex items-center justify-between gap-4">
			<div class="flex items-center gap-6">
				<h1 class="site-logo text-xl font-bold text-white uppercase">Guncad</h1>
				<a href="/explore" class="hidden link-primary capitalize md:flex">explore</a>
				<a href="/explore" class="hidden link-primary capitalize md:flex">collections</a>
				<a href="/explore" class="hidden link-primary capitalize md:flex">leaderboard</a>
				<a href="/downloads" class="hidden link-primary capitalize md:flex">downloads</a>
			</div>
			<div class="flex flex-1 items-center justify-end gap-4">
				<input
					type="text"
					placeholder="Search..."
					class="input input-sm w-full rounded-full md:flex lg:w-[340px] xl:w-[400px]"
				/>
				<button class="btn rounded-full capitalize btn-sm btn-primary">log in</button>
				<Fa icon={faBars} id="menu-button" class="text-xl md:hidden" />
			</div>
		</div>
	</div>
</header>

<style>
	.site-logo {
		font-family: 'Rubik Variable', sans-serif;
	}
</style>
