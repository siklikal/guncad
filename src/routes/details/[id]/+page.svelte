<script lang="ts">
	import type { PageData } from './$types';
	import Fa from 'svelte-fa';
	import {
		faEye,
		faHeart,
		faGem,
		faStar,
		faFire,
		faBookmark,
		faShare,
		faDownload,
		faShoppingCart
	} from '@fortawesome/free-solid-svg-icons';
	import { Check } from 'lucide-svelte';
	import { getTagColorClass } from '$lib/utils/tagColors';
	import { Button } from '$lib/components/ui/button/index.js';
	import SubscriptionModal from '$lib/components/SubscriptionModal.svelte';

	let { data }: { data: PageData } = $props();

	let downloading = $state(false);
	let debugDownloading = $state(false);
	let downloadError = $state('');
	let showSubscriptionModal = $state(false);
	let showSuccessAnimation = $state(false);
	let isBookmarked = $state(false);
	let bookmarkLoading = $state(false);
	let project = $state<any>(null);
	let hasPurchased = $state(false);

	// Unwrap streaming promises when they resolve
	$effect(() => {
		Promise.all([data.project, data.hasPurchased]).then(([p, purchased]) => {
			project = p;
			hasPurchased = purchased;
			if (p) {
				checkBookmarkStatus();
			}
		});
	});

	async function checkBookmarkStatus() {
		if (!project) return;
		try {
			const response = await fetch('/api/bookmarks/check', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ modelId: project.id })
			});

			if (response.ok) {
				const result = await response.json();
				isBookmarked = result.bookmarked;
			}
		} catch (error) {
			console.error('Failed to check bookmark status:', error);
		}
	}

	async function toggleBookmark() {
		if (!project || bookmarkLoading) return;

		bookmarkLoading = true;
		try {
			const response = await fetch('/api/bookmarks/toggle', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ modelId: project.id })
			});

			if (response.ok) {
				const result = await response.json();
				isBookmarked = result.bookmarked;
			}
		} catch (error) {
			console.error('Failed to toggle bookmark:', error);
		} finally {
			bookmarkLoading = false;
		}
	}

	function formatNumber(num: number): string {
		return num >= 1000 ? `${(num / 1000).toFixed(1)}k` : num.toString();
	}

	function getBadgeConfig(type: string | null) {
		switch (type) {
			case 'exclusive':
				return { icon: faGem, color: 'text-blue-600', label: 'Exclusive' };
			case 'featured':
				return { icon: faStar, color: 'text-green-600', label: 'Featured' };
			case 'trending':
				return { icon: faFire, color: 'text-red-600', label: 'Trending' };
			default:
				return null;
		}
	}

	/**
	 * Check if user has entitlement to download
	 *
	 * Flow:
	 * 1. Check if user has active subscription or purchased this model
	 * 2. If yes, proceed to download
	 * 3. If no, show subscription modal
	 */
	async function handleDownload() {
		if (!project || downloading) return;

		downloading = true;
		downloadError = '';

		try {
			// Check entitlement first
			const entitlementResponse = await fetch('/api/subscription/check-entitlement', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					modelId: project.id
				})
			});

			const entitlementData = await entitlementResponse.json();

			// User is not authenticated
			if (entitlementResponse.status === 401) {
				downloadError = 'Please sign in to download models';
				downloading = false;
				return;
			}

			// User can download
			if (entitlementData.canDownload) {
				await performDownload();
			} else {
				// User needs subscription
				downloading = false;
				showSubscriptionModal = true;
			}
		} catch (error) {
			downloadError = error instanceof Error ? error.message : 'Failed to check download access';
			console.error('Entitlement check error:', error);
			downloading = false;
		}
	}

	/**
	 * Handle LBRY file download
	 *
	 * This function downloads files from LBRY by proxying through our SvelteKit server.
	 *
	 * Flow:
	 * 1. Call /api/lbry-download with the LBRY URI and desired filename
	 * 2. Server fetches from LBRY streaming server (maintaining persistent connection)
	 * 3. Server streams the file back to browser
	 * 4. Browser receives as blob and triggers download via temporary <a> element
	 *
	 * Why not direct download from LBRY?
	 * - LBRY streaming port (5280) is not publicly accessible
	 * - Direct browser access causes "inactive download" errors
	 * - SvelteKit server acts as proxy to maintain connection
	 *
	 * Note: Does NOT open new tab, downloads directly to user's download folder
	 */
	async function performDownload() {
		if (!project) return;

		try {
			// Request the file from our SvelteKit download endpoint
			// The server will handle the LBRY streaming and proxy it back to us
			const response = await fetch('/api/lbry-download', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					uri: project.canonicalUrl,
					fileName: project.source?.name || `${project.id}.zip`
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to download file');
			}

			// Extract filename from Content-Disposition header if available
			const contentDisposition = response.headers.get('Content-Disposition');
			const fileNameMatch = contentDisposition?.match(/filename="(.+)"/);
			const fileName = fileNameMatch
				? fileNameMatch[1]
				: project.source?.name || `${project.id}.zip`;

			// Convert response to blob and trigger browser download
			// Using blob URL prevents opening new tab and downloads file directly
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = fileName;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url); // Clean up blob URL

			// TODO: Record download in downloads table
		} catch (error) {
			downloadError = error instanceof Error ? error.message : 'Failed to download file';
			console.error('Download error:', error);
		} finally {
			downloading = false;
		}
	}

	let badgeConfig = $derived(project?.badge ? getBadgeConfig(project.badge) : null);

	// Handle buy button click - immediately show modal
	function handleBuyClick() {
		showSubscriptionModal = true;
	}

	// Handle successful payment
	async function handleSubscriptionSuccess() {
		showSubscriptionModal = false;

		// Show success animation
		showSuccessAnimation = true;
		setTimeout(() => {
			showSuccessAnimation = false;
			hasPurchased = true;
		}, 2000);
	}

	// Handle debug download button (separate from buy button)
	async function handleDebugDownload() {
		if (!project || debugDownloading) return;
		debugDownloading = true;
		downloadError = '';

		try {
			await performDownload();
		} finally {
			debugDownloading = false;
		}
	}
