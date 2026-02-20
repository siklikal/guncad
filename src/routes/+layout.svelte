<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import { initAuth } from '$lib/stores/auth';
	import Header from '$lib/components/header.svelte';
	import Footer from '$lib/components/footer.svelte';
	import { page } from '$app/state';
	import { browser } from '$app/environment';
	import { Toaster } from 'svelte-sonner';
	import { env } from '$env/dynamic/public';

	let { children } = $props();

	// Initialize auth when app starts
	onMount(() => {
		return initAuth();
	});

	// Check if we're on an auth page (no header/padding needed)
	const authPages = ['/login', '/signup', '/forgot-password'];
	let isAuthPage = $derived(browser && authPages.includes(page.url.pathname));
	let showHeader = $derived(browser && !isAuthPage);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<!-- Authorize.Net Accept.js SDK for secure payment tokenization -->
	<script src={env.PUBLIC_ADN_ACCEPT_JS_URL} charset="utf-8"></script>
</svelte:head>

<div class="flex min-h-screen flex-col">
	{#if showHeader}
		<Header />
		<div class="flex-1 p-4 md:py-8">
			{@render children()}
		</div>
		<Footer />
	{:else}
		{@render children()}
	{/if}
</div>

<Toaster richColors />
