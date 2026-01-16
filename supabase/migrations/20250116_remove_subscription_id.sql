-- Remove subscription_id column from payments table
-- This migration fixes the schema mismatch

ALTER TABLE public.payments DROP COLUMN IF EXISTS subscription_id;
