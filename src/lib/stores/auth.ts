import { writable } from 'svelte/store';
import { normalizeAccountNumber, isValidAccountNumber } from '$lib/utils/accountNumber';

export const user = writable<{ id: string } | null>(null);
export const loading = writable<boolean>(true);

export function initAuth() {
	let stopped = false;

	(async () => {
		try {
			const response = await fetch('/api/account/session');
			const data = await response.json();
			if (!stopped) {
				user.set(data.user ?? null);
				loading.set(false);
			}
		} catch {
			if (!stopped) {
				user.set(null);
				loading.set(false);
			}
		}
	})();

	return () => {
		stopped = true;
	};
}

export const auth = {
	createAccount: async (acceptedTos: boolean) => {
		const response = await fetch('/api/account/create', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ acceptedTos })
		});
		const data = await response.json();
		return {
			data,
			error: response.ok ? null : { message: data.error || 'Failed to create account' }
		};
	},

	signIn: async (accountNumber: string) => {
		const normalized = normalizeAccountNumber(accountNumber);
		if (!isValidAccountNumber(normalized)) {
			return {
				data: null,
				error: { message: 'Account number must be 16 digits' }
			};
		}

		const response = await fetch('/api/account/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ accountNumber: normalized })
		});
		const data = await response.json();
		if (response.ok) {
			const sessionRes = await fetch('/api/account/session');
			const sessionData = await sessionRes.json();
			user.set(sessionData.user ?? null);
		}
		return {
			data,
			error: response.ok ? null : { message: data.error || 'Login failed' }
		};
	},

	signOut: async () => {
		user.set(null);
		fetch('/api/account/logout', { method: 'POST' });
		return { error: null };
	}
};
