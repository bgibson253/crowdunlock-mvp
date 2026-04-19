-- Live presence + creator-centric live rooms

-- 1) Presence table (heartbeat-based)
create table if not exists public.user_presence (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  status text not null default 'online' check (status in ('online','away')),
  last_seen_at timestamptz not null default now(),
  last_heartbeat_at timestamptz not null default now(),
  platform text,
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_presence_last_heartbeat on public.user_presence(last_heartbeat_at desc);

alter table public.user_presence enable row level security;

drop policy if exists "user_presence_select_authenticated" on public.user_presence;
create policy "user_presence_select_authenticated"
on public.user_presence
for select
to authenticated
using (true);

drop policy if exists "user_presence_upsert_own" on public.user_presence;
create policy "user_presence_upsert_own"
on public.user_presence
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "user_presence_update_own" on public.user_presence;
create policy "user_presence_update_own"
on public.user_presence
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- 2) Live rooms (creator-centric)
create table if not exists public.live_rooms (
  id uuid primary key default gen_random_uuid(),
  host_user_id uuid not null references public.profiles(id) on delete cascade,
  room_name text not null,
  title text,
  status text not null default 'live' check (status in ('live','ended')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  last_heartbeat_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- only one active live room per host
create unique index if not exists uniq_live_rooms_host_active
on public.live_rooms(host_user_id)
where status = 'live';

create index if not exists idx_live_rooms_status_started
on public.live_rooms(status, started_at desc);

alter table public.live_rooms enable row level security;

drop policy if exists "live_rooms_select_authenticated" on public.live_rooms;
create policy "live_rooms_select_authenticated"
on public.live_rooms
for select
to authenticated
using (true);

drop policy if exists "live_rooms_insert_own" on public.live_rooms;
create policy "live_rooms_insert_own"
on public.live_rooms
for insert
to authenticated
with check (auth.uid() = host_user_id);

drop policy if exists "live_rooms_update_own" on public.live_rooms;
create policy "live_rooms_update_own"
on public.live_rooms
for update
to authenticated
using (auth.uid() = host_user_id)
with check (auth.uid() = host_user_id);

-- 3) Helper function: follower list in 2 tiers
-- Tier 1: people you follow
-- Tier 2: mutuals (both follow each other)
create or replace function public.get_following_and_mutuals_presence()
returns table (
  tier text,
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  is_live boolean,
  live_room_id uuid,
  live_room_title text,
  last_heartbeat_at timestamptz
)
language sql
security definer
as $$
with me as (
  select auth.uid() as uid
),
following as (
  select uf.following_id as uid
  from public.user_follows uf, me
  where uf.follower_id = me.uid
),
mutuals as (
  select f.uid
  from following f
  join public.user_follows back
    on back.follower_id = f.uid
   and back.following_id = (select uid from me)
),
base as (
  select
    case when m.uid is not null then 'mutual' else 'following' end as tier,
    f.uid as user_id
  from following f
  left join mutuals m on m.uid = f.uid
)
select
  b.tier,
  p.id as user_id,
  p.username,
  p.display_name,
  p.avatar_url,
  (lr.id is not null) as is_live,
  lr.id as live_room_id,
  lr.title as live_room_title,
  coalesce(up.last_heartbeat_at, p.created_at) as last_heartbeat_at
from base b
join public.profiles p on p.id = b.user_id
left join public.user_presence up on up.user_id = p.id
left join public.live_rooms lr on lr.host_user_id = p.id and lr.status = 'live'
order by
  -- following first, then mutuals underneath
  case when b.tier = 'following' then 0 else 1 end,
  -- live at top within tier
  case when lr.id is not null then 0 else 1 end,
  -- then most recently active
  coalesce(up.last_heartbeat_at, p.updated_at) desc;
$$;

revoke all on function public.get_following_and_mutuals_presence() from public;
grant execute on function public.get_following_and_mutuals_presence() to authenticated;
