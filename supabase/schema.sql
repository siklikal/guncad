-- ============================================================================
-- GUNCAD COMPLETE DATABASE SCHEMA
-- ============================================================================
-- This is the complete database schema for GunCAD.
-- Run this file to set up the database from scratch.
-- Last updated: 2026-02-16
-- ============================================================================

-- ============================================================================
-- SUBSCRIPTIONS TABLE
-- ============================================================================
-- Tracks user subscription status and expiration
create table if not exists public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  status text not null check (status in ('active', 'cancelled', 'expired')),
  started_at timestamp with time zone not null default now(),
  expires_at timestamp with time zone not null,
  authorize_net_subscription_id text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);
create index if not exists subscriptions_status_idx on public.subscriptions(status);
create index if not exists subscriptions_expires_at_idx on public.subscriptions(expires_at);

alter table public.subscriptions enable row level security;

drop policy if exists "Users can view their own subscriptions" on public.subscriptions;
create policy "Users can view their own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id);

drop policy if exists "Service role can manage all subscriptions" on public.subscriptions;
create policy "Service role can manage all subscriptions"
  on public.subscriptions for all
  using (auth.role() = 'service_role');

comment on table public.subscriptions is 'User subscription records for yearly unlimited downloads';
comment on column public.subscriptions.status is 'active = can download, cancelled = no renewal but still valid until expires_at, expired = past expires_at';
comment on column public.subscriptions.expires_at is 'Subscription valid until this date (365 days from started_at)';

-- ============================================================================
-- PAYMENTS TABLE
-- ============================================================================
-- Audit log of all payment transactions
create table if not exists public.payments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  model_id text,
  amount decimal(10,2) not null,
  currency text default 'USD',
  status text not null check (status in ('pending', 'completed', 'failed', 'refunded')),
  payment_type text not null check (payment_type in ('subscription', 'model')),
  authorize_net_transaction_id text,
  authorize_net_response_code text,
  authorize_net_auth_code text,
  authorize_net_message text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- No unique constraint on authorize_net_transaction_id (sandbox returns '0' for all test transactions)
create index if not exists payments_user_id_idx on public.payments(user_id);
create index if not exists payments_model_id_idx on public.payments(model_id);
create index if not exists payments_authorize_net_transaction_id_idx on public.payments(authorize_net_transaction_id);
create index if not exists payments_status_idx on public.payments(status);
create index if not exists payments_created_at_idx on public.payments(created_at);

alter table public.payments enable row level security;

drop policy if exists "Users can view their own payments" on public.payments;
create policy "Users can view their own payments"
  on public.payments for select
  using (auth.uid() = user_id);

drop policy if exists "Service role can manage all payments" on public.payments;
create policy "Service role can manage all payments"
  on public.payments for all
  using (auth.role() = 'service_role');

comment on table public.payments is 'Audit log of all payment transactions via Authorize.Net';
comment on column public.payments.payment_type is 'subscription = yearly subscription, model = one-time model purchase';
comment on column public.payments.status is 'pending = processing, completed = charged successfully, failed = declined, refunded = money returned';
comment on column public.payments.authorize_net_transaction_id is 'Authorize.Net transaction ID. No unique constraint for sandbox testing (sandbox returns 0 for all test transactions). In production, these will naturally be unique.';

-- ============================================================================
-- DOWNLOADS TABLE
-- ============================================================================
-- Tracks what models users have downloaded and how they gained access
create table if not exists public.downloads (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  model_id text not null,
  model_title text,
  download_type text not null check (download_type in ('subscription', 'purchased', 'free')),
  subscription_id uuid references public.subscriptions(id) on delete set null,
  payment_id uuid references public.payments(id) on delete set null,
  downloaded_at timestamp with time zone default now()
);

create index if not exists downloads_user_id_idx on public.downloads(user_id);
create index if not exists downloads_model_id_idx on public.downloads(model_id);
create index if not exists downloads_downloaded_at_idx on public.downloads(downloaded_at);