</script>

<div class="container mx-auto">
	{#await data.project}
		<!-- Loading skeleton -->
		<div class="grid gap-8 lg:grid-cols-2">
			<div class="relative">
				<div class="animate-pulse rounded-lg bg-neutral-800" style="aspect-ratio: 16 / 9;"></div>
			</div>
			<div class="flex flex-col gap-6">
				<div>
					<div class="mb-4 h-10 w-3/4 animate-pulse rounded bg-neutral-800"></div>
					<div class="h-8 w-32 animate-pulse rounded-full bg-neutral-800"></div>
				</div>
				<div class="flex flex-wrap gap-2">
					<div class="h-8 w-20 animate-pulse rounded-full bg-neutral-800"></div>
					<div class="h-8 w-24 animate-pulse rounded-full bg-neutral-800"></div>
					<div class="h-8 w-16 animate-pulse rounded-full bg-neutral-800"></div>
				</div>
				<div class="flex gap-2">
					<div class="h-12 flex-1 animate-pulse rounded bg-neutral-800"></div>
					<div class="h-12 flex-1 animate-pulse rounded bg-neutral-800"></div>
				</div>
				<div class="h-48 animate-pulse rounded-lg bg-neutral-800"></div>
			</div>
		</div>
	{:then loadedProject}
		{#if !loadedProject}
			<div class="alert alert-error">
				<span>Project not found</span>
			</div>
		{:else}
		<div class="grid gap-8 lg:grid-cols-2">
			<!-- Project Image -->
			<div class="relative">
				<div
					class="rounded-lg bg-cover bg-center"
					style="background-image: url('{loadedProject.image}'); aspect-ratio: 16 / 9;"
				>
					{#if badgeConfig}
						<div class="flex justify-end">
							<div class="flex items-center gap-2 rounded-tr-lg rounded-bl-lg bg-black px-4 py-2">
								<Fa icon={badgeConfig.icon} class={`text-lg ${badgeConfig.color}`} />
								<span class="text-sm font-semibold text-white">{badgeConfig.label}</span>
							</div>
						</div>
					{/if}
				</div>
			</div>

			<!-- Project Details -->
			<div class="flex flex-col gap-6">
				<div>
					<h1 class="mb-4 text-3xl font-bold md:text-4xl">{loadedProject.title}</h1>

					<!-- User Info -->
					<a
						href="/user/{loadedProject.user.username}"
						class="group/user inline-flex items-center gap-1.5"
					>
						<div
							class="h-8 w-8 shrink-0 rounded-full bg-cover bg-center"
							style="background-image: url('{loadedProject.user.avatar &&
							loadedProject.user.avatar !==
								'https://guncadindex.com/static/images/default-avatar.png'
								? loadedProject.user.avatar
								: '/images/default-avatar.avif'}');"
						></div>
						<div>
							<p class="text-sm font-semibold group-hover/user:text-blue-600">
								{loadedProject.user.username}
							</p>
						</div>
					</a>
				</div>

				{#if loadedProject.tags && loadedProject.tags.length > 0}
					<div class="flex flex-wrap gap-2">
						{#each loadedProject.tags as tag}
							<a
								href="/tag/{tag.toLowerCase()}"
								class="shrink-0 rounded-full border bg-black px-3 py-2 text-xs whitespace-nowrap {getTagColorClass(
									tag.toLowerCase()
								)}"
							>
								{tag}
							</a>
						{/each}
					</div>
				{/if}

				<div class="flex flex-col items-center gap-5 xl:flex-row">
					<!-- <div class="flex w-full justify-between rounded-lg border border-neutral-400 xl:w-auto">
						<div
							class="flex flex-1 items-center justify-center gap-1 rounded-tl-lg rounded-bl-lg border-r border-neutral-400 bg-neutral-800 p-3"
						>
							<Fa icon={faEye} class="text-sm text-neutral-400" />
							<p class="text-sm font-semibold">{formatNumber(loadedProject.views)}</p>
						</div>
						<div
							class="flex flex-1 items-center justify-center gap-1 border-r border-neutral-400 bg-neutral-800 p-3"
						>
							<Fa icon={faHeart} class="text-sm text-neutral-400" />
							<p class="text-sm font-semibold">{formatNumber(loadedProject.likes)}</p>
						</div>
						<div
							class="flex flex-1 items-center justify-center gap-1 border-r border-neutral-400 bg-neutral-800 p-3"
						>
							<Fa icon={faBookmark} class="text-sm text-neutral-400" />
							<p class="text-sm font-semibold">{formatNumber(loadedProject.likes)}</p>
						</div>
						<div
							class="flex flex-1 items-center justify-center gap-1 rounded-tr-lg rounded-br-lg bg-neutral-800 p-3"
						>
							<Fa icon={faDownload} class="text-sm text-neutral-400" />
							<p class="text-sm font-semibold">{formatNumber(loadedProject.likes)}</p>
						</div>
					</div> -->
					<div class="flex w-full gap-2 xl:w-auto">
						<Button size="lg" class="flex-1 xl:flex-none">
							{#snippet children()}
								<Fa icon={faShare} class="text-sm" />
								Share
							{/snippet}
						</Button>
						<Button
							size="lg"
							class="flex-1 xl:flex-none"
							onclick={toggleBookmark}
							disabled={bookmarkLoading}
						>
							{#snippet children()}
								<span class="inline-block w-4">
									{#if bookmarkLoading}
										<div class="spinner"></div>
									{:else}
										<Fa icon={faBookmark} class="text-sm {isBookmarked ? 'text-red-500' : ''}" />
									{/if}
								</span>
								Bookmark
							{/snippet}
						</Button>

						{#if hasPurchased}
							<!-- Download button (shown after purchase) -->
							<Button
								size="lg"
								class="flex-1 xl:flex-none"
								onclick={handleDownload}
								disabled={downloading}
							>
								{#snippet children()}
									<span class="inline-block w-4">
										{#if downloading}
											<div class="spinner"></div>
										{:else}
											<Fa icon={faDownload} class="text-sm" />
										{/if}
									</span>
									Download
								{/snippet}
							</Button>
						{:else}
							<!-- Buy button (shown before purchase) -->
							<Button size="lg" class="flex-1 xl:flex-none" onclick={handleBuyClick}>
								{#snippet children()}
									<Fa icon={faShoppingCart} class="text-sm" />
									Buy
								{/snippet}
							</Button>
						{/if}

						<!-- Debug download button -->
						<!-- <Button
							size="lg"
							class="hidden flex-1 md:flex xl:flex-none"
							onclick={handleDebugDownload}
							disabled={debugDownloading}
						>
							{#snippet children()}
								<span class="inline-block w-4">
									{#if debugDownloading}
										<div class="spinner"></div>
									{:else}
										<Fa icon={faDownload} class="text-sm" />
									{/if}
								</span>
								Debug DL
							{/snippet}
						</Button> -->
					</div>
				</div>

				{#if downloadError}
					<div class="alert alert-error">
						<span>{downloadError}</span>
					</div>
				{/if}

				<div>
					<p
						class="wrap-brea-words rounded-lg bg-black p-6 text-sm leading-relaxed whitespace-pre-wrap"
					>
						{loadedProject.description || 'No description available'}
					</p>
				</div>
			</div>
		</div>
		{/if}
	{/await}
</div>

<!-- Success Animation Overlay -->
{#if showSuccessAnimation}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
		role="dialog"
		aria-modal="true"
	>
		<div class="flex animate-in flex-col items-center gap-4 duration-300 zoom-in-95">
			<div class="flex h-24 w-24 items-center justify-center rounded-full bg-green-500">
				<Check class="h-12 w-12 animate-in text-white delay-150 zoom-in-95" />
			</div>
			<h2 class="text-2xl font-bold text-white">Payment Successful!</h2>
			<p class="text-neutral-300">You can now download this model</p>
		</div>
	</div>
{/if}

<!-- Subscription Modal -->
{#if project}
	<SubscriptionModal
		bind:isOpen={showSubscriptionModal}
		modelId={project.id}
		modelTitle={project.title}
		onSuccess={handleSubscriptionSuccess}
	/>
{/if}

<style>
	.spinner {
		border: 2px solid rgba(0, 0, 0, 0.1);
		border-top-color: black;
		border-radius: 50%;
		width: 16px;
		height: 16px;
		animation: spin 0.6s linear infinite;
		display: inline-block;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
