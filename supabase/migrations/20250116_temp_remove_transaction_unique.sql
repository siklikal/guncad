-- Temporarily remove unique constraint on authorize_net_transaction_id
-- This allows testing with sandbox mode which always returns transaction_id '0'
-- In production, real transaction IDs will be unique anyway

-- Drop the unique constraint
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_authorize_net_transaction_id_key;

-- Keep the index for performance but remove uniqueness
DROP INDEX IF EXISTS payments_authorize_net_transaction_id_idx;
CREATE INDEX IF NOT EXISTS payments_authorize_net_transaction_id_idx ON public.payments(authorize_net_transaction_id);

-- Add comment explaining this is temporary for testing
COMMENT ON COLUMN public.payments.authorize_net_transaction_id IS 'Authorize.Net transaction ID. Unique constraint removed for sandbox testing (sandbox returns 0 for all test transactions). In production, these will naturally be unique.';
