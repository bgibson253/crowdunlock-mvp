-- ══════════════════════════════════════════════════════════════════
-- Migration: Leaderboards, Follow System, Watchlist, Enhanced Achievements
-- ══════════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════
-- 1. FOLLOW SYSTEM
-- ══════════════════════════════════════════════

create table if not exists public.user_follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint user_follows_unique unique (follower_id, following_id),
  constraint user_follows_no_self check (follower_id <> following_id)
);

create index if not exists idx_user_follows_follower on public.user_follows(follower_id);
create index if not exists idx_user_follows_following on public.user_follows(following_id);

alter table public.user_follows enable row level security;

create policy "user_follows_select_all" on public.user_follows
  for select to authenticated using (true);

create policy "user_follows_insert_own" on public.user_follows
  for insert to authenticated with check (auth.uid() = follower_id);

create policy "user_follows_delete_own" on public.user_follows
  for delete to authenticated using (auth.uid() = follower_id);

-- Follower/following counts on profiles
alter table public.profiles add column if not exists follower_count integer not null default 0;
alter table public.profiles add column if not exists following_count integer not null default 0;

-- Trigger to maintain counts
create or replace function public.update_follow_counts()
returns trigger language plpgsql security definer as $$
begin
  if TG_OP = 'INSERT' then
    update public.profiles set following_count = following_count + 1 where id = NEW.follower_id;
    update public.profiles set follower_count = follower_count + 1 where id = NEW.following_id;
    return NEW;
  elsif TG_OP = 'DELETE' then
    update public.profiles set following_count = greatest(0, following_count - 1) where id = OLD.follower_id;
    update public.profiles set follower_count = greatest(0, follower_count - 1) where id = OLD.following_id;
    return OLD;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_update_follow_counts on public.user_follows;
create trigger trg_update_follow_counts
  after insert or delete on public.user_follows
  for each row execute function public.update_follow_counts();


-- ══════════════════════════════════════════════
-- 2. UPLOAD WATCHLIST
-- ══════════════════════════════════════════════

create table if not exists public.upload_watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  upload_id uuid not null references public.uploads(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint upload_watchlist_unique unique (user_id, upload_id)
);

create index if not exists idx_upload_watchlist_user on public.upload_watchlist(user_id);
create index if not exists idx_upload_watchlist_upload on public.upload_watchlist(upload_id);

alter table public.upload_watchlist enable row level security;

create policy "upload_watchlist_select_own" on public.upload_watchlist
  for select to authenticated using (auth.uid() = user_id);

create policy "upload_watchlist_insert_own" on public.upload_watchlist
  for insert to authenticated with check (auth.uid() = user_id);

create policy "upload_watchlist_delete_own" on public.upload_watchlist
  for delete to authenticated using (auth.uid() = user_id);


-- ══════════════════════════════════════════════
-- 3. ENHANCED ACHIEVEMENTS (add missing ones)
-- ══════════════════════════════════════════════

-- Add category column to achievements if not exists
alter table public.achievements add column if not exists category text not null default 'general';

-- Seed additional achievements that were requested but missing
insert into public.achievements (id, title, description, icon, points_reward, category) values
  ('first_upload', 'First Upload', 'Uploaded your first content', '📤', 15, 'content'),
  ('posts_50_threads', '50 Threads', 'Created 50 threads in forums', '📚', 50, 'forum'),
  ('contributions_100', 'Century Backer', 'Made 100 contributions', '💎', 100, 'funding'),
  ('conversation_starter', 'Conversation Starter', 'Started 5 discussion threads', '🗣️', 20, 'forum'),
  ('popular_thread', 'Popular Thread', 'Had a thread receive 25+ replies', '🔥', 35, 'forum'),
  ('first_follow', 'Social Butterfly', 'Followed your first user', '🦋', 5, 'social'),
  ('ten_followers', 'Influencer', 'Gained 10 followers', '📢', 30, 'social'),
  ('first_watchlist', 'Watchful Eye', 'Added your first upload to watchlist', '👁️', 5, 'content'),
  ('funded_creator', 'Funded Creator', 'Had an upload fully funded', '🎉', 50, 'content')
on conflict (id) do nothing;

-- Update existing achievements with categories
update public.achievements set category = 'forum' where id in ('first_post', 'first_reply', 'posts_10', 'posts_50', 'replies_25', 'replies_100', 'solution_given');
update public.achievements set category = 'social' where id in ('first_reaction', 'received_10_reactions', 'received_50_reactions', 'verified_social', 'profile_complete');
update public.achievements set category = 'streak' where id in ('streak_3', 'streak_7', 'streak_30');
update public.achievements set category = 'points' where id in ('points_100', 'points_500', 'points_1000');
update public.achievements set category = 'funding' where id in ('first_contribution', 'contributed_100');


-- ══════════════════════════════════════════════
-- 4. CHECK_ACHIEVEMENTS RPC
-- ══════════════════════════════════════════════

