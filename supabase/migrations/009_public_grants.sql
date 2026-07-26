-- Fixes a site-wide gap: the anon/authenticated Postgres roles never
-- received a base GRANT SELECT on most tables (RLS policies restrict which
-- *rows* are visible, but Postgres also requires the underlying GRANT
-- before RLS is even evaluated). Every public page querying these tables
-- via lib/supabase/public.ts's anon-key client was getting a hard
-- "permission denied" error, not just an empty/filtered result.

-- ── SIMPLE PUBLIC TABLES (no draft/pending state to hide) ──────────────
GRANT SELECT ON cities, areas, societies, area_guides, blog_categories,
  forum_topics, forum_replies TO anon, authenticated;

-- USERS: already has users_select_own (auth.uid() = id OR is_admin()) —
-- anon has no auth.uid(), so this grant lets the embedded `user:users(name)`
-- joins used by the forum/blog pages execute at all; RLS still resolves
-- them to no rows (null) for anon/other-user reads, exactly as documented
-- in the forum pages ("returns null due to RLS, fall back to 'Member'").
GRANT SELECT ON users TO anon, authenticated;

-- LISTINGS / LISTING_IMAGES / AGENCIES already have RLS enabled with
-- correct public-read policies (see below in this file's history) — they
-- were just missing the base grant that makes those policies reachable.
GRANT SELECT ON listings, listing_images, agencies TO anon, authenticated;

-- ── PROJECTS: same "public read active only" shape as LISTINGS ─────────
-- Was missing RLS entirely, so a blanket grant here would have exposed
-- pending/rejected/paused projects (status_platform) to anyone querying
-- the REST API directly. Mirrors listings_public_read / listings_admin_all.
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY projects_public_read ON projects
  FOR SELECT USING (status_platform = 'active');

CREATE POLICY projects_admin_all ON projects
  FOR ALL USING (is_admin());

GRANT SELECT ON projects TO anon, authenticated;

-- PROJECT_IMAGES / PAYMENT_PLANS: follow project visibility, same pattern
-- as listing_images_public_read.
ALTER TABLE project_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY project_images_public_read ON project_images
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM projects WHERE id = project_id AND status_platform = 'active')
  );

CREATE POLICY project_images_admin_all ON project_images
  FOR ALL USING (is_admin());

CREATE POLICY payment_plans_public_read ON payment_plans
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM projects WHERE id = project_id AND status_platform = 'active')
  );

CREATE POLICY payment_plans_admin_all ON payment_plans
  FOR ALL USING (is_admin());

GRANT SELECT ON project_images, payment_plans TO anon, authenticated;

-- ── BLOG_POSTS: same "public read published only" shape ────────────────
-- Was missing RLS entirely, so a blanket grant would have exposed drafts.
-- Blog is admin/CMS-managed only (writes go through the service-role
-- admin client, which bypasses RLS) — no author-side write policy needed.
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY blog_posts_public_read ON blog_posts
  FOR SELECT USING (status = 'published');

CREATE POLICY blog_posts_admin_all ON blog_posts
  FOR ALL USING (is_admin());

GRANT SELECT ON blog_posts TO anon, authenticated;
