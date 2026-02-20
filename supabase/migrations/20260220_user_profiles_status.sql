-- Replace boolean approval with multi-state status for user profiles
-- statuses: inactive (default), active, banned

do $$
begin
  -- Drop policies that reference legacy is_approved before column migration.
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'user_profiles'
      and column_name = 'is_approved'
  ) then
    execute 'drop policy if exists "Admins can update profiles" on public.user_profiles';
    execute 'drop policy if exists "Admins can view all profiles" on public.user_profiles';
  end if;

  -- Ensure status column exists with valid constraint/default
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'user_profiles'
      and column_name = 'status'
  ) then
    alter table public.user_profiles add column status text;
  end if;

  -- Migrate legacy boolean approval data if present
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'user_profiles'
      and column_name = 'is_approved'
  ) then
    execute '
      update public.user_profiles
      set status = case when is_approved then ''active'' else ''inactive'' end
      where status is null
    ';

    alter table public.user_profiles drop column is_approved;
  end if;

  update public.user_profiles
  set status = 'inactive'
  where status is null;

  alter table public.user_profiles
    alter column status set default 'inactive',
    alter column status set not null;

  begin
    alter table public.user_profiles
      add constraint user_profiles_status_check
      check (status in ('inactive', 'active', 'banned'));
  exception
    when duplicate_object then null;
  end;
end $$;

-- Update policies to use status instead of is_approved
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

-- Replace legacy index
drop index if exists user_profiles_is_approved_idx;
create index if not exists user_profiles_status_idx on public.user_profiles(status);

comment on column public.user_profiles.status is 'Account lifecycle status: inactive, active, banned';
