-- Human-readable Property ID for support/admin reference and search,
-- distinct from the internal UUID primary key — starts at 100001 so early
-- listings don't look suspiciously like "the first ever" (matches the
-- convention real estate portals like zameen.com use).
CREATE SEQUENCE listing_number_seq START WITH 100001;
ALTER TABLE listings ADD COLUMN listing_number BIGINT UNIQUE DEFAULT nextval('listing_number_seq');
ALTER TABLE listings ALTER COLUMN listing_number SET NOT NULL;
ALTER SEQUENCE listing_number_seq OWNED BY listings.listing_number;
