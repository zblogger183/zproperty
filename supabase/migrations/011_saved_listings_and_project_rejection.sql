-- Buyer "save listing" (bookmark) feature — no existing table backed this;
-- listings.saves_count was only ever a counter, never a record of which
-- listings a given buyer saved.
create table if not exists public.saved_listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, listing_id)
);

create index if not exists saved_listings_user_id_idx on public.saved_listings (user_id);
create index if not exists saved_listings_listing_id_idx on public.saved_listings (listing_id);

alter table public.saved_listings enable row level security;

drop policy if exists "Users manage their own saved listings" on public.saved_listings;
create policy "Users manage their own saved listings"
  on public.saved_listings
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Projects moderation mirrors listings (approve/reject), but the table
-- never grew a reject_reason column the way listings did.
alter table public.projects add column if not exists reject_reason text;
