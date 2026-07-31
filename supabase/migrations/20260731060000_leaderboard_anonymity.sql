-- Leaderboard anonymity: per-user preference. When enabled, the user still
-- RANKS (keeps their earned spot + stats) but shows as "Anonymous" with no
-- profile link. Enforced inside the security-definer leaderboard RPCs so the
-- raw identity never reaches the client at all.

alter table public.profiles
  add column if not exists anonymous_on_leaderboards boolean not null default false;

create or replace function public.leaderboard_top_contributors(
  p_period text default 'all', -- 'week', 'month', 'all'
  p_limit integer default 25
)
returns table(
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  total_amount bigint
)
language sql security definer stable as $$
  select
    case when p.anonymous_on_leaderboards then null else c.user_id end as user_id,
    case when p.anonymous_on_leaderboards then null else p.username end as username,
    case when p.anonymous_on_leaderboards then 'Anonymous' else p.display_name end as display_name,
    case when p.anonymous_on_leaderboards then null else p.avatar_url end as avatar_url,
    sum(c.amount)::bigint as total_amount
  from public.contributions c
  join public.profiles p on p.id = c.user_id
  where c.user_id is not null
    and (
      p_period = 'all'
      or (p_period = 'week' and c.created_at >= now() - interval '7 days')
      or (p_period = 'month' and c.created_at >= now() - interval '30 days')
    )
  group by c.user_id, p.anonymous_on_leaderboards, p.username, p.display_name, p.avatar_url
  order by total_amount desc
  limit p_limit;
$$;

create or replace function public.leaderboard_top_creators(
  p_period text default 'all',
  p_limit integer default 25
)
returns table(
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  total_funded bigint
)
language sql security definer stable as $$
  select
    case when p.anonymous_on_leaderboards then null else u.uploader_id end as user_id,
    case when p.anonymous_on_leaderboards then null else p.username end as username,
    case when p.anonymous_on_leaderboards then 'Anonymous' else p.display_name end as display_name,
    case when p.anonymous_on_leaderboards then null else p.avatar_url end as avatar_url,
    sum(c.amount)::bigint as total_funded
  from public.contributions c
  join public.uploads u on u.id = c.upload_id
  join public.profiles p on p.id = u.uploader_id
  where u.uploader_id is not null
    and (
      p_period = 'all'
      or (p_period = 'week' and c.created_at >= now() - interval '7 days')
      or (p_period = 'month' and c.created_at >= now() - interval '30 days')
    )
  group by u.uploader_id, p.anonymous_on_leaderboards, p.username, p.display_name, p.avatar_url
  order by total_funded desc
  limit p_limit;
$$;

create or replace function public.leaderboard_most_active(
  p_period text default 'all',
  p_limit integer default 25
)
returns table(
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  activity_count bigint
)
language sql security definer stable as $$
  select * from (
    -- All-time: use cached post_count
    select
      case when p.anonymous_on_leaderboards then null else p.id end as user_id,
      case when p.anonymous_on_leaderboards then null else p.username end as username,
      case when p.anonymous_on_leaderboards then 'Anonymous' else p.display_name end as display_name,
      case when p.anonymous_on_leaderboards then null else p.avatar_url end as avatar_url,
      p.post_count::bigint as activity_count
    from public.profiles p
    where p_period = 'all' and p.post_count > 0

    union all

    -- Weekly/Monthly: count threads + replies in period
    select
      case when p.anonymous_on_leaderboards then null else p.id end as user_id,
      case when p.anonymous_on_leaderboards then null else p.username end as username,
      case when p.anonymous_on_leaderboards then 'Anonymous' else p.display_name end as display_name,
      case when p.anonymous_on_leaderboards then null else p.avatar_url end as avatar_url,
      (
        (select count(*) from public.forum_threads t where t.author_id = p.id
          and t.created_at >= case when p_period = 'week' then now() - interval '7 days' else now() - interval '30 days' end)
        +
        (select count(*) from public.forum_replies r where r.author_id = p.id
          and r.created_at >= case when p_period = 'week' then now() - interval '7 days' else now() - interval '30 days' end)
      )::bigint as activity_count
    from public.profiles p
    where p_period in ('week', 'month')
  ) sub
  where activity_count > 0
  order by activity_count desc
  limit p_limit;
$$;
