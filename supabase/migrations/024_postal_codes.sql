-- Postal/zip code guide: /zip-codes, /zip-codes/[province], /zip-codes/[city], /zip-codes/[city]/[locality]
-- area_id is nullable and locality_name is separate from areas.name because postal codes don't map
-- 1:1 onto the areas already catalogued -- one area can span several codes, and many codes cover a
-- GPO/institutional delivery zone (e.g. "Lahore P&T Audit") that isn't a real-estate-searchable
-- neighborhood at all. area_id is set only when a clean match to an existing areas row exists.
CREATE TABLE postal_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL,
  city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  area_id UUID REFERENCES areas(id) ON DELETE SET NULL,
  locality_name TEXT NOT NULL,
  post_office_name TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_postal_codes_city_id ON postal_codes(city_id);
CREATE INDEX idx_postal_codes_area_id ON postal_codes(area_id);
CREATE INDEX idx_postal_codes_code ON postal_codes(code);

ALTER TABLE postal_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Postal codes are publicly readable"
  ON postal_codes FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage postal codes"
  ON postal_codes FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

GRANT SELECT ON postal_codes TO anon, authenticated;
GRANT ALL ON postal_codes TO service_role;
