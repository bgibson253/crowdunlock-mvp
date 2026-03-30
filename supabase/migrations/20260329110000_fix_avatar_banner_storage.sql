-- Fix storage policies: support avatar + banner uploads with timestamped filenames

-- Drop old restrictive policies
drop policy if exists "avatars_insert_own" on storage.objects;
drop policy if exists "avatars_update_own" on storage.objects;
drop policy if exists "avatars_read_public" on storage.objects;

-- Read: anyone can read avatars and banners (they're public profile images)
create policy "profile_images_read_public"
on storage.objects
for select
to public
using (
  bucket_id = 'uploads'
  and (name like 'avatars/%' or name like 'banners/%')
);

-- Insert: authenticated users can upload their own avatar/banner
create policy "profile_images_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'uploads'
  and (
    name like ('avatars/' || auth.uid()::text || '%')
    or name like ('banners/' || auth.uid()::text || '%')
  )
);

-- Update (upsert): authenticated users can update their own avatar/banner
create policy "profile_images_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'uploads'
  and (
    name like ('avatars/' || auth.uid()::text || '%')
    or name like ('banners/' || auth.uid()::text || '%')
  )
)
with check (
  bucket_id = 'uploads'
  and (
    name like ('avatars/' || auth.uid()::text || '%')
    or name like ('banners/' || auth.uid()::text || '%')
  )
);
