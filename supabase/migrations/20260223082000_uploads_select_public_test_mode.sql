-- Allow public SELECT on uploads (needed for TEST MODE funding pages when requested unauthenticated)
-- NOTE: permissive for QA; tighten before launch.

drop policy if exists "uploads_select_public" on public.uploads;

create policy "uploads_select_public"
on public.uploads
for select
to public
using (true);
