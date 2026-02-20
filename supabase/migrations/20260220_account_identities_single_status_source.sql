-- Keep approval state in one table only: public.user_profiles.status
-- account_identities is now only for lookup_token -> user mapping.

drop index if exists public.account_identities_status_idx;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'account_identities'
      and column_name = 'status'
  ) then
    alter table public.account_identities drop column status;
  end if;
end $$;
