-- Keep uploads_public columns stable; just ensure funding + unlocked are included.

create or replace view public.uploads_public as
select
  id,
  title,
  tags,
  ai_teaser,
  quality_score,
  status,
  funding_goal,
  current_funded,
  created_at
from public.uploads
where status in ('funding','unlocked');