create or replace function public.check_achievements(p_user_id uuid)
returns text[]
language plpgsql security definer as $$
declare
  v_new text[] := '{}';
  v_thread_count integer;
  v_reply_count integer;
  v_contribution_count integer;
  v_contribution_total bigint;
  v_upload_count integer;
  v_follower_count integer;
  v_following_count integer;
  v_watchlist_count integer;
  v_popular_thread boolean;
  v_funded_upload boolean;
  v_total_points integer;
  v_has_avatar boolean;
  v_has_bio boolean;
begin
  -- Gather counts
  select count(*) into v_thread_count from public.forum_threads where author_id = p_user_id;
  select count(*) into v_reply_count from public.forum_replies where author_id = p_user_id;
  select count(*), coalesce(sum(amount), 0) into v_contribution_count, v_contribution_total from public.contributions where user_id = p_user_id;
  select count(*) into v_upload_count from public.uploads where uploader_id = p_user_id;
  select follower_count, following_count, total_points into v_follower_count, v_following_count, v_total_points from public.profiles where id = p_user_id;
  select count(*) into v_watchlist_count from public.upload_watchlist where user_id = p_user_id;
  select exists(select 1 from public.forum_threads t join public.forum_replies r on r.thread_id = t.id where t.author_id = p_user_id group by t.id having count(r.id) >= 25) into v_popular_thread;
  select exists(select 1 from public.uploads where uploader_id = p_user_id and status = 'unlocked') into v_funded_upload;
  select avatar_url is not null and avatar_url <> '' into v_has_avatar from public.profiles where id = p_user_id;
  select bio is not null and bio <> '' into v_has_bio from public.profiles where id = p_user_id;

  -- Forum achievements
  if v_thread_count >= 1 then
    insert into public.user_achievements (user_id, achievement_id) values (p_user_id, 'first_post') on conflict do nothing;
    if found then v_new := array_append(v_new, 'first_post'); end if;
  end if;
  if v_reply_count >= 1 then
    insert into public.user_achievements (user_id, achievement_id) values (p_user_id, 'first_reply') on conflict do nothing;
    if found then v_new := array_append(v_new, 'first_reply'); end if;
  end if;
  if v_thread_count >= 5 then
    insert into public.user_achievements (user_id, achievement_id) values (p_user_id, 'conversation_starter') on conflict do nothing;
    if found then v_new := array_append(v_new, 'conversation_starter'); end if;
  end if;
  if v_thread_count >= 10 then
    insert into public.user_achievements (user_id, achievement_id) values (p_user_id, 'posts_10') on conflict do nothing;
    if found then v_new := array_append(v_new, 'posts_10'); end if;
  end if;
  if v_thread_count >= 50 then
    insert into public.user_achievements (user_id, achievement_id) values (p_user_id, 'posts_50') on conflict do nothing;
    if found then v_new := array_append(v_new, 'posts_50'); end if;
    insert into public.user_achievements (user_id, achievement_id) values (p_user_id, 'posts_50_threads') on conflict do nothing;
    if found then v_new := array_append(v_new, 'posts_50_threads'); end if;
  end if;
  if v_reply_count >= 25 then
    insert into public.user_achievements (user_id, achievement_id) values (p_user_id, 'replies_25') on conflict do nothing;
    if found then v_new := array_append(v_new, 'replies_25'); end if;
  end if;
  if v_reply_count >= 100 then
    insert into public.user_achievements (user_id, achievement_id) values (p_user_id, 'replies_100') on conflict do nothing;
    if found then v_new := array_append(v_new, 'replies_100'); end if;
  end if;
  if v_popular_thread then
    insert into public.user_achievements (user_id, achievement_id) values (p_user_id, 'popular_thread') on conflict do nothing;
    if found then v_new := array_append(v_new, 'popular_thread'); end if;
  end if;

  -- Content achievements
  if v_upload_count >= 1 then
    insert into public.user_achievements (user_id, achievement_id) values (p_user_id, 'first_upload') on conflict do nothing;
    if found then v_new := array_append(v_new, 'first_upload'); end if;
  end if;
  if v_funded_upload then
    insert into public.user_achievements (user_id, achievement_id) values (p_user_id, 'funded_creator') on conflict do nothing;
    if found then v_new := array_append(v_new, 'funded_creator'); end if;
  end if;

  -- Funding achievements
  if v_contribution_count >= 1 then
    insert into public.user_achievements (user_id, achievement_id) values (p_user_id, 'first_contribution') on conflict do nothing;
    if found then v_new := array_append(v_new, 'first_contribution'); end if;
  end if;
  if v_contribution_count >= 100 then
    insert into public.user_achievements (user_id, achievement_id) values (p_user_id, 'contributions_100') on conflict do nothing;
    if found then v_new := array_append(v_new, 'contributions_100'); end if;
  end if;
  if v_contribution_total >= 10000 then -- $100 in cents
    insert into public.user_achievements (user_id, achievement_id) values (p_user_id, 'contributed_100') on conflict do nothing;
    if found then v_new := array_append(v_new, 'contributed_100'); end if;
  end if;

  -- Social achievements
  if v_following_count >= 1 then
    insert into public.user_achievements (user_id, achievement_id) values (p_user_id, 'first_follow') on conflict do nothing;
    if found then v_new := array_append(v_new, 'first_follow'); end if;
  end if;
  if v_follower_count >= 10 then
    insert into public.user_achievements (user_id, achievement_id) values (p_user_id, 'ten_followers') on conflict do nothing;
    if found then v_new := array_append(v_new, 'ten_followers'); end if;
  end if;

  -- Watchlist
  if v_watchlist_count >= 1 then
    insert into public.user_achievements (user_id, achievement_id) values (p_user_id, 'first_watchlist') on conflict do nothing;
    if found then v_new := array_append(v_new, 'first_watchlist'); end if;
  end if;

  -- Profile
  if v_has_avatar and v_has_bio then
    insert into public.user_achievements (user_id, achievement_id) values (p_user_id, 'profile_complete') on conflict do nothing;
    if found then v_new := array_append(v_new, 'profile_complete'); end if;
  end if;

  -- Points milestones
  if v_total_points >= 100 then
    insert into public.user_achievements (user_id, achievement_id) values (p_user_id, 'points_100') on conflict do nothing;
    if found then v_new := array_append(v_new, 'points_100'); end if;
  end if;
  if v_total_points >= 500 then
    insert into public.user_achievements (user_id, achievement_id) values (p_user_id, 'points_500') on conflict do nothing;
    if found then v_new := array_append(v_new, 'points_500'); end if;
  end if;
  if v_total_points >= 1000 then
    insert into public.user_achievements (user_id, achievement_id) values (p_user_id, 'points_1000') on conflict do nothing;
    if found then v_new := array_append(v_new, 'points_1000'); end if;
  end if;

  -- Insert notifications for newly earned achievements
  if array_length(v_new, 1) > 0 then
    insert into public.forum_notifications (user_id, type)
    select p_user_id, 'achievement'
    from unnest(v_new) as achievement_key;
  end if;

  return v_new;
