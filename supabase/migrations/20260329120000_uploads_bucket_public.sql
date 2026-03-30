-- Make uploads bucket public so getPublicUrl works for avatars/banners
-- (RLS policies still control who can write; reads are gated by path-based policies)
update storage.buckets set public = true where id = 'uploads';
