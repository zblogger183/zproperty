-- Security hardening pass (QA audit, 2026-08-12).
--
-- 1) CRITICAL: users_update_own (003_rls.sql) has USING (auth.uid() = id) and
--    no WITH CHECK, so a self-UPDATE is allowed to write ANY column,
--    including `role`. Verified live and exploitable: a freshly-registered
--    buyer could PATCH /rest/v1/users?id=eq.<self> with {"role":"super_admin"}
--    and it succeeded. Since is_admin() (003_rls.sql) reads role straight off
--    this table, that one gap made every is_admin()-gated policy and page in
--    the app forgeable by any signed-up user. Same shape of bug exists on
--    agent_profiles (cnic_verified / subscription_tier / stats) and agencies
--    (is_verified / subscription_tier / stats) via their own owner-manage
--    policies, which also lack a WITH CHECK.
--
--    Fixed with a trigger rather than tightening WITH CHECK, because the
--    UPDATE policies are also used by legitimate owner self-edits (name,
--    profile fields, agency description, etc.) — the trigger surgically
--    freezes only the privileged columns back to their old value unless the
--    request is running as admin or the service-role key, everything else
--    an owner is allowed to touch keeps working unchanged.
--
-- 2) media_library has full INSERT/UPDATE/DELETE grants to `authenticated`
--    (009_public_grants.sql never touched it) with RLS disabled — any signed
--    in user, not just admins, could write to the CMS media library via the
--    REST API directly. Locked to admin-only.
--
-- 3) cities/areas/societies/blog_categories/area_guides/forum_topics/
--    forum_replies: RLS disabled entirely (flagged by Supabase's own
--    advisor). In practice these only ever had a SELECT grant (009), so
--    today's exposure is "fully public read, no filtering" — acceptable for
--    genuinely public reference data — but a disabled-RLS table has zero
--    protection against any INSERT/UPDATE/DELETE grant added later by
--    accident. Enabling RLS with an explicit public-read policy costs
--    nothing today and closes that door permanently.
--
-- 4) is_admin() / update_updated_at() / increment_hit_count() /
--    increment_listing_counter() had a mutable search_path (advisor WARN) —
--    pinned to `public` so a session-level search_path change can't redirect
--    them to a spoofed function/table in another schema.

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Freeze privileged columns against self-edit
-- ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION protect_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF is_admin() OR auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF TG_TABLE_NAME = 'users' THEN
    NEW.role := OLD.role;
    NEW.is_active := OLD.is_active;
    NEW.email_verified := OLD.email_verified;
    NEW.phone_verified := OLD.phone_verified;
  ELSIF TG_TABLE_NAME = 'agent_profiles' THEN
    NEW.cnic_verified := OLD.cnic_verified;
    NEW.cnic_verified_at := OLD.cnic_verified_at;
    NEW.cnic_verified_by := OLD.cnic_verified_by;
    NEW.subscription_tier := OLD.subscription_tier;
    NEW.subscription_end := OLD.subscription_end;
    NEW.total_listings := OLD.total_listings;
    NEW.active_listings := OLD.active_listings;
    NEW.total_leads := OLD.total_leads;
  ELSIF TG_TABLE_NAME = 'agencies' THEN
    NEW.is_verified := OLD.is_verified;
    NEW.subscription_tier := OLD.subscription_tier;
    NEW.subscription_end := OLD.subscription_end;
    NEW.total_agents := OLD.total_agents;
    NEW.total_listings := OLD.total_listings;
  ELSIF TG_TABLE_NAME = 'listings' THEN
    -- Belt-and-suspenders on top of listings_agent_update's existing
    -- "status <> active" WITH-CHECK-via-USING behavior: also freezes the
    -- promo/stat columns an agent has no legitimate direct-write reason to
    -- touch (those come from admin boosts / server-tracked counters).
    NEW.status := OLD.status;
    NEW.is_featured := OLD.is_featured;
    NEW.is_hot_deal := OLD.is_hot_deal;
    NEW.is_top_search := OLD.is_top_search;
    NEW.featured_until := OLD.featured_until;
    NEW.hot_deal_until := OLD.hot_deal_until;
    NEW.views_count := OLD.views_count;
    NEW.calls_count := OLD.calls_count;
    NEW.whatsapp_count := OLD.whatsapp_count;
    NEW.leads_count := OLD.leads_count;
    NEW.saves_count := OLD.saves_count;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_users_protect_privileged ON users;
