-- Atomic counter increment for listings (views/calls/whatsapp/leads/saves),
-- called from app/api/listings/[id]/lead and .../view via the service-role
-- client.
--
-- Hardened beyond the original spec: `column_name` is checked against an
-- explicit allowlist before being used in dynamic SQL. Without that check,
-- SECURITY DEFINER + format('...%I...') safely quotes whatever identifier
-- it's given (no SQL-injection-via-syntax risk), but it does NOT restrict
-- *which* column gets targeted — and Supabase grants EXECUTE on new
-- functions to anon/authenticated by default, so this function is reachable
-- directly via PostgREST's /rpc/ endpoint, not just from the trusted API
-- route above it. Without the allowlist, anyone with the anon key could
-- call it with column_name: 'price' (or any other numeric column) and
-- silently increment arbitrary listing data. The REVOKE below closes the
-- same gap from the other direction: only the service role the Next.js API
-- routes already use needs to call this at all.
CREATE OR REPLACE FUNCTION increment_listing_counter(
  listing_id UUID,
  column_name TEXT
)
RETURNS void AS $$
BEGIN
  IF column_name NOT IN ('views_count', 'calls_count', 'whatsapp_count', 'leads_count', 'saves_count') THEN
    RAISE EXCEPTION 'Invalid column_name: %', column_name;
  END IF;

  EXECUTE format(
    'UPDATE listings SET %I = %I + 1 WHERE id = $1',
    column_name, column_name
  ) USING listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE EXECUTE ON FUNCTION increment_listing_counter(UUID, TEXT) FROM PUBLIC, anon, authenticated;
