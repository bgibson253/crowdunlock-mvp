-- Points, streaks, achievements, and trending support

-- ══════════════════════════════════════════════
-- 1. USER POINTS / XP
-- ══════════════════════════════════════════════

-- Points ledger: every action that earns points gets a row
create table if not exists public.user_points (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  points integer not null,
  reason text not null, -- 'thread_created', 'reply_posted', 'reaction_received', 'contribution', 'daily_login', 'streak_bonus'
  ref_id uuid, -- optional FK to the thread/reply/contribution that earned it
  created_at timestamptz not null default now()
);

create index if not exists idx_user_points_user on public.user_points(user_id);
create index if not exists idx_user_points_created on public.user_points(created_at desc);

alter table public.user_points enable row level security;

create policy "user_points_read_all"
on public.user_points for select to authenticated
using (true);

create policy "user_points_insert_own"
on public.user_points for insert to authenticated
with check (auth.uid() = user_id);

-- Cached total on profiles for fast leaderboard queries
alter table public.profiles add column if not exists total_points integer not null default 0;
alter table public.profiles add column if not exists current_streak integer not null default 0;
alter table public.profiles add column if not exists longest_streak integer not null default 0;
alter table public.profiles add column if not exists last_streak_date date;

-- ══════════════════════════════════════════════
-- 2. ACHIEVEMENTS / BADGES
-- ══════════════════════════════════════════════

create table if not exists public.achievements (
  id text primary key, -- e.g. 'first_post', 'streak_7', 'points_1000'
  title text not null,
  description text not null,
  icon text not null default '🏆',
  points_reward integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  achievement_id text not null references public.achievements(id) on delete cascade,
  earned_at timestamptz not null default now(),
  unique(user_id, achievement_id)
);

alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;

create policy "achievements_read_all" on public.achievements for select to public using (true);
create policy "user_achievements_read_all" on public.user_achievements for select to authenticated using (true);
create policy "user_achievements_insert_own" on public.user_achievements for insert to authenticated with check (auth.uid() = user_id);

-- Seed achievements
insert into public.achievements (id, title, description, icon, points_reward) values
  ('first_post', 'First Post', 'Created your first thread', '✍️', 10),
  ('first_reply', 'Conversationalist', 'Posted your first reply', '💬', 5),
  ('first_reaction', 'Reactor', 'Gave your first reaction', '⚡', 2),
  ('received_10_reactions', 'Popular', 'Received 10 reactions on your posts', '🔥', 25),
  ('received_50_reactions', 'Crowd Favorite', 'Received 50 reactions on your posts', '⭐', 50),
  ('streak_3', 'On a Roll', '3-day visit streak', '🔥', 15),
  ('streak_7', 'Week Warrior', '7-day visit streak', '💪', 30),
  ('streak_30', 'Dedicated', '30-day visit streak', '🏅', 100),
  ('points_100', 'Centurion', 'Earned 100 points', '💯', 0),
  ('points_500', 'Rising Star', 'Earned 500 points', '🌟', 0),
  ('points_1000', 'Legend', 'Earned 1,000 points', '👑', 0),
  ('posts_10', 'Regular', 'Created 10 threads', '📝', 20),
  ('posts_50', 'Prolific', 'Created 50 threads', '📚', 50),
  ('replies_25', 'Helpful', 'Posted 25 replies', '🤝', 25),
  ('replies_100', 'Community Pillar', 'Posted 100 replies', '🏛️', 75),
  ('first_contribution', 'Backer', 'Made your first contribution', '💰', 10),
  ('contributed_100', 'Generous', 'Contributed $100+', '💎', 50),
  ('verified_social', 'Verified', 'Verified a social media account', '✅', 15),
  ('profile_complete', 'All Set', 'Completed your profile (avatar + bio)', '🎨', 10),
  ('solution_given', 'Problem Solver', 'Had a reply marked as solution', '🧩', 25)
on conflict (id) do nothing;

-- ══════════════════════════════════════════════
-- 3. RPC: Award points + check achievements
-- ══════════════════════════════════════════════

create or replace function public.award_points(
  p_user_id uuid,
  p_points integer,
  p_reason text,
  p_ref_id uuid default null
) returns void
language plpgsql security definer
as $$
begin
  insert into public.user_points (user_id, points, reason, ref_id)
  values (p_user_id, p_points, p_reason, p_ref_id);

  update public.profiles
  set total_points = total_points + p_points
  where id = p_user_id;
