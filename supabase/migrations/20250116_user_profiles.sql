-- User Profiles Table for Extended User Information
-- This extends auth.users with custom fields like approval status

create table if not exists public.user_profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  is_approved boolean default false not null,
  approved_at timestamp with time zone,
  approved_by uuid references auth.users(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.user_profiles enable row level security;

-- Users can view their own profile
create policy "Users can view their own profile"
  on public.user_profiles
  for select
  using (auth.uid() = id);

-- Only approved admins can update profiles (you'll need to manually set your first admin)
create policy "Admins can update profiles"
  on public.user_profiles
  for update
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid()
      and is_approved = true
    )
  );

-- Admins can view all profiles
create policy "Admins can view all profiles"
  on public.user_profiles
  for select
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid()
      and is_approved = true
    )
  );

-- Index for faster approval lookups
create index if not exists user_profiles_is_approved_idx on public.user_profiles(is_approved);
create index if not exists user_profiles_email_idx on public.user_profiles(email);

-- Trigger to auto-create profile when user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger on auth.users (runs when new user is created)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Comments
comment on table public.user_profiles is 'Extended user profile information with approval status';
comment on column public.user_profiles.is_approved is 'Whether user has been manually approved by admin to access the site';
comment on column public.user_profiles.approved_at is 'Timestamp when user was approved';
comment on column public.user_profiles.approved_by is 'Admin user ID who approved this user';
