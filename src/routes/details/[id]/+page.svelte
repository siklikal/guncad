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
		faDownload,
		faCopy,
		faCalendar,
		faFile
	} from '@fortawesome/free-solid-svg-icons';
	import { Check } from 'lucide-svelte';
	import { getTagColorClass } from '$lib/utils/tagColors';
	import { Button } from '$lib/components/ui/button/index.js';
	import SubscriptionModal from '$lib/components/SubscriptionModal.svelte';
	import { toast } from 'svelte-sonner';
	import { supabase } from '$lib/supabase';
	import { onMount } from 'svelte';

	let { data }: { data: PageData } = $props();

	let downloading = $state(false);
	let debugDownloading = $state(false);
	let downloadError = $state('');
	let showSubscriptionModal = $state(false);
	let showSuccessAnimation = $state(false);
	let geoChecking = $state(false);
	let isBookmarked = $state(false);
	let bookmarkLoading = $state(false);
	let project = $state<any>(null);
	let hasPurchased = $state(false);
	let isLiked = $state(false);
	let likeLoading = $state(false);
	let statsLoaded = $state(false);
	let projectStats = $state<{ views: number; likes: number; bookmarks: number; downloads: number }>(
		{
			views: 0,
			likes: 0,
			bookmarks: 0,
			downloads: 0
		}
	);

	// Unwrap streaming promises when they resolve
	$effect(() => {
		Promise.all([data.project, data.hasPurchased]).then(([p, purchased]) => {
			project = p;
			hasPurchased = purchased;
			if (p) {
				checkBookmarkStatus();
				fetchProjectStats();
				trackView();
			}
		});
	});

	// Subscribe to realtime updates for project_stats
	onMount(() => {
		const channel = supabase
			.channel('project-stats-realtime')
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'project_stats',
					filter: `project_id=eq.${data.projectId}`
				},
				() => {
					// Re-fetch stats when the row changes
					fetchProjectStats();
				}
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	});

	// Track view when project loads
	async function trackView() {
		if (!project) return;
		try {
			const response = await fetch('/api/project-stats/track-view', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					projectId: project.id,
					baseViews: project.views || 0,
					baseLikes: project.likes || 0
				})
			});

			if (response.ok) {
				const result = await response.json();
				if (result.stats) {
					projectStats = { ...projectStats, ...result.stats };
				}
			}
		} catch (error) {
			console.error('Failed to track view:', error);
		}
	}

	// Fetch project stats and like status
	async function fetchProjectStats() {
		if (!project) return;
		try {
			const response = await fetch(`/api/project-stats/${project.id}`);
			if (response.ok) {
				const result = await response.json();
				if (result.stats) {
					projectStats = { ...projectStats, ...result.stats };
				}
				isLiked = result.isLiked || false;
				statsLoaded = true;
			}
		} catch (error) {
			console.error('Failed to fetch project stats:', error);
			statsLoaded = true;
		}
	}

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
				projectStats.bookmarks += result.bookmarked ? 1 : -1;
			}
		} catch (error) {
			console.error('Failed to toggle bookmark:', error);
		} finally {
			bookmarkLoading = false;
		}
	}

	async function toggleLike() {
		if (!project || likeLoading) return;

		likeLoading = true;
		try {
			const response = await fetch('/api/project-stats/toggle-like', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ projectId: project.id })
			});

			if (response.status === 401) {
				return;
			}

			if (response.ok) {
				const result = await response.json();
				isLiked = result.isLiked;
				if (result.likes !== undefined) {
					projectStats.likes = result.likes;
				} else if (result.stats) {
					projectStats = { ...projectStats, ...result.stats };
				}
			}
		} catch (error) {
			console.error('Failed to toggle like:', error);
		} finally {
			likeLoading = false;
		}
	}

	function formatNumber(num: number): string {
		return num >= 1000 ? `${(num / 1000).toFixed(1)}k` : num.toString();
	}

	function formatFileSize(bytes: number): string {
		if (!bytes || bytes === 0) return 'N/A';
		if (bytes >= 1073741824) return `${Math.round(bytes / 1073741824)} GB`;
		if (bytes >= 1048576) return `${Math.round(bytes / 1048576)} MB`;
		return `${Math.round(bytes / 1024)} KB`;
	}

	function formatReleaseDate(dateString: string | null): string {
		if (!dateString) return 'N/A';
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
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

			// User can download (has entitlement)
			if (entitlementResponse.ok && entitlementData.canDownload) {
				await performDownload();
			} else {
				// User needs to purchase (either not authenticated or no entitlement), check geo first
				downloading = false;
				geoChecking = true;
				try {
					const geoResponse = await fetch('/api/geo-check');
					const geoResult = await geoResponse.json();
					if (!geoResult.allowed) {
						toast.error(geoResult.reason || 'Purchases are not available in your region.');
						return;
					}
					showSubscriptionModal = true;
				} catch (error) {
					console.error('Geo check failed:', error);
					toast.error('Unable to verify your location. Please try again later.');
				} finally {
					geoChecking = false;
				}
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

			// Track download in project stats
			try {
				await fetch('/api/project-stats/track-download', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ projectId: project.id })
				});
				// Refresh stats after download
				fetchProjectStats();
			} catch (error) {
				console.error('Failed to track download:', error);
			}
		} catch (error) {
			downloadError = error instanceof Error ? error.message : 'Failed to download file';
			console.error('Download error:', error);
		} finally {
			downloading = false;
		}
	}

	let badgeConfig = $derived(project?.badge ? getBadgeConfig(project.badge) : null);

	// Handle successful payment - auto-start download
	async function handleSubscriptionSuccess() {
		showSubscriptionModal = false;
		hasPurchased = true;

		// Start download immediately (no setTimeout — browser blocks programmatic
		// downloads that aren't in a user gesture context)
		downloading = true;
		downloadError = '';
		try {
			await performDownload();
		} catch (error) {
			downloadError = error instanceof Error ? error.message : 'Failed to start download';
		}
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

	// Handle copy URL to clipboard
	async function handleCopyUrl() {
		if (!project) return;

		try {
			const url = window.location.href;
			await navigator.clipboard.writeText(url);
			toast.success('Link copied to clipboard!');
		} catch (error) {
			console.error('Failed to copy URL:', error);
			toast.error('Failed to copy link');
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
				<!-- Title + user -->
				<div>
					<div class="mb-4 h-10 w-3/4 animate-pulse rounded bg-neutral-800"></div>
					<div class="flex items-center gap-1.5">
						<div class="h-8 w-8 shrink-0 animate-pulse rounded-full bg-neutral-800"></div>
						<div class="h-4 w-24 animate-pulse rounded bg-neutral-800"></div>
					</div>
				</div>
				<!-- Stats bar (6 cells matching real grid) -->
				<div class="grid w-full grid-cols-3 overflow-hidden rounded-lg border border-neutral-700 2xl:flex 2xl:w-auto">
					{#each Array(6) as _}
						<div class="flex flex-1 items-center justify-center gap-2 border-r border-neutral-700 bg-neutral-800 p-2 last:border-r-0">
							<div class="h-3 w-3 animate-pulse rounded bg-neutral-700"></div>
							<div class="h-3 w-10 animate-pulse rounded bg-neutral-700"></div>
						</div>
					{/each}
				</div>
				<!-- Action buttons -->
				<div class="grid w-full grid-cols-2 gap-2 xl:grid-cols-4">
					<div class="h-10 animate-pulse rounded bg-neutral-800"></div>
					<div class="h-10 animate-pulse rounded bg-neutral-800"></div>
					<div class="h-10 animate-pulse rounded bg-neutral-800"></div>
					<div class="h-10 animate-pulse rounded bg-neutral-800"></div>
				</div>
				<!-- Description -->
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
							href="/channel/{loadedProject.user.handle ? loadedProject.user.handle.replace('@', '') : loadedProject.user.username}"
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

					<!-- {#if loadedProject.tags && loadedProject.tags.length > 0}
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
					{/if} -->

					<div class="grid w-full grid-cols-3 overflow-hidden rounded-lg border border-neutral-400 2xl:flex 2xl:w-auto">
						<div
							class="flex flex-1 items-center justify-center gap-2 border-r border-neutral-400 bg-neutral-800 p-2"
						>
							<Fa icon={faCalendar} class="text-sm text-neutral-400" />
							<p class="text-xs font-semibold">
								{formatReleaseDate(loadedProject.released)}
							</p>
						</div>
						<div
							class="flex flex-1 items-center justify-center gap-2 border-r border-neutral-400 bg-neutral-800 p-2"
						>
							<Fa icon={faEye} class="text-sm text-neutral-400" />
							<p class="text-xs font-semibold">
								{#if statsLoaded}
									{formatNumber(projectStats.views || loadedProject.views)}
								{:else}
									<span class="inline-block h-3 w-7 align-middle animate-pulse rounded-sm bg-neutral-600"></span>
								{/if}
							</p>
						</div>
						<div
							class="flex flex-1 items-center justify-center gap-2 bg-neutral-800 p-2 2xl:border-r 2xl:border-neutral-400"
						>
							<Fa icon={faHeart} class="text-sm text-neutral-400" />
							<p class="text-xs font-semibold">
								{#if statsLoaded}
									{formatNumber(projectStats.likes || loadedProject.likes)}
								{:else}
									<span class="inline-block h-3 w-6 align-middle animate-pulse rounded-sm bg-neutral-600"></span>
								{/if}
							</p>
						</div>
						<div
							class="flex flex-1 items-center justify-center gap-2 border-r border-t border-neutral-400 bg-neutral-800 p-2 2xl:border-t-0"
						>
							<Fa icon={faBookmark} class="text-sm text-neutral-400" />
							<p class="text-xs font-semibold">
								{#if statsLoaded}
									{formatNumber(projectStats.bookmarks)}
								{:else}
									<span class="inline-block h-3 w-5 align-middle animate-pulse rounded-sm bg-neutral-600"></span>
								{/if}
							</p>
						</div>
						<div
							class="flex flex-1 items-center justify-center gap-2 border-r border-t border-neutral-400 bg-neutral-800 p-2 2xl:border-t-0"
						>
							<Fa icon={faDownload} class="text-sm text-neutral-400" />
							<p class="text-xs font-semibold">
								{#if statsLoaded}
									{formatNumber(projectStats.downloads)}
								{:else}
									<span class="inline-block h-3 w-5 align-middle animate-pulse rounded-sm bg-neutral-600"></span>
								{/if}
							</p>
						</div>
						<div
							class="flex flex-1 items-center justify-center gap-2 border-t border-neutral-400 bg-neutral-800 p-2 2xl:border-t-0"
						>
							<Fa icon={faFile} class="text-sm text-neutral-400" />
							<p class="text-xs font-semibold">{formatFileSize(loadedProject.source?.size)}</p>
						</div>
					</div>

					<div class="grid w-full grid-cols-2 gap-2 xl:flex xl:w-auto">
						<Button size="lg" class="flex-1" onclick={handleCopyUrl}>
							{#snippet children()}
								<Fa icon={faCopy} class="text-sm" />
								Copy Link
							{/snippet}
						</Button>
						<Button size="lg" class="flex-1" onclick={toggleBookmark} disabled={bookmarkLoading}>
							{#snippet children()}
								<span class="inline-block w-4">
									{#if bookmarkLoading}
										<div
											class="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent"
										></div>
									{:else}
										<Fa icon={faBookmark} class="text-sm {isBookmarked ? 'text-red-500' : ''}" />
									{/if}
								</span>
								Bookmark
							{/snippet}
						</Button>
						<Button size="lg" class="flex-1" onclick={toggleLike} disabled={likeLoading}>
							{#snippet children()}
								<span class="inline-block w-4">
									{#if likeLoading}
										<div
											class="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent"
										></div>
									{:else}
										<Fa icon={faHeart} class="text-sm {isLiked ? 'text-red-500' : ''}" />
									{/if}
								</span>
								Like
							{/snippet}
						</Button>

						<Button size="lg" class="flex-1" onclick={handleDownload} disabled={downloading || geoChecking}>
							{#snippet children()}
								<span class="inline-block w-4">
									{#if downloading || geoChecking}
										<div class="spinner"></div>
									{:else}
										<Fa icon={faDownload} class="text-sm" />
									{/if}
								</span>
								{#if downloading}
									Downloading...
								{:else if geoChecking}
									Checking...
								{:else}
									Download
								{/if}
							{/snippet}
						</Button>

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

					<div class="flex hidden flex-col items-center justify-between gap-5 2xl:flex-row">
						<div class="grid w-full grid-cols-2 overflow-hidden rounded-lg border border-neutral-400 xl:flex xl:w-auto">
							<div
								class="flex flex-1 items-center justify-center gap-1 rounded-tl-lg rounded-bl-lg border-r border-neutral-400 bg-neutral-800 p-3"
							>
								<Fa icon={faEye} class="text-sm text-neutral-400" />
								<p class="text-sm font-semibold">
									{#if statsLoaded}
										{formatNumber(projectStats.views || loadedProject.views)}
									{:else}
										<span class="inline-block h-3.5 w-8 animate-pulse rounded-sm bg-neutral-600"></span>
									{/if}
								</p>
							</div>
							<div
								class="flex flex-1 items-center justify-center gap-1 border-r border-neutral-400 bg-neutral-800 p-3"
							>
								<Fa icon={faHeart} class="text-sm text-neutral-400" />
								<p class="text-sm font-semibold">
									{#if statsLoaded}
										{formatNumber(projectStats.likes || loadedProject.likes)}
									{:else}
										<span class="inline-block h-3.5 w-7 animate-pulse rounded-sm bg-neutral-600"></span>
									{/if}
								</p>
							</div>
							<div
								class="flex flex-1 items-center justify-center gap-1 border-r border-neutral-400 bg-neutral-800 p-3"
							>
								<Fa icon={faBookmark} class="text-sm text-neutral-400" />
								<p class="text-sm font-semibold">
									{#if statsLoaded}
										{formatNumber(projectStats.bookmarks)}
									{:else}
										<span class="inline-block h-3.5 w-6 animate-pulse rounded-sm bg-neutral-600"></span>
									{/if}
								</p>
							</div>
							<div
								class="flex flex-1 items-center justify-center gap-1 border-r border-neutral-400 bg-neutral-800 p-3"
							>
								<Fa icon={faDownload} class="text-sm text-neutral-400" />
								<p class="text-sm font-semibold">
									{#if statsLoaded}
										{formatNumber(projectStats.downloads)}
									{:else}
										<span class="inline-block h-3.5 w-6 animate-pulse rounded-sm bg-neutral-600"></span>
									{/if}
								</p>
							</div>
							<div
								class="flex flex-1 items-center justify-center gap-1 rounded-tr-lg rounded-br-lg bg-neutral-800 p-3"
							>
								<Fa icon={faFile} class="text-sm text-neutral-400" />
								<p class="text-sm font-semibold">{formatFileSize(loadedProject.source?.size)}</p>
							</div>
						</div>

						<div class="grid w-full grid-cols-2 gap-2 xl:flex xl:w-auto">
							<Button size="lg" class="flex-1 xl:flex-none" onclick={handleCopyUrl}>
								{#snippet children()}
									<Fa icon={faCopy} class="text-sm" />
									Copy Link
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
											<div
												class="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent"
											></div>
										{:else}
											<Fa icon={faBookmark} class="text-sm {isBookmarked ? 'text-red-500' : ''}" />
										{/if}
									</span>
									Bookmark
								{/snippet}
							</Button>
							<Button
								size="lg"
								class="flex-1 xl:flex-none"
								onclick={toggleLike}
								disabled={likeLoading}
							>
								{#snippet children()}
									<span class="inline-block w-4">
										{#if likeLoading}
											<div
												class="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent"
											></div>
										{:else}
											<Fa icon={faHeart} class="text-sm {isLiked ? 'text-red-500' : ''}" />
										{/if}
									</span>
									Like
								{/snippet}
							</Button>

							<Button size="lg" class="flex-1 xl:flex-none" onclick={handleDownload} disabled={downloading || geoChecking}>
								{#snippet children()}
									<span class="inline-block w-4">
										{#if downloading || geoChecking}
											<div class="spinner"></div>
										{:else}
											<Fa icon={faDownload} class="text-sm" />
										{/if}
									</span>
									{#if downloading}
										Downloading...
									{:else if geoChecking}
										Checking...
									{:else}
										Download
									{/if}
								{/snippet}
							</Button>

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
			<p class="text-neutral-300">Your download will start automatically...</p>
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
