-- Include uploader profile fields in public browse listing.

create or replace view public.uploads_public as
select
  u.id,
  u.title,
  u.tags,
  u.ai_teaser,
  u.quality_score,
  u.status,
  u.funding_goal,
  u.current_funded,
  u.created_at,
  p.id as uploader_id,
  p.username as uploader_username,
  p.avatar_url as uploader_avatar_url
from public.uploads u
left join public.profiles p on p.id = u.uploader_id
where u.status in ('funding','unlocked');
