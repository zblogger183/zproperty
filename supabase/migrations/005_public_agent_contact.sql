-- Public-safe projection of agent contact info for listing/project cards.
-- `users` has RLS restricting SELECT to the row's own owner or an admin
-- (003_rls.sql), so anonymous visitors browsing listings need a way to see
-- an agent's name and WhatsApp number without that policy blocking them —
-- same pattern as the public_agent_profiles view for CNIC data.
CREATE VIEW public_agent_contact AS
  SELECT
    u.id,
    u.name,
    ap.whatsapp,
    ap.profile_slug,
    ap.headline,
    ap.experience_years,
    ap.specialties,
    ap.cnic_verified,
    ap.subscription_tier,
    ap.agency_id
  FROM users u
  JOIN agent_profiles ap ON ap.user_id = u.id
  WHERE u.is_active = true
  AND u.role IN ('agent', 'developer');

GRANT SELECT ON public_agent_contact TO anon, authenticated;
