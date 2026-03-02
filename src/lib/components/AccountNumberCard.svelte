<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Copy } from '@lucide/svelte';
	import { normalizeAccountNumber } from '$lib/utils/accountNumber';

	let {
		accountNumber,
		description = 'This is your login credential. It will not be shown again.'
	}: {
		accountNumber: string;
		description?: string;
	} = $props();

	let copied = $state(false);

	async function handleCopy() {
		if (!accountNumber) return;
		await navigator.clipboard.writeText(normalizeAccountNumber(accountNumber));
		copied = true;
		setTimeout(() => {
			copied = false;
		}, 1800);
	}
</script>

<div class="rounded-md border border-blue-700 bg-blue-900/20 p-3">
	<p class="text-sm font-medium">Save your new account number</p>
	<p class="mt-1 text-xs text-neutral-300">{description}</p>
	<div class="mt-2 flex items-center justify-between gap-2">
		<p class="font-mono text-lg">{accountNumber}</p>
		<Button size="sm" type="button" variant="outline" onclick={handleCopy}>
			<Copy class="mr-1 h-3.5 w-3.5" />
			{copied ? 'Copied' : 'Copy'}
		</Button>
	</div>
</div>
