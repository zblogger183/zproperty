-- Per-listing contact override: lets a listing show a real Call/WhatsApp
-- number independent of a full registered agent account — either entered by
-- whoever creates the listing on behalf of a plot owner, or by an agent
-- overriding their own profile default for one specific listing.
ALTER TABLE listings ADD COLUMN contact_phone TEXT;
ALTER TABLE listings ADD COLUMN contact_whatsapp TEXT;

-- Expose the agent's real phone number (separate from their WhatsApp
-- business number) so the public listing page can offer a genuine Call
-- button instead of silently reusing the WhatsApp number for it.
-- `phone` is appended at the end — CREATE OR REPLACE VIEW can't reorder or
-- rename existing output columns, only append new ones.
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
  WHERE u.is_active = true AND u.role = ANY (ARRAY['agent'::text, 'developer'::text]);
