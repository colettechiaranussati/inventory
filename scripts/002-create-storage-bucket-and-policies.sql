-- First, create the storage bucket (run this in Supabase dashboard or via API)
-- You can create it manually in the Supabase dashboard under Storage
-- Name it "product-photos" (with hyphen)
-- OR use the following if you have access to the Supabase CLI:
-- supabase storage create-bucket product-photos --public

-- Storage policies for product photos
-- Note: Make sure the 'product-photos' bucket exists before running these policies

-- Allow users to read their own photos
create policy "Users can read their photos"
  on storage.objects for select
  using (bucket_id = 'product-photos' and auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to upload photos
create policy "Users can upload photos"
  on storage.objects for insert
  with check (bucket_id = 'product-photos' and auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own photos
create policy "Users can delete their photos"
  on storage.objects for delete
  using (bucket_id = 'product-photos' and auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public access to read photos (if you want photos to be publicly viewable)
create policy "Public can view photos"
  on storage.objects for select
  using (bucket_id = 'product-photos');
