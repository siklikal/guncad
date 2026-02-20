-- Mullvad-style account-number auth using peppered lookup tokens and server sessions.

create table if not exists public.account_identities (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  lookup_token text not null unique,
  status text not null default 'inactive' check (status in ('inactive', 'active', 'banned')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists account_identities_lookup_token_idx on public.account_identities(lookup_token);
create index if not exists account_identities_status_idx on public.account_identities(status);

alter table public.account_identities enable row level security;

drop policy if exists "Users can view their own account identity" on public.account_identities;
create policy "Users can view their own account identity"
  on public.account_identities
  for select
  using (auth.uid() = user_id);

drop policy if exists "Service role can manage account identities" on public.account_identities;
create policy "Service role can manage account identities"
  on public.account_identities
  for all
  using (auth.role() = 'service_role');

comment on table public.account_identities is 'Maps account-number lookup token to auth.users for Mullvad-style auth';
comment on column public.account_identities.lookup_token is 'HMAC-SHA256(account_number, ACCOUNT_NUMBER_PEPPER)';

create table if not exists public.auth_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  session_token_hash text not null unique,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone default now(),
  last_seen_at timestamp with time zone default now()
);

create index if not exists auth_sessions_user_id_idx on public.auth_sessions(user_id);
create index if not exists auth_sessions_expires_at_idx on public.auth_sessions(expires_at);
create index if not exists auth_sessions_token_hash_idx on public.auth_sessions(session_token_hash);

alter table public.auth_sessions enable row level security;

drop policy if exists "Users can view their own sessions" on public.auth_sessions;
create policy "Users can view their own sessions"
  on public.auth_sessions
  for select
  using (auth.uid() = user_id);

drop policy if exists "Service role can manage sessions" on public.auth_sessions;
create policy "Service role can manage sessions"
  on public.auth_sessions
  for all
  using (auth.role() = 'service_role');

comment on table public.auth_sessions is 'Custom server-managed sessions for account-number auth';
comment on column public.auth_sessions.session_token_hash is 'SHA-256 hash of opaque session token stored in cookie';
