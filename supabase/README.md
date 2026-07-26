# Supabase Database Setup

## Run migrations in this order

1. Go to https://supabase.com → your project → SQL Editor
2. Run each file in order:
   - `migrations/001_schema.sql` (creates all tables, checks, and triggers)
   - `migrations/002_indexes.sql` (performance indexes + full-text search)
   - `migrations/003_rls.sql` (Row Level Security policies)
   - `migrations/004_developer_profiles.sql` (developer profile table + RLS —
     registration needs somewhere to store company name/city/website for the
     `developer` role, which 001 didn't include)
   - `migrations/005_public_agent_contact.sql` (public view exposing an
     agent's name/WhatsApp/profile slug — listing and project cards need
     this since `users` RLS blocks anonymous reads of the base table)
   - `migrations/006_rpc_functions.sql` (`increment_listing_counter` —
     atomic view/call/WhatsApp/lead counters for the listing detail page,
     called via the service-role client from `app/api/listings/[id]/lead`
     and `.../view`. EXECUTE is revoked from anon/authenticated: this
     function isn't meant to be called directly from the browser)
   - `seed.sql` (starter data: plans, cities, areas, settings)

If you're using the Supabase CLI instead of the dashboard:

```bash
npx supabase link --project-ref <your-project-ref>
npx supabase db push
npx supabase db execute -f supabase/seed.sql
```

`db push` applies everything under `migrations/` in filename order, so the
`001_`/`002_`/`003_` prefixes are load-bearing — don't reorder or rename them
once they've been applied to a shared environment.

## PostGIS

`001_schema.sql` already runs `CREATE EXTENSION IF NOT EXISTS postgis;` as its
first statement, so no separate step is needed. If you ever run the listings
table creation in isolation, make sure that extension line runs first —
`listings.location_point` is a `GEOMETRY` column and will fail to create
without it.

## Storage buckets

After running the migrations:

**Private bucket for CNIC images**
1. Storage → Create bucket
2. Name: `private-documents`
3. Public: **OFF**
4. Stores agent CNIC front/back images (`agent_profiles.cnic_front_url` /
   `cnic_back_url`). Only service-role code should read from this bucket —
   never sign public URLs for it.

**Public bucket for media**
1. Storage → Create bucket
2. Name: `media`
3. Public: **ON**
4. Stores listing images, blog images, project galleries, etc.

## Security notes on `003_rls.sql`

Two adjustments from a straight table-by-table RLS pass, both required for
the schema to be safe/functional as designed:

- **`agent_profiles`** stores `cnic_number`, `cnic_front_url`, and
  `cnic_back_url` directly on the row. A `USING (true)` public SELECT policy
  on that table would serve Pakistani national ID numbers and ID scans to
  anyone with the anon key. Instead, the base table is owner/admin-only, and
  a `public_agent_profiles` view exposes just the safe columns (headline,
  bio, socials, listing counts, etc.) to `anon`/`authenticated`. Query that
  view — not `agent_profiles` — from public agent pages (`/agents/[slug]`).
- **`agencies`** has RLS enabled with a public read policy scoped to
  `is_active = true` plus an owner/admin manage policy. Enabling RLS with
  zero policies denies all access to every role except the table owner,
  which would have silently broken `/agencies/[slug]` and the agents
  directory.
- **`public_agent_contact`** (added in `005_public_agent_contact.sql`) is
  the same pattern applied to agent name/WhatsApp for listing and project
  cards — `users` RLS blocks anonymous reads of the base table, so cards
  join this view instead. One difference from `public_agent_profiles`:
  this view joins `users` to `agent_profiles`, whereas `public_agent_profiles`
  is a simple single-table projection. PostgREST auto-detects embedded
  relationships (e.g. `listings.select('agent:public_agent_contact(...)')`)
  reliably for simple views, but its support for views built on a join is
  less certain. **Verify this specific embed resolves once real credentials
  are connected** — if PostgREST doesn't infer the relationship, fetch
  listings and agent contacts as two queries and merge them in application
  code instead.

Beyond those two tables, this migration only turns on RLS for tables holding
per-user or per-agent data (users, listings, leads, subscriptions, payments,
notifications, alerts, listing images). Tables meant to be openly readable
site content — `cities`, `areas`, `societies`, `projects`, `blog_posts`,
`subscription_plans`, `boost_packages`, `forum_topics`/`forum_replies` — are
left without RLS, relying on Supabase's default schema grants.

Internal/admin-only tables (`settings`, `redirects`, `page_seo`,
`white_label_clients`, `dm_clients`, `dm_monthly_reports`, `media_library`)
are **not** RLS-protected in this migration either, since the original spec
didn't call for it. Nothing in the app currently writes to them from a
browser client — API routes and the admin dashboard should go through
`lib/supabase/admin.ts` (the service-role client) rather than the anon key.
But if any of them ever get queried directly with the anon/authenticated
key, run `npx supabase db lint` first and add explicit admin-only policies —
otherwise those tables are wide open to anyone holding the anon key.

## Environment variables

After running the migrations, copy your project's keys into `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Regenerating TypeScript types

Once the schema is live, regenerate `types/database.ts` so the app has real
table types instead of the placeholder:

```bash
npx supabase gen types typescript --project-id <your-project-ref> > types/database.ts
```
