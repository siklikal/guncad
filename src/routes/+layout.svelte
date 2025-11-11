<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import { initAuth } from '$lib/stores/auth';
	import Header from '$lib/components/header.svelte';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';

	let { children } = $props();

	// Initialize auth when app starts
	onMount(() => {
		return initAuth();
	});

	// Check if we're on an auth page (no header/padding needed)
	const authPages = ['/login', '/signup', '/forgot-password'];
	let isAuthPage = $derived(browser && authPages.includes($page.url.pathname));
	let showHeader = $derived(browser && !isAuthPage);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if showHeader}
	<Header />
	<div class="py-8">
		{@render children()}
	</div>
{:else}
	{@render children()}
{/if}