end;
$$;

-- ══════════════════════════════════════════════
-- 4. RPC: Record daily login + update streak
-- ══════════════════════════════════════════════

create or replace function public.record_daily_visit(p_user_id uuid)
returns jsonb
language plpgsql security definer
as $$
declare
  v_last_date date;
  v_streak integer;
  v_longest integer;
  v_today date := current_date;
  v_points_awarded integer := 0;
  v_new_achievements text[] := '{}';
begin
  select last_streak_date, current_streak, longest_streak
  into v_last_date, v_streak, v_longest
  from public.profiles where id = p_user_id;

  -- Already visited today
  if v_last_date = v_today then
    return jsonb_build_object('streak', v_streak, 'points_awarded', 0, 'new_achievements', '[]'::jsonb);
  end if;

  -- Continuing streak (yesterday)
  if v_last_date = v_today - 1 then
    v_streak := v_streak + 1;
  else
    -- Streak broken
    v_streak := 1;
  end if;

  if v_streak > v_longest then
    v_longest := v_streak;
  end if;

  -- Daily login points
  v_points_awarded := 2;
  perform public.award_points(p_user_id, 2, 'daily_login');

  -- Streak bonus (every 7 days)
  if v_streak > 0 and v_streak % 7 = 0 then
    v_points_awarded := v_points_awarded + 10;
    perform public.award_points(p_user_id, 10, 'streak_bonus');
  end if;

  -- Update profile
  update public.profiles
  set last_streak_date = v_today,
      current_streak = v_streak,
      longest_streak = v_longest
  where id = p_user_id;

  -- Check streak achievements
  if v_streak >= 3 then
    insert into public.user_achievements (user_id, achievement_id)
    values (p_user_id, 'streak_3') on conflict do nothing;
    if found then v_new_achievements := array_append(v_new_achievements, 'streak_3'); end if;
  end if;
  if v_streak >= 7 then
    insert into public.user_achievements (user_id, achievement_id)
    values (p_user_id, 'streak_7') on conflict do nothing;
    if found then v_new_achievements := array_append(v_new_achievements, 'streak_7'); end if;
  end if;
  if v_streak >= 30 then
    insert into public.user_achievements (user_id, achievement_id)
    values (p_user_id, 'streak_30') on conflict do nothing;
    if found then v_new_achievements := array_append(v_new_achievements, 'streak_30'); end if;
  end if;

  return jsonb_build_object(
    'streak', v_streak,
    'points_awarded', v_points_awarded,
    'new_achievements', to_jsonb(v_new_achievements)
  );
end;
$$;

-- ══════════════════════════════════════════════
-- 5. TRENDING: View for hot threads (last 48h)
-- ══════════════════════════════════════════════

create or replace view public.trending_threads as
select
  t.id,
  t.title,
  t.author_id,
  t.section_id,
  t.created_at,
  t.view_count,
  coalesce(rc.reply_count, 0) as recent_replies,
  coalesce(rxc.reaction_count, 0) as recent_reactions,
  -- Hot score: replies * 3 + reactions * 2 + views * 0.1, weighted by recency
  (
    coalesce(rc.reply_count, 0) * 3 +
    coalesce(rxc.reaction_count, 0) * 2 +
    coalesce(t.view_count, 0) * 0.1
  ) * (1.0 / (extract(epoch from (now() - t.created_at)) / 3600 + 2)) as hot_score
from public.forum_threads t
left join lateral (
  select count(*) as reply_count
  from public.forum_replies r
  where r.thread_id = t.id and r.created_at > now() - interval '48 hours'
) rc on true
left join lateral (
  select count(*) as reaction_count
  from public.forum_reactions rx
  where (
    (rx.target_type = 'thread' and rx.target_id = t.id)
    or (rx.target_type = 'reply' and rx.target_id in (select r2.id from public.forum_replies r2 where r2.thread_id = t.id))
  ) and rx.created_at > now() - interval '48 hours'
) rxc on true
where t.created_at > now() - interval '7 days'
order by hot_score desc
limit 10;

-- Grant access
grant execute on function public.award_points to authenticated;
grant execute on function public.record_daily_visit to authenticated;
grant select on public.trending_threads to authenticated;
