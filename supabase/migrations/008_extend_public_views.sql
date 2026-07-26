-- The agent profile public page and directory need columns
-- public_agent_contact (005) doesn't expose — bio, social links, cities
-- served, languages, listing counts, SEO fields. Rather than widen
-- public_agent_contact itself (which listing/project cards already depend
-- on staying a small, stable projection), this adds a second public view
-- purpose-built for the full profile page and directory.
--
-- `name`/`avatar_url` are exposed as flat columns (selected directly off
-- `users u`), not as an embedded `user:users(...)` relation — PostgREST
-- can't reliably auto-embed a real table through a view's join, and even if
-- it could, `users` RLS blocks anonymous reads of it directly, so an embed
-- would just come back null for every anonymous request anyway (same
-- reasoning as public_agent_contact's flat `name` column).
CREATE VIEW public_agent_profiles AS
  SELECT
    u.id AS user_id,
    u.name,
    u.avatar_url,
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
    ap.subscription_tier,
    ap.total_listings,
    ap.active_listings,
    ap.meta_title,
    ap.meta_desc,
    ap.og_image_url,
    ap.agency_id
  FROM users u
  JOIN agent_profiles ap ON ap.user_id = u.id
  WHERE u.is_active = true
  AND u.role IN ('agent', 'developer');

GRANT SELECT ON public_agent_profiles TO anon, authenticated;
