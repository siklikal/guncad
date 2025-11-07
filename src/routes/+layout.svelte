<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import { initAuth } from '$lib/stores/auth';

	let { children } = $props();

	// Initialize auth when app starts
	onMount(() => {
		return initAuth();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