alter table public.downloads enable row level security;

drop policy if exists "Users can view their own downloads" on public.downloads;
create policy "Users can view their own downloads"
  on public.downloads for select
  using (auth.uid() = user_id);

drop policy if exists "Service role can manage all downloads" on public.downloads;
create policy "Service role can manage all downloads"
  on public.downloads for all
  using (auth.role() = 'service_role');

comment on table public.downloads is 'Tracks user download history and entitlement source';
comment on column public.downloads.download_type is 'subscription = downloaded via active subscription, purchased = bought individually, free = free model';

-- ============================================================================
-- USER PROFILES TABLE
-- ============================================================================
-- Extends auth.users with approval status and account lifecycle
create table if not exists public.user_profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  status text not null default 'inactive' check (status in ('inactive', 'active', 'banned')),
  approved_at timestamp with time zone,
  approved_by uuid references auth.users(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.user_profiles enable row level security;

drop policy if exists "Users can view their own profile" on public.user_profiles;
create policy "Users can view their own profile"
  on public.user_profiles
  for select
  using (auth.uid() = id);

drop policy if exists "Admins can update profiles" on public.user_profiles;
create policy "Admins can update profiles"
  on public.user_profiles
  for update
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid()
      and status = 'active'
    )
  );

drop policy if exists "Admins can view all profiles" on public.user_profiles;
create policy "Admins can view all profiles"
  on public.user_profiles
  for select
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid()
      and status = 'active'
    )
  );

create index if not exists user_profiles_status_idx on public.user_profiles(status);
create index if not exists user_profiles_email_idx on public.user_profiles(email);

-- Auto-create profile when user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

comment on table public.user_profiles is 'Extended user profile information with account lifecycle status';
comment on column public.user_profiles.status is 'Account lifecycle status: inactive, active, banned';
comment on column public.user_profiles.approved_at is 'Timestamp when user was approved';
comment on column public.user_profiles.approved_by is 'Admin user ID who approved this user';

-- ============================================================================
-- ACCOUNT IDENTITIES TABLE
-- ============================================================================
-- Maps account-number lookup tokens to auth.users for Mullvad-style auth
create table if not exists public.account_identities (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  lookup_token text not null unique,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists account_identities_lookup_token_idx on public.account_identities(lookup_token);

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

-- ============================================================================
-- AUTH SESSIONS TABLE
-- ============================================================================
-- Custom server-managed sessions for account-number auth
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

-- ============================================================================
-- BOOKMARKS TABLE
-- ============================================================================
-- Tracks which models users have bookmarked
create table if not exists public.bookmarks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  model_id text not null,
  created_at timestamp with time zone default now()
);

create unique index if not exists bookmarks_user_model_unique_idx on public.bookmarks(user_id, model_id);
create index if not exists bookmarks_user_id_idx on public.bookmarks(user_id);
create index if not exists bookmarks_model_id_idx on public.bookmarks(model_id);
create index if not exists bookmarks_created_at_idx on public.bookmarks(created_at);

alter table public.bookmarks enable row level security;

drop policy if exists "Users can view their own bookmarks" on public.bookmarks;
create policy "Users can view their own bookmarks"
  on public.bookmarks
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own bookmarks" on public.bookmarks;
create policy "Users can create their own bookmarks"
  on public.bookmarks
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own bookmarks" on public.bookmarks;
create policy "Users can delete their own bookmarks"
  on public.bookmarks
  for delete
  using (auth.uid() = user_id);

comment on table public.bookmarks is 'User bookmarks for saving models they want to revisit';
comment on column public.bookmarks.model_id is 'The LBRY model ID (e.g., "Model-Name:1")';

