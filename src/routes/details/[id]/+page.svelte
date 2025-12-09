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
		faDownload
	} from '@fortawesome/free-solid-svg-icons';
	import { getTagColorClass } from '$lib/utils/tagColors';

	let { data }: { data: PageData } = $props();

	let downloading = $state(false);
	let downloadError = $state('');

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
	async function handleDownload() {
		if (!data.project || downloading) return;

		downloading = true;
		downloadError = '';

		try {
			// Request the file from our SvelteKit download endpoint
			// The server will handle the LBRY streaming and proxy it back to us
			const response = await fetch('/api/lbry-download', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					uri: data.project.canonicalUrl,
					fileName: data.project.source?.name || `${data.project.id}.zip`
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to download file');
			}

			// Extract filename from Content-Disposition header if available
			const contentDisposition = response.headers.get('Content-Disposition');
			const fileNameMatch = contentDisposition?.match(/filename="(.+)"/);
			const fileName = fileNameMatch ? fileNameMatch[1] : data.project.source?.name || `${data.project.id}.zip`;

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
		} catch (error) {
			downloadError = error instanceof Error ? error.message : 'Failed to download file';
			console.error('Download error:', error);
		} finally {
			downloading = false;
		}
	}

	const badgeConfig = data.project?.badge ? getBadgeConfig(data.project.badge) : null;
</script>

<div class="container mx-auto">
	{#if data.error}
		<div class="alert alert-error">
			<span>{data.error}</span>
		</div>
	{:else if data.project}
		<div class="grid gap-8 lg:grid-cols-2">
			<!-- Project Image -->
			<div class="relative">
				<div
					class="rounded-lg bg-cover bg-center"
					style="background-image: url('{data.project.image}'); aspect-ratio: 16 / 9;"
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
					<h1 class="mb-4 text-3xl font-bold md:text-4xl">{data.project.title}</h1>

					<!-- User Info -->
					<a
						href="/user/{data.project.user.username}"
						class="group/user inline-flex items-center gap-1"
					>
						<div
							class="h-8 w-8 shrink-0 rounded-full bg-cover bg-center"
							style="background-image: url('{data.project.user.avatar}');"
						></div>
						<div>
							<p class="text-sm font-semibold group-hover/user:text-blue-600">
								{data.project.user.username}
							</p>
						</div>
					</a>
				</div>

				{#if data.project.tags && data.project.tags.length > 0}
					<div class="flex flex-wrap gap-2">
						{#each data.project.tags as tag}
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
					<div class="flex w-full justify-between rounded-lg border border-neutral-400 xl:w-auto">
						<div
							class="flex flex-1 items-center justify-center gap-1 rounded-tl-lg rounded-bl-lg border-r border-neutral-400 bg-neutral-800 p-3"
						>
							<Fa icon={faEye} class="text-sm text-neutral-400" />
							<p class="text-sm font-semibold">{formatNumber(data.project.views)}</p>
						</div>
						<div
							class="flex flex-1 items-center justify-center gap-1 border-r border-neutral-400 bg-neutral-800 p-3"
						>
							<Fa icon={faHeart} class="text-sm text-neutral-400" />
							<p class="text-sm font-semibold">{formatNumber(data.project.likes)}</p>
						</div>
						<div
							class="flex flex-1 items-center justify-center gap-1 border-r border-neutral-400 bg-neutral-800 p-3"
						>
							<Fa icon={faBookmark} class="text-sm text-neutral-400" />
							<p class="text-sm font-semibold">{formatNumber(data.project.likes)}</p>
						</div>
						<a href="/" class="flex h-full flex-1">
							<div
								class="flex flex-1 items-center justify-center gap-1 rounded-tr-lg rounded-br-lg bg-neutral-800 p-3"
							>
								<Fa icon={faDownload} class="text-sm text-neutral-400" />
								<p class="text-sm font-semibold">{formatNumber(data.project.likes)}</p>
							</div>
						</a>
					</div>
					<div class="flex w-full gap-2 xl:w-auto">
						<button class="btn flex-1 btn-primary xl:flex-none"
							><span><Fa icon={faShare} class="text-sm" /></span>Share</button
						>
						<button class="btn flex-1 btn-primary xl:flex-none"
							><span><Fa icon={faBookmark} class="text-sm" /></span>Bookmark</button
						>
						<button class="btn flex-1 btn-primary xl:flex-none" onclick={handleDownload} disabled={downloading}>
							<span>
								{#if downloading}
									<span class="loading loading-spinner loading-sm"></span>
								{:else}
									<Fa icon={faDownload} class="text-sm" />
								{/if}
							</span>
							{downloading ? 'Downloading...' : 'Download'}
						</button>
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
						{data.project.description || 'No description available'}
					</p>
				</div>
			</div>
		</div>
	{:else}
		<div class="flex h-64 items-center justify-center">
			<div class="text-center">
				<div
					class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"
				></div>
				<p class="text-neutral-400">Loading project...</p>
			</div>
		</div>
	{/if}
</div>