CREATE TRIGGER trg_users_protect_privileged
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION protect_privileged_columns();

DROP TRIGGER IF EXISTS trg_agent_profiles_protect_privileged ON agent_profiles;
CREATE TRIGGER trg_agent_profiles_protect_privileged
  BEFORE UPDATE ON agent_profiles
  FOR EACH ROW EXECUTE FUNCTION protect_privileged_columns();

DROP TRIGGER IF EXISTS trg_agencies_protect_privileged ON agencies;
CREATE TRIGGER trg_agencies_protect_privileged
  BEFORE UPDATE ON agencies
  FOR EACH ROW EXECUTE FUNCTION protect_privileged_columns();

DROP TRIGGER IF EXISTS trg_listings_protect_privileged ON listings;
CREATE TRIGGER trg_listings_protect_privileged
  BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION protect_privileged_columns();

-- ─────────────────────────────────────────────────────────────────────────
-- 2. Lock media_library to admin-only (was fully open to `authenticated`)
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE media_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY media_library_admin_all ON media_library
  FOR ALL USING (is_admin());

-- ─────────────────────────────────────────────────────────────────────────
-- 3. Enable RLS on the remaining public-reference tables
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE cities          ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas           ENABLE ROW LEVEL SECURITY;
ALTER TABLE societies       ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE area_guides     ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_topics    ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_replies   ENABLE ROW LEVEL SECURITY;

CREATE POLICY cities_public_read          ON cities          FOR SELECT USING (true);
CREATE POLICY cities_admin_write          ON cities          FOR ALL    USING (is_admin());
CREATE POLICY areas_public_read           ON areas           FOR SELECT USING (true);
CREATE POLICY areas_admin_write           ON areas           FOR ALL    USING (is_admin());
CREATE POLICY societies_public_read       ON societies       FOR SELECT USING (true);
CREATE POLICY societies_admin_write       ON societies       FOR ALL    USING (is_admin());
CREATE POLICY blog_categories_public_read ON blog_categories FOR SELECT USING (true);
CREATE POLICY blog_categories_admin_write ON blog_categories FOR ALL    USING (is_admin());
CREATE POLICY area_guides_public_read     ON area_guides     FOR SELECT USING (true);
CREATE POLICY area_guides_admin_write     ON area_guides     FOR ALL    USING (is_admin());

-- Forum: public read, own-row write for authenticated users (topics/replies
-- currently have no INSERT grant at all, so this also unblocks the intended
-- "authenticated users can post" behavior rather than just formalizing a
-- read-only state).
CREATE POLICY forum_topics_public_read  ON forum_topics  FOR SELECT USING (true);
CREATE POLICY forum_topics_own_insert   ON forum_topics  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY forum_topics_own_update   ON forum_topics  FOR UPDATE USING (auth.uid() = user_id OR is_admin());
CREATE POLICY forum_topics_own_delete   ON forum_topics  FOR DELETE USING (auth.uid() = user_id OR is_admin());

CREATE POLICY forum_replies_public_read ON forum_replies FOR SELECT USING (true);
CREATE POLICY forum_replies_own_insert  ON forum_replies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY forum_replies_own_update  ON forum_replies FOR UPDATE USING (auth.uid() = user_id OR is_admin());
CREATE POLICY forum_replies_own_delete  ON forum_replies FOR DELETE USING (auth.uid() = user_id OR is_admin());

GRANT INSERT, UPDATE, DELETE ON forum_topics, forum_replies TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- 4. Pin search_path on flagged functions
-- ─────────────────────────────────────────────────────────────────────────

ALTER FUNCTION is_admin() SET search_path = public;
ALTER FUNCTION update_updated_at() SET search_path = public;
ALTER FUNCTION increment_hit_count(text) SET search_path = public;
ALTER FUNCTION increment_listing_counter(uuid, text) SET search_path = public;
