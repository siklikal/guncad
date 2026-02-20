<script lang="ts">
	import { auth, user } from '$lib/stores/auth';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';

	async function handleSignOut() {
		await auth.signOut();
	}
</script>

<div class="space-y-6">
	<div>
		<h1 class="text-3xl font-bold">Settings</h1>
		<p class="text-muted-foreground">Account settings for account-number login</p>
	</div>

	<Card.Root>
		<Card.Header>
			<Card.Title>Account Identity</Card.Title>
			<Card.Description>This account is authenticated by account number only.</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-2">
			<p class="text-sm text-muted-foreground">Account Number</p>
			<p class="rounded-md border border-border bg-muted/40 p-3 font-mono text-sm">
				Not recoverable here (shown only once at creation)
			</p>
			<p class="text-xs text-muted-foreground">
				Only a one-way lookup token is stored server-side. Save your account number securely.
			</p>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title>Session</Card.Title>
			<Card.Description>Manage your current login session</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-4">
			<Button variant="outline" onclick={handleSignOut}>Sign Out</Button>
		</Card.Content>
	</Card.Root>
</div>
