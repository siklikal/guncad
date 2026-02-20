-- Backfill user_profiles for existing auth.users
-- This creates profile records for users that were created before the user_profiles table existed
-- Supports both legacy (is_approved) and new (status) schema shapes.

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'user_profiles'
      and column_name = 'status'
  ) then
    insert into public.user_profiles (id, email, status, approved_at, created_at)
    select
      id,
      email,
      'active', -- Auto-activate existing users (they were already using the site)
      now(),
      created_at
    from auth.users
    where id not in (select id from public.user_profiles)
    on conflict (id) do nothing;
  elsif exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'user_profiles'
      and column_name = 'is_approved'
  ) then
    insert into public.user_profiles (id, email, is_approved, approved_at, created_at)
    select
      id,
      email,
      true, -- Auto-approve existing users (they were already using the site)
      now(),
      created_at
    from auth.users
    where id not in (select id from public.user_profiles)
    on conflict (id) do nothing;
  end if;
end $$;
