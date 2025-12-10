<script lang="ts">
	import { user, auth } from '$lib/stores/auth';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Loader2, Eye, EyeOff } from '@lucide/svelte';
	import { supabase } from '$lib/supabase';

	let username = $state($user?.user_metadata?.username || '');
	let email = $state($user?.email || '');
	let newEmail = $state('');
	let avatarUrl = $state($user?.user_metadata?.avatar_url || '');

	let currentPassword = $state('');
	let newPassword = $state('');
	let showCurrentPassword = $state(false);
	let showNewPassword = $state(false);

	let profileLoading = $state(false);
	let emailLoading = $state(false);
	let passwordLoading = $state(false);
	let profileError = $state('');
	let profileSuccess = $state('');
	let emailError = $state('');
	let emailSuccess = $state('');
	let passwordError = $state('');
	let passwordSuccess = $state('');

	async function handleProfileUpdate() {
		profileError = '';
		profileSuccess = '';
		profileLoading = true;

		try {
			const { error } = await supabase.auth.updateUser({
				data: {
					username,
					avatar_url: avatarUrl
				}
			});

			if (error) throw error;

			profileSuccess = 'Profile updated successfully!';
		} catch (error: any) {
			profileError = error.message;
		} finally {
			profileLoading = false;
		}
	}

	async function handleEmailUpdate() {
		emailError = '';
		emailSuccess = '';

		if (!newEmail || newEmail === email) {
			emailError = 'Please enter a new email address';
			return;
		}

		// Basic email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(newEmail)) {
			emailError = 'Please enter a valid email address';
			return;
		}

		emailLoading = true;

		try {
			const { error } = await supabase.auth.updateUser({
				email: newEmail
			});

			if (error) throw error;

			emailSuccess =
				'Verification email sent! Please check your new email address to confirm the change.';
			newEmail = '';
		} catch (error: any) {
			emailError = error.message;
		} finally {
			emailLoading = false;
		}
	}

	async function handlePasswordUpdate() {
		passwordError = '';
		passwordSuccess = '';

		if (newPassword.length < 6) {
			passwordError = 'Password must be at least 6 characters';
			return;
		}

		passwordLoading = true;

		try {
			const { error } = await supabase.auth.updateUser({
				password: newPassword
			});

			if (error) throw error;

			passwordSuccess = 'Password updated successfully!';
			currentPassword = '';
			newPassword = '';
		} catch (error: any) {
			passwordError = error.message;
		} finally {
			passwordLoading = false;
		}
	}
</script>

