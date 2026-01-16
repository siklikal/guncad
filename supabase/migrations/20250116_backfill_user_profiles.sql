-- Backfill user_profiles for existing auth.users
-- This creates profile records for users that were created before the user_profiles table existed

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
