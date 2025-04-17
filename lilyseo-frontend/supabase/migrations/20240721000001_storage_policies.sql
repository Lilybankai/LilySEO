-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('useruploads', 'useruploads', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Set up policies for the useruploads bucket
-- Allow users to upload their own files
CREATE POLICY "Allow users to upload their own files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'useruploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to update their own files
CREATE POLICY "Allow users to update their own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'useruploads' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'useruploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own files
CREATE POLICY "Allow users to delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'useruploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access to files
CREATE POLICY "Allow public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'useruploads'); 