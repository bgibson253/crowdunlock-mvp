-- Social graph: friend requests + follow/live/upload notifications

-- 1) Friend requests
create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references public.profiles(id) on delete cascade,
  to_user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','rejected','canceled')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint friend_requests_unique unique (from_user_id, to_user_id),
  constraint friend_requests_no_self check (from_user_id <> to_user_id)
);

create index if not exists idx_friend_requests_to_status on public.friend_requests(to_user_id, status, created_at desc);
create index if not exists idx_friend_requests_from_status on public.friend_requests(from_user_id, status, created_at desc);

alter table public.friend_requests enable row level security;

drop policy if exists "friend_requests_select_own" on public.friend_requests;
create policy "friend_requests_select_own"
on public.friend_requests
for select
to authenticated
using (auth.uid() = from_user_id or auth.uid() = to_user_id);

drop policy if exists "friend_requests_insert_own" on public.friend_requests;
create policy "friend_requests_insert_own"
on public.friend_requests
for insert
to authenticated
with check (auth.uid() = from_user_id);

drop policy if exists "friend_requests_update_own" on public.friend_requests;
create policy "friend_requests_update_own"
on public.friend_requests
for update
to authenticated
using (
  auth.uid() = from_user_id or auth.uid() = to_user_id
)
with check (
  auth.uid() = from_user_id or auth.uid() = to_user_id
);

-- 2) Extend forum_notifications types for social/live
alter table public.forum_notifications drop constraint if exists forum_notifications_type_check;

alter table public.forum_notifications
  add constraint forum_notifications_type_check
  check (
    type in (
      'reply','mention','keyword',
      'achievement',
      'follow',
      'friend_request',
      'friend_accept',
      'upload_posted',
      'user_went_live'
    )
  );

-- 3) When someone follows you -> notify
create or replace function public.notify_on_follow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.forum_notifications(user_id, type, metadata)
  values (
    NEW.following_id,
    'follow',
    jsonb_build_object('follower_id', NEW.follower_id)
  );
  return NEW;
end;
$$;

drop trigger if exists trg_notify_on_follow on public.user_follows;
create trigger trg_notify_on_follow
  after insert on public.user_follows
  for each row execute function public.notify_on_follow();

-- 4) Friend request notifications
create or replace function public.notify_on_friend_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.status = 'pending' then
    insert into public.forum_notifications(user_id, type, metadata)
    values (
      NEW.to_user_id,
      'friend_request',
      jsonb_build_object('from_user_id', NEW.from_user_id, 'friend_request_id', NEW.id)
    );
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_notify_on_friend_request on public.friend_requests;
create trigger trg_notify_on_friend_request
  after insert on public.friend_requests
  for each row execute function public.notify_on_friend_request();

create or replace function public.notify_on_friend_request_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if OLD.status = 'pending' and NEW.status = 'accepted' then
    insert into public.forum_notifications(user_id, type, metadata)
    values (
      NEW.from_user_id,
      'friend_accept',
      jsonb_build_object('to_user_id', NEW.to_user_id, 'friend_request_id', NEW.id)
    );
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_notify_on_friend_request_update on public.friend_requests;
create trigger trg_notify_on_friend_request_update
  after update on public.friend_requests
  for each row execute function public.notify_on_friend_request_update();

-- 5) When someone you follow posts an upload -> notify followers
-- (Uses uploads.uploader_id)
create or replace function public.notify_followers_on_upload()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.forum_notifications(user_id, type, metadata)
  select
    uf.follower_id,
    'upload_posted',
    jsonb_build_object('creator_id', NEW.uploader_id, 'upload_id', NEW.id)
  from public.user_follows uf
  where uf.following_id = NEW.uploader_id;

  return NEW;
end;
$$;

drop trigger if exists trg_notify_followers_on_upload on public.uploads;
create trigger trg_notify_followers_on_upload
  after insert on public.uploads
  for each row execute function public.notify_followers_on_upload();

-- 6) When a user goes live -> notify followers
create or replace function public.notify_followers_on_live()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.status = 'live' then
    insert into public.forum_notifications(user_id, type, metadata)
    select
      uf.follower_id,
      'user_went_live',
      jsonb_build_object('host_user_id', NEW.host_user_id, 'live_room_id', NEW.id)
    from public.user_follows uf
    where uf.following_id = NEW.host_user_id;
  end if;

  return NEW;
end;
$$;

do $$ begin
  if to_regclass('public.live_rooms') is not null then
    drop trigger if exists trg_notify_followers_on_live on public.live_rooms;
    create trigger trg_notify_followers_on_live
      after insert on public.live_rooms
      for each row execute function public.notify_followers_on_live();
  end if;
end $$;