<div class="space-y-6">
	<div>
		<h1 class="text-3xl font-bold">Settings</h1>
		<p class="text-muted-foreground">Manage your account settings and preferences</p>
	</div>

	<!-- Profile Settings -->
	<Card.Root>
		<Card.Header>
			<Card.Title>Profile Information</Card.Title>
			<Card.Description>Update your profile details</Card.Description>
		</Card.Header>
		<Card.Content>
			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleProfileUpdate();
				}}
				class="space-y-4"
			>
				<div class="space-y-2">
					<Label for="email">Current Email</Label>
					<Input id="email" type="email" bind:value={email} disabled class="opacity-50" />
				</div>

				<div class="space-y-2">
					<Label for="username">Username</Label>
					<Input
						id="username"
						type="text"
						bind:value={username}
						placeholder="johndoe"
						required
					/>
				</div>

				<div class="space-y-2">
					<Label for="avatar">Avatar URL</Label>
					<Input
						id="avatar"
						type="url"
						bind:value={avatarUrl}
						placeholder="https://example.com/avatar.jpg"
					/>
					<p class="text-xs text-muted-foreground">
						Enter a URL to your profile picture or leave blank for default
					</p>
				</div>

				{#if avatarUrl}
					<div class="space-y-2">
						<Label>Avatar Preview</Label>
						<div class="flex items-center gap-4">
							<img
								src={avatarUrl}
								alt="Avatar preview"
								class="h-20 w-20 rounded-full object-cover"
								onerror={(e) => {
									e.currentTarget.src = '/images/default-avatar.avif';
								}}
							/>
						</div>
					</div>
				{/if}

				{#if profileError}
					<div class="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
						{profileError}
					</div>
				{/if}

				{#if profileSuccess}
					<div class="rounded-md bg-green-500/15 p-3 text-sm text-green-600">
						{profileSuccess}
					</div>
				{/if}

				<Button type="submit" disabled={profileLoading}>
					{#if profileLoading}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
						Updating...
					{:else}
						Save Changes
					{/if}
				</Button>
			</form>
		</Card.Content>
	</Card.Root>

	<!-- Email Change Settings -->
	<Card.Root>
		<Card.Header>
			<Card.Title>Change Email</Card.Title>
			<Card.Description
				>Update your email address. You'll need to verify the new email.</Card.Description
			>
		</Card.Header>
		<Card.Content>
			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleEmailUpdate();
				}}
				class="space-y-4"
			>
				<div class="space-y-2">
					<Label for="new-email">New Email Address</Label>
					<Input
						id="new-email"
						type="email"
						bind:value={newEmail}
						placeholder="newemail@example.com"
						required
					/>
					<p class="text-xs text-muted-foreground">
						A verification link will be sent to your new email address
					</p>
				</div>

				{#if emailError}
					<div class="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
						{emailError}
					</div>
				{/if}

				{#if emailSuccess}
					<div class="rounded-md bg-blue-500/15 p-3 text-sm text-blue-600">
						{emailSuccess}
					</div>
				{/if}

				<Button type="submit" disabled={emailLoading}>
					{#if emailLoading}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
						Sending verification...
					{:else}
						Change Email
					{/if}
				</Button>
			</form>
		</Card.Content>
	</Card.Root>

	<!-- Password Settings -->
	<Card.Root>
		<Card.Header>
			<Card.Title>Change Password</Card.Title>
			<Card.Description>Update your password to keep your account secure</Card.Description>
		</Card.Header>
		<Card.Content>
			<form
				onsubmit={(e) => {
					e.preventDefault();
					handlePasswordUpdate();
				}}
				class="space-y-4"
			>
				<div class="space-y-2">
					<Label for="current-password">Current Password</Label>
					<div class="relative">
						<Input
							id="current-password"
							type={showCurrentPassword ? 'text' : 'password'}
							bind:value={currentPassword}
							placeholder="••••••••"
							class="pr-10"
							required
						/>
						<button
							type="button"
							onclick={() => (showCurrentPassword = !showCurrentPassword)}
							class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
						>
							{#if showCurrentPassword}
								<EyeOff class="h-4 w-4" />
							{:else}
								<Eye class="h-4 w-4" />
							{/if}
						</button>
					</div>
				</div>

				<div class="space-y-2">
					<Label for="new-password">New Password</Label>
					<div class="relative">
						<Input
							id="new-password"
							type={showNewPassword ? 'text' : 'password'}
							bind:value={newPassword}
							placeholder="••••••••"
							minlength="6"
							class="pr-10"
							required
						/>
						<button
							type="button"
							onclick={() => (showNewPassword = !showNewPassword)}
							class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
						>
							{#if showNewPassword}
								<EyeOff class="h-4 w-4" />
							{:else}
								<Eye class="h-4 w-4" />
							{/if}
						</button>
					</div>
				</div>

				{#if passwordError}
					<div class="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
						{passwordError}
					</div>
				{/if}

				{#if passwordSuccess}
					<div class="rounded-md bg-green-500/15 p-3 text-sm text-green-600">
						{passwordSuccess}
					</div>
				{/if}

				<Button type="submit" disabled={passwordLoading}>
					{#if passwordLoading}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
						Updating...
					{:else}
						Update Password
					{/if}
				</Button>
			</form>
		</Card.Content>
	</Card.Root>

	<!-- Account Actions -->
	<Card.Root>
		<Card.Header>
			<Card.Title>Account Actions</Card.Title>
			<Card.Description>Manage your account</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-4">
			<div class="flex items-center justify-between">
				<div>
					<p class="font-medium">Delete Account</p>
					<p class="text-sm text-muted-foreground">
						Permanently delete your account and all associated data
					</p>
				</div>
				<Button variant="destructive" disabled>Delete Account</Button>
			</div>
		</Card.Content>
	</Card.Root>
</div>
