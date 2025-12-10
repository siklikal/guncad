<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button/index.js';
	import { CircleAlert, House, ArrowLeft } from '@lucide/svelte';

	const status = $page.status;
	const message = $page.error?.message || 'Something went wrong';
</script>

<div class="flex flex-col items-center justify-center p-4">
	<div class="text-center">
		<div class="mb-6 flex justify-center">
			<div class="rounded-full bg-destructive/10 p-6">
				<CircleAlert class="h-16 w-16 text-destructive" />
			</div>
		</div>

		<h1 class="mb-2 text-6xl font-bold text-foreground">
			{status}
		</h1>

		<h2 class="mb-4 text-2xl font-semibold text-foreground">
			{#if status === 404}
				Page Not Found
			{:else if status === 500}
				Internal Server Error
			{:else}
				Error
			{/if}
		</h2>

		<p class="mb-8 text-muted-foreground">
			{#if status === 404}
				The page you're looking for doesn't exist or has been moved.
			{:else}
				{message}
			{/if}
		</p>

		<div class="flex justify-center">
			<a href="/">
				<Button class="w-[120px]">
					<House class="h-4 w-4" />
					Home
				</Button>
			</a>
		</div>
	</div>
</div>
