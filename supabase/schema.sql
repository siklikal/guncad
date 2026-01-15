-- ============================================================================
-- GUNCAD COMPLETE DATABASE SCHEMA
-- ============================================================================
-- This is the complete database schema for GunCAD.
-- Run this file to set up the database from scratch.
-- Last updated: 2025-01-15
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

-- Index for fast user lookup
create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);
create index if not exists subscriptions_status_idx on public.subscriptions(status);
create index if not exists subscriptions_expires_at_idx on public.subscriptions(expires_at);

-- RLS policies
alter table public.subscriptions enable row level security;

drop policy if exists "Users can view their own subscriptions" on public.subscriptions;
create policy "Users can view their own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id);

drop policy if exists "Service role can manage all subscriptions" on public.subscriptions;
create policy "Service role can manage all subscriptions"
  on public.subscriptions for all
  using (auth.role() = 'service_role');

-- ============================================================================
-- PAYMENTS TABLE
-- ============================================================================
-- Audit log of all payment transactions
create table if not exists public.payments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  model_id text,
  amount decimal(10,2) not null,
  currency text default 'USD',
  status text not null check (status in ('pending', 'completed', 'failed', 'refunded')),
  payment_type text not null check (payment_type in ('subscription', 'model')),
  authorize_net_transaction_id text unique,
  authorize_net_response_code text,
  authorize_net_auth_code text,
  authorize_net_message text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Indexes
create index if not exists payments_user_id_idx on public.payments(user_id);
create index if not exists payments_model_id_idx on public.payments(model_id);
create index if not exists payments_authorize_net_transaction_id_idx on public.payments(authorize_net_transaction_id);
create index if not exists payments_status_idx on public.payments(status);
create index if not exists payments_created_at_idx on public.payments(created_at);

-- RLS policies
alter table public.payments enable row level security;

drop policy if exists "Users can view their own payments" on public.payments;
create policy "Users can view their own payments"
  on public.payments for select
  using (auth.uid() = user_id);

drop policy if exists "Service role can manage all payments" on public.payments;
create policy "Service role can manage all payments"
  on public.payments for all
  using (auth.role() = 'service_role');

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

-- Indexes
create index if not exists downloads_user_id_idx on public.downloads(user_id);
create index if not exists downloads_model_id_idx on public.downloads(model_id);
create index if not exists downloads_downloaded_at_idx on public.downloads(downloaded_at);

-- RLS policies
alter table public.downloads enable row level security;

drop policy if exists "Users can view their own downloads" on public.downloads;
create policy "Users can view their own downloads"
  on public.downloads for select
  using (auth.uid() = user_id);

drop policy if exists "Service role can manage all downloads" on public.downloads;
create policy "Service role can manage all downloads"
  on public.downloads for all
  using (auth.role() = 'service_role');

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user has active subscription
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

-- Function to get user's active subscription
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

-- ============================================================================
-- COMMENTS
-- ============================================================================

comment on table public.subscriptions is 'User subscription records for yearly unlimited downloads';
comment on table public.payments is 'Audit log of all payment transactions via Authorize.Net';
comment on table public.downloads is 'Tracks user download history and entitlement source';

comment on column public.subscriptions.status is 'active = can download, cancelled = no renewal but still valid until expires_at, expired = past expires_at';
comment on column public.subscriptions.expires_at is 'Subscription valid until this date (365 days from started_at)';
comment on column public.payments.payment_type is 'subscription = yearly subscription, model = one-time model purchase';
comment on column public.payments.status is 'pending = processing, completed = charged successfully, failed = declined, refunded = money returned';
comment on column public.downloads.download_type is 'subscription = downloaded via active subscription, purchased = bought individually, free = free model';
