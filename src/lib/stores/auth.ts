import { writable } from 'svelte/store';
import type { User } from '@supabase/supabase-js';
import { supabase } from '$lib/supabase';

// Create a writable store for the current user
export const user = writable<User | null>(null);
export const loading = writable<boolean>(true);

// Initialize auth state and listen for changes
export function initAuth() {
	// Get initial session
	supabase.auth.getSession().then(({ data: { session } }) => {
		user.set(session?.user ?? null);
		loading.set(false);
	});

	// Listen for auth changes (login, logout, token refresh)
	const {
		data: { subscription }
	} = supabase.auth.onAuthStateChange((_event, session) => {
		user.set(session?.user ?? null);
	});

	// Return unsubscribe function
	return () => subscription.unsubscribe();
}

// Auth helper functions
export const auth = {
	signUp: async (email: string, password: string, username: string) => {
		const { data, error } = await supabase.auth.signUp({
			email,
			password,
			options: {
				data: {
					username
				}
			}
		});
		return { data, error };
	},

	signIn: async (email: string, password: string) => {
		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password
		});
		return { data, error };
	},

	signOut: async () => {
		const { error } = await supabase.auth.signOut();
		return { error };
	}
};