end;
$$;

grant execute on function public.check_achievements to authenticated;


-- ══════════════════════════════════════════════
-- 5. LEADERBOARD RPCs (with date filtering)
-- ══════════════════════════════════════════════

-- Top contributors by total contribution amount
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
    c.user_id,
    p.username,
    p.display_name,
    p.avatar_url,
    sum(c.amount)::bigint as total_amount
  from public.contributions c
  join public.profiles p on p.id = c.user_id
  where c.user_id is not null
    and (
      p_period = 'all'
      or (p_period = 'week' and c.created_at >= now() - interval '7 days')
      or (p_period = 'month' and c.created_at >= now() - interval '30 days')
    )
  group by c.user_id, p.username, p.display_name, p.avatar_url
  order by total_amount desc
  limit p_limit;
$$;

-- Top creators by total funding received
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
    u.uploader_id as user_id,
    p.username,
    p.display_name,
    p.avatar_url,
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
  group by u.uploader_id, p.username, p.display_name, p.avatar_url
  order by total_funded desc
  limit p_limit;
$$;

-- Most active by post_count (all-time uses profile cache, weekly/monthly queries directly)
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
      p.id as user_id,
      p.username,
      p.display_name,
      p.avatar_url,
      p.post_count::bigint as activity_count
    from public.profiles p
    where p_period = 'all' and p.post_count > 0
    
    union all
    
    -- Weekly/Monthly: count threads + replies in period
    select
      p.id as user_id,
      p.username,
      p.display_name,
      p.avatar_url,
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

grant execute on function public.leaderboard_top_contributors to public;
grant execute on function public.leaderboard_top_creators to public;
grant execute on function public.leaderboard_most_active to public;


-- ══════════════════════════════════════════════
-- 6. UPDATE NOTIFICATION TYPE CONSTRAINT
-- ══════════════════════════════════════════════

-- Allow 'achievement' type in forum_notifications
-- The existing check constraint restricts to 'reply','mention','keyword'
-- We need to update it
do $$ begin
  -- Drop old constraint if it exists
  alter table public.forum_notifications drop constraint if exists forum_notifications_type_check;
exception when others then null;
end $$;

-- Add updated constraint
do $$ begin
  alter table public.forum_notifications
    add constraint forum_notifications_type_check
    check (type in ('reply', 'mention', 'keyword', 'achievement', 'follow', 'watchlist_funded'));
exception when duplicate_object then null;
end $$;

-- Add optional metadata column for achievement notifications
alter table public.forum_notifications add column if not exists metadata jsonb;
