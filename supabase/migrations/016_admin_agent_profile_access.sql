-- Admins/super_admins can now own listings directly (auto-approved, see
-- app/api/listings/route.ts), so they need the same public agent-profile
-- and contact-card support agents/developers already get.
CREATE OR REPLACE VIEW public_agent_profiles AS
 SELECT ap.id,
    ap.user_id,
    ap.profile_slug,
    ap.headline,
    ap.bio,
    ap.experience_years,
    ap.specialties,
    ap.cities_served,
    ap.languages,
    ap.whatsapp,
    ap.facebook_url,
    ap.instagram_url,
    ap.youtube_url,
    ap.cnic_verified,
    ap.agency_id,
    ap.total_listings,
    ap.active_listings,
    ap.meta_title,
    ap.meta_desc,
    ap.og_image_url,
    ap.created_at,
    u.name,
    u.avatar_url,
    ap.subscription_tier
   FROM agent_profiles ap
     JOIN users u ON u.id = ap.user_id
  WHERE u.is_active = true AND u.role = ANY (ARRAY['agent'::text, 'developer'::text, 'admin'::text, 'super_admin'::text]);

CREATE OR REPLACE VIEW public_agent_contact AS
 SELECT u.id,
    u.name,
    ap.whatsapp,
    ap.profile_slug,
    ap.headline,
    ap.experience_years,
    ap.specialties,
    ap.cnic_verified,
    ap.subscription_tier,
    ap.agency_id,
    u.phone
   FROM users u
     JOIN agent_profiles ap ON ap.user_id = u.id
  WHERE u.is_active = true AND u.role = ANY (ARRAY['agent'::text, 'developer'::text, 'admin'::text, 'super_admin'::text]);

-- Fix the orphaned agent_profiles row for the existing super_admin account
-- (already owns a real listing) — its user_id was never set, which is what
-- made /agents/zohaib-meo 404: the view's JOIN on ap.user_id = u.id never
-- matched anything.
UPDATE agent_profiles
SET user_id = '22750a9d-9573-4d4d-9b48-6c60d4b2fcf7', total_listings = 1, active_listings = 1
WHERE profile_slug = 'zohaib-meo' AND user_id IS NULL;
