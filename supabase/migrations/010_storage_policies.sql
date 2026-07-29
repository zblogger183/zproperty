-- Both buckets already exist in the live project (created 2026-07-23,
-- confirmed via storage.listBuckets()) — these INSERTs are no-ops there,
-- kept only so a fresh environment (a new Supabase project, local dev)
-- ends up with the same setup. The actual gap this migration closes is
-- that neither bucket had ANY storage.objects RLS policy defined anywhere
-- (checked: no prior migration touches storage.objects/storage.buckets at
-- all) — harmless today only because both upload routes write through the
-- service-role admin client, which bypasses RLS regardless.

INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('private-documents', 'private-documents', false)
ON CONFLICT (id) DO NOTHING;

-- DROP + CREATE rather than a bare CREATE so this migration is safe to
-- re-run against a project where these policy names already exist (e.g.
-- created by hand via the dashboard when the buckets themselves were set up).
DROP POLICY IF EXISTS "Authenticated users can upload media" ON storage.objects;
CREATE POLICY "Authenticated users can upload media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media');

DROP POLICY IF EXISTS "Anyone can view media" ON storage.objects;
CREATE POLICY "Anyone can view media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'media');

DROP POLICY IF EXISTS "Users can delete own media" ON storage.objects;
CREATE POLICY "Users can delete own media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'media' AND owner = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'private-documents');

DROP POLICY IF EXISTS "Only admins can view private documents" ON storage.objects;
CREATE POLICY "Only admins can view private documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'private-documents'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);
