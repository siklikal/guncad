<script lang="ts">
	import { auth } from '$lib/stores/auth';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Clock, Mail } from '@lucide/svelte';

	async function handleSignOut() {
		await auth.signOut();
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-neutral-950 p-4">
	<Card.Root class="w-full max-w-md">
		<Card.Header>
			<div class="mb-4 flex justify-center">
				<div class="rounded-full bg-yellow-500/10 p-4">
					<Clock class="h-12 w-12 text-yellow-500" />
				</div>
			</div>
			<Card.Title class="text-center text-3xl">Account Pending Approval</Card.Title>
		</Card.Header>
		<Card.Content>
			<div class="space-y-4 text-center">
				<p class="text-muted-foreground">
					Thank you for signing up! Your account has been created successfully.
				</p>

				<div class="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
					<div class="mb-2 flex items-center justify-center gap-2 text-yellow-500">
						<Mail class="h-4 w-4" />
						<span class="font-semibold">Awaiting Admin Approval</span>
					</div>
					<p class="text-sm text-muted-foreground">
						An administrator needs to approve your account before you can access the site.
					</p>
				</div>

				<div class="space-y-2 text-sm text-muted-foreground">
					<p>In the meantime:</p>
					<ul class="list-inside list-disc space-y-1 text-left">
						<li>Save your account number in a secure location</li>
						<li>Contact support if you have questions</li>
						<li>This page will automatically redirect once you're approved</li>
					</ul>
				</div>

				<div class="pt-4">
					<Button variant="outline" class="w-full" onclick={handleSignOut}>Sign Out</Button>
				</div>
			</div>
		</Card.Content>
	</Card.Root>
</div>
