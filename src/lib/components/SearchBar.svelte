<script lang="ts">
	import { goto } from '$app/navigation';
	import { Input } from '$lib/components/ui/input/index.js';

	let searchQuery = $state('');

	function handleSearch(e: Event) {
		e.preventDefault();
		const query = searchQuery.trim();
		if (query) {
			goto(`/explore?search=${encodeURIComponent(query)}`);
			searchQuery = '';
		} else {
			goto('/explore');
		}
	}
</script>

<form onsubmit={handleSearch} class="w-full md:flex lg:w-[340px] xl:w-[400px]">
	<Input type="text" bind:value={searchQuery} placeholder="Search..." class="w-full" />
</form>
