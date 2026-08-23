-- 017_listing_number.sql created listing_number_seq but never granted
-- USAGE on it to any role. A sequence's privileges are independent of the
-- table's — GRANTing INSERT on listings (or having RLS allow the insert)
-- does nothing for a DEFAULT nextval('listing_number_seq') expression,
-- which still needs its own USAGE grant to run. Without this, every
-- listing insert failed with "permission denied for sequence
-- listing_number_seq", including from the service-role admin client used
-- by app/api/listings/route.ts, since service_role has no blanket
-- privilege on objects created without an explicit grant either.
GRANT USAGE, SELECT ON SEQUENCE listing_number_seq TO anon, authenticated, service_role;
