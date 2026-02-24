-- Allow authenticated users to upload avatars into uploads bucket under avatars/<uid>.*

-- Note: uploads bucket already exists.

-- Allow reads (already handled elsewhere for unlocked content; this is simple public read for avatars)
-- We rely on filenames being unguessable? Here it's user-id based, so we must allow read.
-- If you want private avatars later, switch to signed URLs.

-- Users can insert/update their own avatar objects.

drop policy if exists "avatars_insert_own" on storage.objects;
drop policy if exists "avatars_update_own" on storage.objects;
drop policy if exists "avatars_read_public" on storage.objects;

create policy "avatars_read_public"
on storage.objects
for select
to public
using (bucket_id = 'uploads' and name like 'avatars/%');

create policy "avatars_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'uploads'
  and name like ('avatars/' || auth.uid()::text || '%')
);

create policy "avatars_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'uploads'
  and name like ('avatars/' || auth.uid()::text || '%')
)
with check (
  bucket_id = 'uploads'
  and name like ('avatars/' || auth.uid()::text || '%')
);
