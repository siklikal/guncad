-- Allow guest purchases (user_id can be null for instant download without account)
alter table public.payments
  alter column user_id drop not null;
