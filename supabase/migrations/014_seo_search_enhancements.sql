-- Gives phases a clean, crawlable slug ("phase-6") instead of forcing
-- society/phase-scoped search URLs to use raw UUIDs — matches every other
-- slugged entity in this schema (cities, areas, societies, listings...).
ALTER TABLE society_phases ADD COLUMN slug TEXT;
UPDATE society_phases
SET slug = lower(regexp_replace(regexp_replace(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL;
ALTER TABLE society_phases ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX idx_society_phases_society_slug ON society_phases(society_id, slug);

-- page_seo (001_schema.sql) has a fully built admin editor
-- (app/admin/seo/pages) but was never actually reachable from a public
-- page — RLS was disabled AND there was no grant for anon/authenticated,
-- same "infrastructure exists, nobody can read it" shape as several bugs
-- fixed earlier this session. Admin writes already go through the
-- service-role client (bypasses RLS regardless), so this only needs to add
-- public read access.
ALTER TABLE page_seo ENABLE ROW LEVEL SECURITY;
CREATE POLICY page_seo_public_read ON page_seo FOR SELECT USING (true);
CREATE POLICY page_seo_admin_all ON page_seo FOR ALL USING (is_admin());
GRANT SELECT ON page_seo TO anon, authenticated;
