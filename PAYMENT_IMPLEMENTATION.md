# Payment System Implementation Plan

## Overview
This document outlines the implementation plan for integrating Authorize.Net payments into GUNCAD. The system supports two payment paths:
1. **Yearly Subscription** ($60/year) - unlimited downloads
2. **Pay-per-model** (future feature)

## Architecture

### Technology Stack
- **Client-side**: Accept.js (Authorize.Net's tokenization library)
- **Server-side**: Authorize.Net API (createTransactionRequest)
- **Database**: Supabase PostgreSQL
- **Environment**: Sandbox (testing) → Production

### Why Accept.js?
Accept.js handles sensitive card data client-side and returns a secure payment token (opaqueData). This approach:
- Maintains PCI compliance (card data never touches our servers)
- Reduces security burden
- Is the recommended approach by Authorize.Net for modern web apps

**NOT using Collect.js**: Collect.js is for embedded payment forms. Accept.js gives us more control over UI/UX.

## Database Schema

### Tables

#### subscriptions
Tracks user subscription status and expiration.

```sql
create table public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  status text not null check (status in ('active', 'cancelled', 'expired')),
  started_at timestamp with time zone not null default now(),
  expires_at timestamp with time zone not null,
  authorize_net_subscription_id text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Index for fast user lookup
create index subscriptions_user_id_idx on public.subscriptions(user_id);

-- RLS policies
alter table public.subscriptions enable row level security;

create policy "Users can view their own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "Service role can manage all subscriptions"
  on public.subscriptions for all
  using (auth.role() = 'service_role');
```

#### payments
Audit log of all payment transactions.

```sql
create table public.payments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  model_id text,
  amount decimal(10,2) not null,
  currency text default 'USD',
  status text not null check (status in ('pending', 'completed', 'failed', 'refunded')),
  payment_type text not null check (payment_type in ('subscription', 'model')),
  authorize_net_transaction_id text unique,
  authorize_net_response_code text,
  authorize_net_auth_code text,
  authorize_net_message text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Indexes
create index payments_user_id_idx on public.payments(user_id);
create index payments_subscription_id_idx on public.payments(subscription_id);
create index payments_authorize_net_transaction_id_idx on public.payments(authorize_net_transaction_id);

-- RLS policies
alter table public.payments enable row level security;

create policy "Users can view their own payments"
  on public.payments for select
  using (auth.uid() = user_id);

create policy "Service role can manage all payments"
  on public.payments for all
  using (auth.role() = 'service_role');
```

#### downloads
Tracks what models users have downloaded and how they gained access.

```sql
create table public.downloads (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  model_id text not null,
  model_title text,
  download_type text not null check (download_type in ('subscription', 'purchased', 'free')),
  subscription_id uuid references public.subscriptions(id) on delete set null,
  payment_id uuid references public.payments(id) on delete set null,
  downloaded_at timestamp with time zone default now()
);

-- Indexes
create index downloads_user_id_idx on public.downloads(user_id);
create index downloads_model_id_idx on public.downloads(model_id);

-- RLS policies
alter table public.downloads enable row level security;

create policy "Users can view their own downloads"
  on public.downloads for select
  using (auth.uid() = user_id);

create policy "Service role can manage all downloads"
  on public.downloads for all
  using (auth.role() = 'service_role');
```

## API Routes

### 1. Check Entitlement
**Endpoint**: `POST /api/subscription/check-entitlement`

**Purpose**: Check if user can download a model

**Request**:
```json
{
  "modelId": "Hello-Kitty-Beta-1:7"
}
```

**Response** (has subscription):
```json
{
  "canDownload": true,
  "reason": "subscription",
  "subscription": {
    "status": "active",
    "expiresAt": "2025-12-12T00:00:00Z"
  }
}
```

**Response** (no subscription):
```json
{
  "canDownload": false,
  "reason": "no_subscription"
}
```

### 2. Process Subscription Payment
**Endpoint**: `POST /api/subscription/process-payment`

**Purpose**: Charge user and create subscription

**Request**:
```json
{
  "opaqueData": {
    "dataDescriptor": "COMMON.ACCEPT.INAPP.PAYMENT",
    "dataValue": "eyJjb2RlIjoiNTBfMl8wNjAwMD..."
  }
}
```

**Response** (success):
```json
{
  "success": true,
  "subscription": {
    "id": "uuid",
    "status": "active",
    "expiresAt": "2025-12-12T00:00:00Z"
  },
  "payment": {
    "id": "uuid",
    "transactionId": "60198236119",
    "amount": 60.00
  }
}
```

**Response** (failure):
```json
{
  "success": false,
  "error": "Payment declined",
  "code": "2",
  "message": "This transaction has been declined."
}
```

### 3. Download Model
**Endpoint**: `POST /api/download`

**Purpose**: Generate download link and record download

**Request**:
```json
{
  "modelId": "Hello-Kitty-Beta-1:7",
  "modelTitle": "The Hello Kitty"
}
```

**Response**:
```json
{
  "success": true,
  "downloadUrl": "https://guncadindex.com/detail/Hello-Kitty-Beta-1:7/download"
}
```

## User Flow

### Subscription Checkout Flow

```
1. User clicks "Download" on model details page
   ↓
2. Client calls /api/subscription/check-entitlement
   ↓
3a. HAS SUBSCRIPTION → Proceed to download
   ↓
4a. Client calls /api/download → Gets download URL
   ↓
5a. Browser redirects to download URL

3b. NO SUBSCRIPTION → Show subscription modal
   ↓
4b. User enters card details (Accept.js form)
   ↓
5b. User clicks "Subscribe" button
   ↓
6b. Accept.js tokenizes card data → Returns opaqueData
   ↓
7b. Client calls /api/subscription/process-payment with opaqueData
   ↓
8b. Server charges card via Authorize.Net API
   ↓
9b. Server creates subscription + payment records
   ↓
10b. Server returns success → Close modal
   ↓
11b. Auto-retry download (calls /api/download)
   ↓
12b. Browser redirects to download URL
```

## Environment Variables

```env
# Authorize.Net Sandbox
PUBLIC_AUTHORIZE_NET_API_LOGIN_ID=your_sandbox_login_id
PUBLIC_AUTHORIZE_NET_CLIENT_KEY=your_sandbox_client_key
AUTHORIZE_NET_TRANSACTION_KEY=your_sandbox_transaction_key
AUTHORIZE_NET_ENVIRONMENT=sandbox

# Subscription pricing
SUBSCRIPTION_YEARLY_PRICE=60.00

# Supabase
PUBLIC_SUPABASE_URL=your_supabase_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Production**: Change `AUTHORIZE_NET_ENVIRONMENT=production` and swap keys.

## Edge Cases & Error Handling

### 1. Payment Declined
- Show clear error message from Authorize.Net
- Allow user to retry with different card
- Don't create subscription or payment record

### 2. Network Failure Mid-Transaction
- Check if transaction ID exists in payments table
- If exists: Check status with Authorize.Net API
- If pending: Query transaction status
- Prevent duplicate charges

### 3. Subscription Expired
- Background job checks `expires_at` daily
- Update `status` to 'expired' if past expiration
- Next download attempt shows subscription modal

### 4. User Cancels Subscription
- Update `status` to 'cancelled'
- Keep `expires_at` unchanged (access until expiration)
- Downloads work until expiration date

### 5. Refund Request
- Manual process (admin panel, future)
- Call Authorize.Net refund API
- Update payment `status` to 'refunded'
- Update subscription `status` to 'cancelled'

## Implementation Phases

### Phase 1: Basic Subscription Flow ⬅️ **IN PROGRESS**
**Goal**: Allow users to subscribe and download models

**Tasks**:
1. ✅ Create database tables (run SQL) - **COMPLETED**
2. ✅ Create `/api/subscription/check-entitlement` endpoint - **COMPLETED**
3. ✅ Update download button to call check-entitlement - **COMPLETED**
4. ✅ Show "Subscribe to Download" modal if no subscription - **COMPLETED**
5. ⏳ Add Accept.js script to checkout modal - **NEXT STEP**
6. ⏳ Create form with card input fields - **COMPLETED** (needs Accept.js integration)
7. ⏳ Implement tokenization on submit - **TODO**
8. ⏳ Create `/api/subscription/process-payment` endpoint - **TODO**
9. ⏳ Integrate with Authorize.Net `createTransactionRequest` - **TODO**
10. ⏳ Store payment + subscription records - **TODO**
11. ⏳ Allow download after successful payment - **TODO**
12. ⏳ Record download in audit table - **TODO**
13. ⏳ Test full flow end-to-end - **TODO**

**Estimated time**: 4-6 hours (2-3 hours remaining)

**Progress**: 4/13 tasks completed (31%)

### Phase 2: User Dashboard
**Goal**: Let users view subscription status and download history

**Tasks**:
1. Add subscription section to `/user/settings`
2. Display subscription status, expiration date
3. Show "Cancel Subscription" button
4. Create `/api/subscription/cancel` endpoint
5. Add downloads history table
6. Allow re-downloading previously downloaded models

**Estimated time**: 2-3 hours

### Phase 3: Admin Panel
**Goal**: Allow admin to manage subscriptions and payments

**Tasks**:
1. Create `/admin/subscriptions` page
2. List all active subscriptions
3. Search/filter by user
4. View payment history
5. Issue refunds
6. Manually grant/revoke subscriptions

**Estimated time**: 4-5 hours

### Phase 4: Pay-per-Model
**Goal**: Allow one-time model purchases

**Tasks**:
1. Add pricing data to models
2. Update check-entitlement to check purchased models
3. Create model checkout flow
4. Update `/api/subscription/process-payment` to handle model purchases
5. Track purchased models in downloads table

**Estimated time**: 3-4 hours

## Testing Strategy

### Sandbox Testing
Use Authorize.Net sandbox test cards:
- **Visa**: 4007000000027
- **Mastercard**: 5424000000000015
- **Amex**: 370000000000002
- **Discover**: 6011000000000012

**Expiration**: Any future date
**CVV**: Any 3-4 digits

### Test Scenarios
1. ✅ Successful subscription purchase
2. ❌ Declined card (use 4000300011112220)
3. ⚠️ Network timeout (simulate)
4. 🔄 Duplicate payment prevention
5. 📅 Subscription expiration
6. 🚫 Cancelled subscription still works until expiration
7. 💰 Refund processing

## Security Considerations

### Client-side
- ✅ Never send raw card data to server
- ✅ Use Accept.js tokenization
- ✅ Validate form fields before submission
- ✅ Use HTTPS in production

### Server-side
- ✅ Validate opaqueData before charging
- ✅ Use service role key for database writes
- ✅ Verify user authentication
- ✅ Rate limit payment endpoints
- ✅ Log all transactions for audit
- ✅ Never expose transaction keys client-side

### Database
- ✅ Enable RLS on all tables
- ✅ Users can only view their own data
- ✅ Service role for payment processing
- ✅ Cascade deletes on user deletion

## Monitoring & Alerts

### Metrics to Track
1. Subscription conversion rate
2. Payment decline rate
3. Average revenue per user (ARPU)
4. Churn rate
5. Failed transaction reasons

### Alerts
- Payment processing errors (Slack/email)
- High decline rate (>10%)
- Duplicate transaction attempts
- Expired subscriptions not updated

## Future Enhancements

1. **Promo Codes**: Discount codes for subscriptions
2. **Tiered Pricing**: Monthly vs yearly subscriptions
3. **Team Accounts**: Multi-user subscriptions
4. **Gift Subscriptions**: Buy subscription for another user
5. **Auto-renewal**: Charge card annually (requires ARB)
6. **Payment Method Management**: Update card on file
7. **Invoice Generation**: PDF receipts via email
8. **Analytics Dashboard**: Revenue tracking, user insights

## Resources

- [Authorize.Net Accept.js Documentation](https://developer.authorize.net/api/reference/features/acceptjs.html)
- [Authorize.Net API Reference](https://developer.authorize.net/api/reference/index.html)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [SvelteKit Form Actions](https://kit.svelte.dev/docs/form-actions)

---

## Session Notes

### Session 1: 2025-12-12
**Completed**:
- ✅ Created payment system documentation
- ✅ Created database schema with subscriptions, payments, and downloads tables
- ✅ Ran SQL migration in Supabase dashboard
- ✅ Created `/api/subscription/check-entitlement` endpoint
- ✅ Updated download button to check entitlement before allowing download
- ✅ Created subscription modal component with payment form UI
- ✅ Fixed authentication issue (switched from cookies to `locals.session`)
- ✅ Added `SUPABASE_SERVICE_ROLE_KEY` to environment variables

**Tested**:
- ✅ Download button shows subscription modal when user has no subscription
- ✅ Modal displays correctly with pricing and form fields
- ✅ Payment form shows placeholder error (expected - Accept.js not integrated yet)

**Next Session TODO**:
1. Add Accept.js script to subscription modal
2. Implement payment tokenization on form submit
3. Create `/api/subscription/process-payment` endpoint
4. Test payment processing with Authorize.Net sandbox
5. Implement download recording in downloads table
6. Test full end-to-end flow

**Known Issues**:
- None currently

**Environment Variables Added**:
- `SUPABASE_SERVICE_ROLE_KEY` - Added to `.env` file

---

**Last Updated**: 2025-12-12
**Status**: Phase 1 In Progress (31% complete)
