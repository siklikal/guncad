# GunCAD

A SvelteKit web app for discovering and downloading gun CAD files. Data is sourced from the GunCAD Index (GCI) API and LBRY/Odysee for decentralized file hosting.

## Tech Stack

- **Framework**: SvelteKit (Svelte 5) with adapter-node
- **Styling**: Tailwind CSS v4, DaisyUI
- **Database**: Supabase (PostgreSQL + Auth)
- **Payments**: Authorize.Net (Accept.js tokenization)
- **Search**: Meilisearch (self-hosted on Railway)
- **Hosting**: Railway

## Local Development

```sh
npm install
npm run dev
```

Copy `.env.example` to `.env` and fill in the values (see Environment Variables below).

## Building & Running

```sh
npm run build
npm start        # runs: node build
```

## Deployment (Railway)

The app deploys on Railway as a Node.js service. Railway auto-detects the `package.json`, runs `npm run build`, then `npm start`.

### Environment Variables

Set these in Railway's Variables tab:

| Variable | Description |
|---|---|
| `PUBLIC_SUPABASE_URL` | Supabase project URL |
| `PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `ACCOUNT_NUMBER_PEPPER` | Hex string for hashing account numbers |
| `BETA_ACCESS_PASSWORD` | Shared password for beta access gate |
| `LBRY_SERVER_URL` | LBRY file server URL |
| `ADN_TRANSACTION_KEY` | Authorize.Net transaction key (server-only) |
| `ADN_API_ENDPOINT` | Authorize.Net API endpoint |
| `PUBLIC_ADN_API_LOGIN_ID` | Authorize.Net API login ID |
| `PUBLIC_ADN_PUBLIC_CLIENT_KEY` | Authorize.Net public client key |
| `PUBLIC_ADN_ACCEPT_JS_URL` | Authorize.Net Accept.js script URL |
| `PUBLIC_MODEL_PURCHASE_PRICE` | Default model price |
| `IPGEOLOCATION_API_KEY` | IP geolocation API key |
| `VPNAPI_API_KEY` | VPN detection API key |
| `BYPASS_GEO_CHECK` | Skip geo/VPN checks (`true` for dev, `false` for prod) |
| `PUBLIC_MEILISEARCH_URL` | Meilisearch instance URL |
| `PUBLIC_MEILISEARCH_SEARCH_KEY` | Meilisearch search-only API key (safe for client) |
| `MEILISEARCH_MASTER_KEY` | Meilisearch master key (server-only, for indexing) |

Variables prefixed with `PUBLIC_` are accessible client-side. All others are server-only.

For production, use the production Authorize.Net keys (not sandbox).

---

## Meilisearch

Meilisearch powers the search feature. It runs as a separate Railway service.

### Setup on Railway

1. Create a new service in your Railway project
2. Use the Docker image: `getmeili/meilisearch`
3. Add a **Volume** (Railway dashboard: service > + New > Volume), mount at `/meili_data` — this persists the search index across deploys
4. Set the `MEILI_MASTER_KEY` environment variable to a strong random string (16+ chars). Without this, the instance is open to the public with no auth
5. Under Networking, generate a public domain or use Railway's internal networking (`meilisearch.railway.internal`) for service-to-service communication

### Keys

Once `MEILI_MASTER_KEY` is set, Meilisearch generates two API keys automatically:

- **Admin key** — for indexing/writing data (server-side only)
- **Search key** — safe for client-side/frontend use

Retrieve them:
```sh
curl -H "Authorization: Bearer YOUR_MASTER_KEY" https://your-meilisearch-url/keys
```

### Indexing Data

Use the sync script to fetch all releases from the GCI API and push to Meilisearch:

```sh
node scripts/sync-meilisearch.js                # Full sync
node scripts/sync-meilisearch.js --update       # Only fetch new releases since last run
node scripts/sync-meilisearch.js --offset 3000  # Resume a crashed run
```

The script outputs `meilisearch-records.json`. Push it to your Meilisearch index:

```sh
curl -X POST 'https://YOUR_MEILI_URL/indexes/releases/documents' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_MASTER_KEY' \
  --data-binary @scripts/meilisearch-records.json
```

Re-running is safe — Meilisearch upserts by `id`, so existing documents get replaced and new ones get added. The index name must be `releases` (matching what the app queries).

---

## GCI API Reference

The app sources model data from the GunCAD Index API.

**Base URL**: `https://guncadindex.com`

### Get Releases

```
GET /api/releases/?format=json&limit=20&offset=0&ordering=-released
```

| Parameter | Description |
|---|---|
| `format` | Response format (`json`) |
| `limit` | Results per page (max `1000`) |
| `offset` | Pagination offset |
| `ordering` | Sort field (`-released`, `name`, etc.) |
| `search` | Search query |
| `tag` | Filter by tag slug |

### Get Tags

```
GET /api/tags/?format=json&limit=200
```

### Project Detail (HTML Scraping)

```
GET /detail/{projectId}
```

Used to extract views, likes, and tags from the HTML page. Project IDs use the LBRY claim name format: `{project-name}:{claim-sequence}` (e.g., `Hello-Kitty-Beta-1:7`).

### LBRY Resolve (Internal)

```
POST /api/lbry-resolve
Body: { "claimNames": ["Hello-Kitty-Beta-1:7"] }
```

Resolves LBRY claim names to get detailed project info including creator metadata and file details.

---

## Payment System

Payments use Authorize.Net with Accept.js for PCI-compliant client-side card tokenization. Card data never touches our servers.

### Flow

1. User clicks Download on a model
2. App checks entitlement (active subscription or prior purchase)
3. If no entitlement, shows payment modal
4. Accept.js tokenizes card data client-side → returns `opaqueData`
5. Server charges via Authorize.Net API
6. Server creates subscription/payment records in Supabase
7. Download proceeds

### Database Tables

- **subscriptions** — tracks user subscription status and expiration
- **payments** — audit log of all transactions
- **downloads** — tracks what models users downloaded and access method
- **project_stats** — views, likes, downloads per project
- **user_likes** — tracks which users liked which projects

All tables use Row Level Security (RLS). Users can only read their own data. The service role key is used for server-side writes.

### Test Cards (Sandbox)

- Visa: `4007000000027`
- Mastercard: `5424000000000015`
- Amex: `370000000000002`
- Any future expiration date, any 3-4 digit CVV

---

## Project Structure

```
src/
  lib/
    components/       # Svelte components (header, SearchBar, ModelCard, etc.)
    stores/           # Svelte stores (auth)
  routes/
    api/              # API endpoints
      releases/       # Proxy to GCI releases API
      lbry-resolve/   # LBRY claim resolution
      lbry-download/  # File download proxy
      spotlight/      # Homepage spotlight data
      project-stats/  # View/like/download tracking
      process-payment/# Authorize.Net payment processing
      check-purchase/ # Purchase verification
    details/[id]/     # Model detail page
    explore/          # Browse/search page
    channel/[name]/   # Creator channel page
    collections/      # Collections page
    user/             # Authenticated user pages (downloads, likes, bookmarks)
    login/            # Login page
scripts/
  sync-meilisearch.js  # GCI → Meilisearch sync script
```
