-- Check if product-photos bucket exists, if not create it
DO $$
BEGIN
    -- Try to insert the bucket, ignore if it already exists
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
        'product-photos',
        'product-photos', 
        true,
        5242880, -- 5MB limit
        ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- Ensure the bucket is public and has correct settings
    UPDATE storage.buckets 
    SET 
        public = true,
        file_size_limit = 5242880,
        allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    WHERE id = 'product-photos';
    
    RAISE NOTICE 'Storage bucket product-photos configured successfully';
END $$;

-- Recreate storage policies to ensure they're correct
DROP POLICY IF EXISTS "Users can read their photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view photos" ON storage.objects;

-- Create comprehensive storage policies
CREATE POLICY "Users can read their photos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'product-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload photos"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'product-photos' 
        AND auth.uid()::text = (storage.foldername(name))[1]
        AND (storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp', 'gif')
    );

CREATE POLICY "Users can update their photos"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'product-photos' AND auth.uid()::text = (storage.foldername(name))[1])
    WITH CHECK (bucket_id = 'product-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their photos"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'product-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public access to read photos (for displaying images)
CREATE POLICY "Public can view photos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'product-photos');

-- Ensure proper permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;
GRANT SELECT ON storage.objects TO anon;

-- Verify the setup
SELECT 
    'Bucket exists: ' || CASE WHEN EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'product-photos') THEN 'YES' ELSE 'NO' END as bucket_status,
    'Policies count: ' || COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE '%photo%';
