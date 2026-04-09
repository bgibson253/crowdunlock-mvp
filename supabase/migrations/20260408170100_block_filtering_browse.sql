-- Block filtering for browse_uploads RPC and grants for rate_limit RPCs

-- ══════════════════════════════════════════════
-- 1. Update browse_uploads to accept caller_id and filter out blocked users
-- ══════════════════════════════════════════════

create or replace function public.browse_uploads(
  p_category_slug text default null,
  p_tag text default null,
  p_sort text default 'newest',
  p_limit integer default 12,
  p_offset integer default 0,
  p_caller_id uuid default null
)
returns table (
  id uuid,
  title text,
  tags text[],
  ai_teaser text,
  quality_score integer,
  status text,
  funding_goal integer,
  current_funded integer,
  view_count integer,
  created_at timestamptz,
  category_id uuid,
  category_name text,
  category_slug text,
  category_icon text,
  uploader_id uuid,
  uploader_username text,
  uploader_avatar_url text,
  total_count bigint
)
language plpgsql security definer stable as $$
declare
  v_total bigint;
begin
  -- Count total matching (excluding blocked users)
  select count(*) into v_total
  from public.uploads u
  left join public.categories c on c.id = u.category_id
  where u.status in ('funding','unlocked')
    and (p_category_slug is null or c.slug = p_category_slug)
    and (p_tag is null or exists (
      select 1 from public.upload_tags ut where ut.upload_id = u.id and lower(ut.tag) = lower(p_tag)
    ))
    and (p_caller_id is null or not exists (
      select 1 from public.user_blocks ub
      where ub.blocker_id = p_caller_id and ub.blocked_id = u.uploader_id
    ));

  return query
  select
    u.id,
    u.title,
    u.tags,
    u.ai_teaser,
    u.quality_score,
    u.status,
    u.funding_goal,
    u.current_funded,
    u.view_count,
    u.created_at::timestamptz,
    u.category_id,
    c.name as category_name,
    c.slug as category_slug,
    c.icon as category_icon,
    p.id as uploader_id,
    p.username as uploader_username,
    p.avatar_url as uploader_avatar_url,
    v_total as total_count
  from public.uploads u
  left join public.profiles p on p.id = u.uploader_id
  left join public.categories c on c.id = u.category_id
  where u.status in ('funding','unlocked')
    and (p_category_slug is null or c.slug = p_category_slug)
    and (p_tag is null or exists (
      select 1 from public.upload_tags ut where ut.upload_id = u.id and lower(ut.tag) = lower(p_tag)
    ))
    and (p_caller_id is null or not exists (
      select 1 from public.user_blocks ub
      where ub.blocker_id = p_caller_id and ub.blocked_id = u.uploader_id
    ))
  order by
    case p_sort
      when 'newest' then extract(epoch from u.created_at)
      else 0
    end desc,
    case p_sort
      when 'most_funded' then u.current_funded
      else 0
    end desc,
    case p_sort
      when 'trending' then
        (coalesce(u.current_funded, 0)::float + coalesce(u.view_count, 0) * 10)
        / (extract(epoch from (now() - u.created_at)) / 3600 + 2)
      else 0
    end desc,
    case p_sort
      when 'almost_unlocked' then
        case when u.funding_goal > 0
          then coalesce(u.current_funded, 0)::float / u.funding_goal
          else 0
        end
      else 0
    end desc,
    u.created_at desc
  limit p_limit
  offset p_offset;
end;
$$;

-- Drop old signature and grant new one
DO $$ BEGIN
  -- Try to drop old 5-arg signature
  drop function if exists public.browse_uploads(text, text, text, integer, integer);
EXCEPTION WHEN others THEN null; END $$;

grant execute on function public.browse_uploads(text, text, text, integer, integer, uuid) to authenticated, anon;

-- ══════════════════════════════════════════════
-- 2. Grant execute on rate limit RPCs
-- ══════════════════════════════════════════════
grant execute on function public.rate_limit_check(uuid, text) to authenticated;
grant execute on function public.rate_limit_info(uuid, text) to authenticated;
