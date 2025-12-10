import { createBrowserClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

/**
 * Supabase browser client using SSR package
 *
 * This uses @supabase/ssr instead of @supabase/supabase-js to ensure
 * proper cookie synchronization between client and server.
 *
 * The server-side client is created in hooks.server.ts using createServerClient,
 * and both clients share the same cookie storage mechanism.
 */
export const supabase = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
