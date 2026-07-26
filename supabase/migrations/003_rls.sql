-- Enable RLS on all sensitive tables
ALTER TABLE users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE agencies           ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_images     ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads              ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_notes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities    ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_alerts    ENABLE ROW LEVEL SECURITY;

-- ADMIN CHECK HELPER
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('admin','super_admin')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- USERS: own record only
CREATE POLICY users_select_own ON users
  FOR SELECT USING (auth.uid() = id OR is_admin());

CREATE POLICY users_update_own ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY users_admin_all ON users
  FOR ALL USING (is_admin());

-- AGENT PROFILES: base table holds CNIC number + CNIC image URLs, so it is
-- owner/admin only. Public agent pages read through the `public_agent_profiles`
-- view below instead of this table directly.
CREATE POLICY agent_profiles_select_own ON agent_profiles
  FOR SELECT USING (auth.uid() = user_id OR is_admin());

CREATE POLICY agent_profiles_insert ON agent_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY agent_profiles_update ON agent_profiles
  FOR UPDATE USING (auth.uid() = user_id OR is_admin());

-- Safe, public-facing projection of agent_profiles: excludes cnic_number,
-- cnic_front_url, cnic_back_url, cnic_verified_by. Owned by the migration
-- role, so it reads through RLS on the base table once and exposes only
-- the columns listed here to anon/authenticated callers.
CREATE VIEW public_agent_profiles AS
SELECT
  id,
  user_id,
  profile_slug,
  headline,
  bio,
  experience_years,
  specialties,
  cities_served,
  languages,
  whatsapp,
  facebook_url,
  instagram_url,
  youtube_url,
  cnic_verified,
  agency_id,
  total_listings,
  active_listings,
  meta_title,
  meta_desc,
  og_image_url,
  created_at
FROM agent_profiles;

GRANT SELECT ON public_agent_profiles TO anon, authenticated;

-- AGENCIES: public read for active agencies (directory + profile pages),
-- owner/admin manage. No policy at all + RLS enabled would lock every
-- row from anon/authenticated, breaking /agencies/[slug].
CREATE POLICY agencies_public_read ON agencies
  FOR SELECT USING (is_active = true);

CREATE POLICY agencies_owner_manage ON agencies
  FOR ALL USING (auth.uid() = owner_id OR is_admin());

-- LISTINGS: public read active only; agents CRUD own; admin all
CREATE POLICY listings_public_read ON listings
  FOR SELECT USING (status = 'active');

CREATE POLICY listings_agent_select_own ON listings
  FOR SELECT USING (auth.uid() = agent_id);

CREATE POLICY listings_agent_insert ON listings
  FOR INSERT WITH CHECK (auth.uid() = agent_id);

CREATE POLICY listings_agent_update ON listings
  FOR UPDATE USING (auth.uid() = agent_id AND status NOT IN ('active'));

CREATE POLICY listings_admin_all ON listings
  FOR ALL USING (is_admin());

-- LISTING IMAGES: follow listing ownership
CREATE POLICY listing_images_public_read ON listing_images
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND status = 'active')
  );

CREATE POLICY listing_images_agent_manage ON listing_images
  FOR ALL USING (
    EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND agent_id = auth.uid())
  );

CREATE POLICY listing_images_admin_all ON listing_images
  FOR ALL USING (is_admin());

-- LEADS: only receiving agent / developer / admin
CREATE POLICY leads_agent_own ON leads
  FOR ALL USING (
    auth.uid() = agent_id
    OR auth.uid() = developer_id
    OR is_admin()
  );

-- LEAD NOTES / ACTIVITIES: follow lead access
CREATE POLICY lead_notes_access ON lead_notes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM leads
      WHERE id = lead_id
      AND (agent_id = auth.uid() OR developer_id = auth.uid())
    ) OR is_admin()
  );

CREATE POLICY lead_activities_access ON lead_activities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM leads
      WHERE id = lead_id
      AND (agent_id = auth.uid() OR developer_id = auth.uid())
    ) OR is_admin()
  );

-- SUBSCRIPTIONS: own only
CREATE POLICY subscriptions_own ON subscriptions
  FOR ALL USING (auth.uid() = user_id OR is_admin());

-- PAYMENT TRANSACTIONS: own only
CREATE POLICY payments_own ON payment_transactions
  FOR ALL USING (auth.uid() = user_id OR is_admin());

-- NOTIFICATIONS: own only
CREATE POLICY notifs_own ON notifications
  FOR ALL USING (auth.uid() = user_id);

-- PROPERTY ALERTS: own only
CREATE POLICY alerts_own ON property_alerts
  FOR ALL USING (auth.uid() = user_id);
