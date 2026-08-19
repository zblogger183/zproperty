-- Short-term (daily/weekly) vs long-term (monthly) rental listings weren't
-- distinguished at all before this — every "rent" listing was implicitly
-- monthly. Defaults every existing row (including "buy" listings, where the
-- column is simply unused) to 'monthly' so this is a fully additive,
-- backward-compatible change with no backfill step needed.
ALTER TABLE listings
  ADD COLUMN rental_period TEXT NOT NULL DEFAULT 'monthly'
  CHECK (rental_period IN ('monthly', 'weekly', 'daily'));
