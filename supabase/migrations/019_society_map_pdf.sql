-- Lets admins attach a downloadable master-plan PDF per society, shown
-- alongside the interactive map (built from societies.lat/lng, already
-- present) on the public area-guide page.
ALTER TABLE societies ADD COLUMN map_pdf_url TEXT;
