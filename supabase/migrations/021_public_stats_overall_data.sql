-- get_public_stats() (SECURITY DEFINER RPC backing the homepage/About-page
-- StatsBar and HeroSection, lib/stats.ts) was live in the database with no
-- matching migration file anywhere in this repo — captured here for the
-- first time, and corrected in the same pass.
--
-- The homepage was showing "1 Listing · 5 Agents · 1 City", which read as
-- broken even though the site has 63 active projects across 4 cities and
-- 16 societies. Root cause, two separate bugs stacked:
--
-- 1) listings_count only counted the `listings` table (individual
--    owner/agent listings, still a thin dataset per CLAUDE.md) and ignored
--    `projects` (developer project inventory, the bulk of the site's real
--    content at 63 active rows) entirely.
-- 2) cities_count was `count(*) FROM cities WHERE listing_count > 0` —
--    cities.listing_count is a plain `INTEGER DEFAULT 0` column
--    (001_schema.sql) that no trigger or function anywhere in this repo
--    ever increments, so it's a dead counter frozen near its seed value,
--    not a live reflection of where the site actually has listings,
--    projects, or societies.
--
-- Fix: listings_count now sums active listings + active projects (both are
-- inventory a visitor can browse and enquire on); cities_count is now a
-- live count of distinct cities with at least one active listing, active
-- project, or society, instead of the stale stored column. Output shape
-- (listings_count, agents_count, cities_count, users_count) is unchanged
-- so lib/stats.ts needs no changes.
CREATE OR REPLACE FUNCTION public.get_public_stats()
 RETURNS TABLE(listings_count bigint, agents_count bigint, cities_count bigint, users_count bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    (SELECT count(*) FROM listings WHERE status = 'active')
      + (SELECT count(*) FROM projects WHERE status_platform = 'active'),
    (SELECT count(*) FROM users WHERE role = 'agent'),
    (SELECT count(*) FROM (
        SELECT city_id FROM listings WHERE status = 'active' AND city_id IS NOT NULL
        UNION
        SELECT city_id FROM projects WHERE status_platform = 'active' AND city_id IS NOT NULL
        UNION
        SELECT city_id FROM societies WHERE city_id IS NOT NULL
      ) AS active_cities),
    (SELECT count(*) FROM users);
$function$;
