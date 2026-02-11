-- ============================================================================
-- PROJECT STATS AND LIKES FEATURE
-- ============================================================================
-- Adds support for tracking project views, likes, and downloads
-- Combines GCI base stats with our own tracked engagement metrics
-- Created: 2025-02-11
-- ============================================================================

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

-- Index for fast lookups by project_id
create index if not exists project_stats_project_id_idx on public.project_stats(project_id);

-- Enable RLS
alter table public.project_stats enable row level security;

-- Everyone can read project stats
create policy "Anyone can view project stats"
  on public.project_stats
  for select
  using (true);

-- Only authenticated users can insert/update project stats (via server)
create policy "Authenticated users can insert project stats"
  on public.project_stats
  for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update project stats"
  on public.project_stats
  for update
  using (auth.role() = 'authenticated');

-- Comments
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

-- Indexes for fast lookups
create index if not exists user_likes_user_id_idx on public.user_likes(user_id);
create index if not exists user_likes_project_id_idx on public.user_likes(project_id);

-- Enable RLS
alter table public.user_likes enable row level security;

-- Users can view their own likes
create policy "Users can view their own likes"
  on public.user_likes
  for select
  using (auth.uid() = user_id);

-- Users can insert their own likes
create policy "Users can insert their own likes"
  on public.user_likes
  for insert
  with check (auth.uid() = user_id);

-- Users can delete their own likes
create policy "Users can delete their own likes"
  on public.user_likes
  for delete
  using (auth.uid() = user_id);

-- Comments
comment on table public.user_likes is 'Tracks which users have liked which projects';
comment on column public.user_likes.project_id is 'The LBRY project ID (e.g., "Model-Name:1")';
