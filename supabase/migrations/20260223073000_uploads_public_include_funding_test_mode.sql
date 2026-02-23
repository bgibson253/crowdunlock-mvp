-- In TEST MODE we need browse/detail to work for funding status.
-- The app reads from uploads_public view; extend it to include funding entries.

create or replace view public.uploads_public as
select
  id,
  title,
  ai_teaser,
  status,
  created_at,
  current_funded,
  funding_goal
from public.uploads
where status in ('unlocked', 'funding');
