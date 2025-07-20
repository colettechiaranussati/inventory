-- Storage policies for product photos
-- Note: Create the 'product_photos' bucket manually in Supabase dashboard first

-- Allow users to read their own photos
create policy "Users can read their photos"
  on storage.objects for select
  using (bucket_id = 'product_photos' and auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to upload photos
create policy "Users can upload photos"
  on storage.objects for insert
  with check (bucket_id = 'product_photos' and auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own photos
create policy "Users can delete their photos"
  on storage.objects for delete
  using (bucket_id = 'product_photos' and auth.uid()::text = (storage.foldername(name))[1]);
