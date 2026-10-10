-- Public-safe projection of developer contact info for the project detail
-- page. `users` has RLS restricting SELECT to the row's own owner or an
-- admin (003_rls.sql), so the project page was fetching a project's
-- developer name/phone via the admin (service_role) client instead -- a
-- second, separate Supabase round trip per page render, each one its own
-- cached KV entry under Workers KV (contributing to the Free plan's
-- 1,000-write/day cap). This view lets that lookup be embedded directly
-- into the project's own query instead, same pattern as public_agent_contact
-- for listings/agent cards.
CREATE VIEW public_developer_contact AS
  SELECT
    u.id,
    u.name,
    u.phone
  FROM users u
  WHERE u.is_active = true
  AND u.role = 'developer';

GRANT SELECT ON public_developer_contact TO anon, authenticated;
