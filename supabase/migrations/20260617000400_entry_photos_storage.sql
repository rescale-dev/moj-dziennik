-- Prywatny bucket na zdjęcia wpisów + polityka RLS na storage.objects:
-- użytkownik zarządza wyłącznie plikami w swoim folderze ({auth.uid()}/...).
INSERT INTO storage.buckets (id, name, public)
VALUES ('entry-photos', 'entry-photos', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can manage own photos" ON storage.objects;
CREATE POLICY "Users can manage own photos"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'entry-photos'
  AND (auth.uid())::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'entry-photos'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);
