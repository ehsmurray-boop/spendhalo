---
name: Stripe Replit connector field names
description: Correct field names from the Replit connectors API for Stripe, and how stripe-replit-sync tables work
---

## Credentials field name

The Replit connectors API (`/api/v2/connection?connector_names=stripe`) returns:

```json
"settings": {
  "secret": "sk_test_...",      ← NOT "secret_key"
  "publishable": "pk_test_...", ← NOT "publishable_key"
  "account_id": "acct_...",
  "mcp": "ek_test_..."
}
```

**Why:** The skill template says `settings.secret_key` but the actual API returns `settings.secret`. Always verify with a live curl to the connector API when credentials silently fail.

**How to apply:** In `stripeClient.ts`, use `settings.secret` (not `settings.secret_key`).

## stripe-replit-sync tables use _raw_data JSONB

All columns in `stripe.products`, `stripe.prices`, etc. are generated from a `_raw_data` JSONB column. To insert manually:

```sql
INSERT INTO stripe.products (_account_id, _raw_data) VALUES ('acct_...', '{...raw Stripe API object...}')
```

**Why:** The tables mirror Stripe's API response structure via generated columns. Only `_account_id` and `_raw_data` are writable.

## runMigrations behavior

`runMigrations({ databaseUrl })` from `stripe-replit-sync` creates the stripe schema + tables via SQL migration files in the package's `dist/migrations/` directory. If it only creates an empty schema (no tables), credentials failed silently. Run it directly via `node -e "require('./node_modules/stripe-replit-sync').runMigrations({databaseUrl: process.env.DATABASE_URL}).then(...)"`

## syncBackfill requires account to be registered

`syncBackfill()` will silently skip syncing if `stripe.accounts` has no entry for this API key. The accounts entry is created on first `findOrCreateManagedWebhook()`. In dev, if this fails, insert products/prices directly via `_raw_data` as a workaround.