-- ============================================================================
-- PROJECT STATS TABLE
-- ============================================================================
-- Tracks views, likes, and downloads for each project
create table if not exists public.project_stats (
  id uuid default gen_random_uuid() primary key,
  project_id text unique not null,
  base_views integer default 0,
  base_likes integer default 0,
  our_views integer default 0,
  our_likes integer default 0,
  our_downloads integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists project_stats_project_id_idx on public.project_stats(project_id);

alter table public.project_stats enable row level security;

drop policy if exists "Anyone can view project stats" on public.project_stats;
create policy "Anyone can view project stats"
  on public.project_stats
  for select
  using (true);

drop policy if exists "Authenticated users can insert project stats" on public.project_stats;
create policy "Authenticated users can insert project stats"
  on public.project_stats
  for insert
  with check (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can update project stats" on public.project_stats;
create policy "Authenticated users can update project stats"
  on public.project_stats
  for update
  using (auth.role() = 'authenticated');

comment on table public.project_stats is 'Aggregated statistics for each project combining GCI base stats and our tracked stats';
comment on column public.project_stats.project_id is 'The LBRY project ID (e.g., "Model-Name:1")';
comment on column public.project_stats.base_views is 'Cached odysee_views from GCI API';
comment on column public.project_stats.base_likes is 'Cached odysee_likes from GCI API';
comment on column public.project_stats.our_views is 'Views tracked on our site';
comment on column public.project_stats.our_likes is 'Likes tracked on our site';
comment on column public.project_stats.our_downloads is 'Downloads tracked on our site';

-- ============================================================================
-- USER LIKES TABLE
-- ============================================================================
-- Tracks which users liked which projects
create table if not exists public.user_likes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  project_id text not null,
  created_at timestamp with time zone default now(),
  unique(user_id, project_id)
);

create index if not exists user_likes_user_id_idx on public.user_likes(user_id);
create index if not exists user_likes_project_id_idx on public.user_likes(project_id);

alter table public.user_likes enable row level security;

drop policy if exists "Users can view their own likes" on public.user_likes;
create policy "Users can view their own likes"
  on public.user_likes
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own likes" on public.user_likes;
create policy "Users can insert their own likes"
  on public.user_likes
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own likes" on public.user_likes;
create policy "Users can delete their own likes"
  on public.user_likes
  for delete
  using (auth.uid() = user_id);

comment on table public.user_likes is 'Tracks which users have liked which projects';
comment on column public.user_likes.project_id is 'The LBRY project ID (e.g., "Model-Name:1")';

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Check if user has active subscription
create or replace function public.has_active_subscription(p_user_id uuid)
returns boolean
language plpgsql
security definer
as $$
begin
  return exists (
    select 1
    from public.subscriptions
    where user_id = p_user_id
      and status = 'active'
      and expires_at > now()
  );
end;
$$;

-- Get user's active subscription
create or replace function public.get_active_subscription(p_user_id uuid)
returns table (
  id uuid,
  status text,
  started_at timestamp with time zone,
  expires_at timestamp with time zone
)
language plpgsql
security definer
as $$
begin
  return query
  select s.id, s.status, s.started_at, s.expires_at
  from public.subscriptions s
  where s.user_id = p_user_id
    and s.status = 'active'
    and s.expires_at > now()
  order by s.expires_at desc
  limit 1;
end;
$$;

-- Atomic increment likes (upsert to avoid race conditions)
create or replace function increment_likes(p_project_id text)
returns void
language plpgsql
security definer
as $$
begin
  insert into project_stats (project_id, base_views, base_likes, our_views, our_likes, our_downloads)
  values (p_project_id, 0, 0, 0, 1, 0)
  on conflict (project_id)
  do update set
    our_likes = project_stats.our_likes + 1,
    updated_at = now();
end;
$$;

-- Atomic decrement likes
create or replace function decrement_likes(p_project_id text)
returns void
language plpgsql
security definer
as $$
begin
  update project_stats
  set
    our_likes = greatest(0, our_likes - 1),
    updated_at = now()
  where project_id = p_project_id;
end;
$$;
