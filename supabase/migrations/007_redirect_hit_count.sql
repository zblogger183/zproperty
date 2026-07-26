-- Atomic hit-count increment for redirects, called from proxy.ts (via the
-- service-role client) whenever a request matches an active redirect. Kept
-- as a DB-side increment rather than a read-then-write from the middleware
-- to avoid lost updates under concurrent requests to the same redirect.
CREATE OR REPLACE FUNCTION increment_hit_count(
  redirect_path TEXT
)
RETURNS void AS $$
  UPDATE redirects
  SET hit_count = hit_count + 1
  WHERE from_path = redirect_path;
$$ LANGUAGE sql SECURITY DEFINER;

-- Supabase grants EXECUTE on new functions to anon/authenticated by
-- default, which would let anyone with the anon key increment arbitrary
-- redirect hit counts directly via PostgREST's /rpc/ endpoint. Only the
-- service role proxy.ts already uses needs to call this.
REVOKE EXECUTE ON FUNCTION increment_hit_count FROM PUBLIC, anon, authenticated;
