-- Bookmarks Table
-- Tracks which models users have bookmarked

create table if not exists public.bookmarks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  model_id text not null,
  created_at timestamp with time zone default now()
);

-- Prevent duplicate bookmarks (user can only bookmark a model once)
create unique index if not exists bookmarks_user_model_unique_idx on public.bookmarks(user_id, model_id);

-- Indexes for faster lookups
create index if not exists bookmarks_user_id_idx on public.bookmarks(user_id);
create index if not exists bookmarks_model_id_idx on public.bookmarks(model_id);
create index if not exists bookmarks_created_at_idx on public.bookmarks(created_at);

-- Enable RLS
alter table public.bookmarks enable row level security;

-- Users can view their own bookmarks
create policy "Users can view their own bookmarks"
  on public.bookmarks
  for select
  using (auth.uid() = user_id);

-- Users can create their own bookmarks
create policy "Users can create their own bookmarks"
  on public.bookmarks
  for insert
  with check (auth.uid() = user_id);

-- Users can delete their own bookmarks
create policy "Users can delete their own bookmarks"
  on public.bookmarks
  for delete
  using (auth.uid() = user_id);

-- Comments
comment on table public.bookmarks is 'User bookmarks for saving models they want to revisit';
comment on column public.bookmarks.model_id is 'The LBRY model ID (e.g., "Model-Name:1")';
