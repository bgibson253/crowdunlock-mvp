-- Forum Enhancements: Search, Notifications, Nested Replies, Rich Posting, Reactions
-- Idempotent where possible

-- ============================================================
-- 0. Profiles table (for @mentions / display_name)
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Public read
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles_read_public') then
    create policy "profiles_read_public" on public.profiles for select using (true);
  end if;
end $$;

-- Users can insert/update their own
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles_insert_own') then
    create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (auth.uid() = id);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles_update_own') then
    create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
  end if;
end $$;

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill existing users who don't have profiles
insert into public.profiles (id, display_name)
select id, coalesce(raw_user_meta_data->>'display_name', split_part(email, '@', 1))
from auth.users
where id not in (select id from public.profiles)
on conflict (id) do nothing;


-- ============================================================
-- 1. FULL-TEXT SEARCH
-- ============================================================
-- Add tsvector columns
alter table public.forum_threads add column if not exists search_vector tsvector;
alter table public.forum_replies add column if not exists search_vector tsvector;

-- Populate existing rows
update public.forum_threads
set search_vector = to_tsvector('english', coalesce(title, '') || ' ' || coalesce(body, ''))
where search_vector is null;

update public.forum_replies
set search_vector = to_tsvector('english', coalesce(body, ''))
where search_vector is null;

-- GIN indexes
create index if not exists forum_threads_search_idx on public.forum_threads using gin(search_vector);
create index if not exists forum_replies_search_idx on public.forum_replies using gin(search_vector);

-- Auto-update triggers
create or replace function public.forum_threads_search_trigger()
returns trigger
language plpgsql
as $$
begin
  new.search_vector := to_tsvector('english', coalesce(new.title, '') || ' ' || coalesce(new.body, ''));
  return new;
end;
$$;

drop trigger if exists forum_threads_search_update on public.forum_threads;
create trigger forum_threads_search_update
  before insert or update of title, body on public.forum_threads
  for each row execute function public.forum_threads_search_trigger();

create or replace function public.forum_replies_search_trigger()
returns trigger
language plpgsql
as $$
begin
  new.search_vector := to_tsvector('english', coalesce(new.body, ''));
  return new;
end;
$$;

drop trigger if exists forum_replies_search_update on public.forum_replies;
create trigger forum_replies_search_update
  before insert or update of body on public.forum_replies
  for each row execute function public.forum_replies_search_trigger();


-- ============================================================
-- 2. FAVORITES, SUBSCRIPTIONS, NOTIFICATIONS
-- ============================================================

-- Favorites
create table if not exists public.forum_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  thread_id uuid not null references public.forum_threads(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, thread_id)
);

alter table public.forum_favorites enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='forum_favorites' and policyname='forum_favorites_select_own') then
    create policy "forum_favorites_select_own" on public.forum_favorites for select to authenticated using (auth.uid() = user_id);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='forum_favorites' and policyname='forum_favorites_insert_own') then
    create policy "forum_favorites_insert_own" on public.forum_favorites for insert to authenticated with check (auth.uid() = user_id);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='forum_favorites' and policyname='forum_favorites_delete_own') then
    create policy "forum_favorites_delete_own" on public.forum_favorites for delete to authenticated using (auth.uid() = user_id);
  end if;
end $$;


-- Subscriptions
create table if not exists public.forum_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  thread_id uuid references public.forum_threads(id) on delete cascade,
  section_id text references public.forum_sections(id) on delete cascade,
  type text not null check (type in ('thread','section','keyword')),
  keyword text,
  created_at timestamptz not null default now()
);

alter table public.forum_subscriptions enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='forum_subscriptions' and policyname='forum_subscriptions_select_own') then
    create policy "forum_subscriptions_select_own" on public.forum_subscriptions for select to authenticated using (auth.uid() = user_id);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='forum_subscriptions' and policyname='forum_subscriptions_insert_own') then
    create policy "forum_subscriptions_insert_own" on public.forum_subscriptions for insert to authenticated with check (auth.uid() = user_id);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='forum_subscriptions' and policyname='forum_subscriptions_delete_own') then
    create policy "forum_subscriptions_delete_own" on public.forum_subscriptions for delete to authenticated using (auth.uid() = user_id);
  end if;
end $$;

create index if not exists forum_subscriptions_user_idx on public.forum_subscriptions(user_id);
create index if not exists forum_subscriptions_thread_idx on public.forum_subscriptions(thread_id) where thread_id is not null;
create index if not exists forum_subscriptions_section_idx on public.forum_subscriptions(section_id) where section_id is not null;


-- Notifications
create table if not exists public.forum_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  thread_id uuid references public.forum_threads(id) on delete cascade,
  reply_id uuid references public.forum_replies(id) on delete cascade,
  type text not null check (type in ('reply','mention','keyword')),
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.forum_notifications enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='forum_notifications' and policyname='forum_notifications_select_own') then
    create policy "forum_notifications_select_own" on public.forum_notifications for select to authenticated using (auth.uid() = user_id);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='forum_notifications' and policyname='forum_notifications_update_own') then
    create policy "forum_notifications_update_own" on public.forum_notifications for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

-- Allow service role / trigger to insert (we use security definer function)
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='forum_notifications' and policyname='forum_notifications_insert_service') then
    create policy "forum_notifications_insert_service" on public.forum_notifications for insert with check (true);
  end if;
end $$;

create index if not exists forum_notifications_user_unread_idx on public.forum_notifications(user_id, read) where read = false;
create index if not exists forum_notifications_created_idx on public.forum_notifications(created_at desc);


-- Notification trigger: on new reply, notify thread subscribers + @mentioned users
create or replace function public.notify_on_reply()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_thread_id uuid;
  v_section_id text;
  v_reply_author uuid;
  v_mention text;
  v_mentioned_user_id uuid;
begin
  v_thread_id := new.thread_id;
  v_reply_author := new.author_id;

  -- Get section_id for section subscriptions
  select section_id into v_section_id from public.forum_threads where id = v_thread_id;

  -- Notify thread subscribers (excluding reply author)
  insert into public.forum_notifications (user_id, thread_id, reply_id, type)
  select distinct s.user_id, v_thread_id, new.id, 'reply'
  from public.forum_subscriptions s
  where (
    (s.type = 'thread' and s.thread_id = v_thread_id)
    or (s.type = 'section' and s.section_id = v_section_id)
  )
  and s.user_id != v_reply_author;

  -- Notify @mentioned users
  for v_mention in
    select (regexp_matches(new.body, '@([a-zA-Z0-9_.-]+)', 'g'))[1]
  loop
    select p.id into v_mentioned_user_id
    from public.profiles p
    where lower(p.display_name) = lower(v_mention)
    limit 1;

    if v_mentioned_user_id is not null and v_mentioned_user_id != v_reply_author then
      insert into public.forum_notifications (user_id, thread_id, reply_id, type)
      values (v_mentioned_user_id, v_thread_id, new.id, 'mention')
      on conflict do nothing;
    end if;
  end loop;

  -- Keyword subscriptions
  insert into public.forum_notifications (user_id, thread_id, reply_id, type)
  select distinct s.user_id, v_thread_id, new.id, 'keyword'
  from public.forum_subscriptions s
  where s.type = 'keyword'
    and s.keyword is not null
    and new.body ilike '%' || s.keyword || '%'
    and s.user_id != v_reply_author;

  return new;
end;
$$;

drop trigger if exists on_forum_reply_created on public.forum_replies;
create trigger on_forum_reply_created
  after insert on public.forum_replies
  for each row execute function public.notify_on_reply();


-- ============================================================
-- 3. THREADED/NESTED REPLIES
-- ============================================================
alter table public.forum_replies add column if not exists parent_reply_id uuid references public.forum_replies(id) on delete cascade;
create index if not exists forum_replies_parent_idx on public.forum_replies(parent_reply_id) where parent_reply_id is not null;


-- ============================================================
-- 4. RICH POSTING / REACTIONS
-- ============================================================

-- Reactions table
create table if not exists public.forum_reactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('thread','reply')),
  target_id uuid not null,
  emoji text not null,
  created_at timestamptz not null default now(),
  unique(user_id, target_type, target_id, emoji)
);

alter table public.forum_reactions enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='forum_reactions' and policyname='forum_reactions_select_public') then
    create policy "forum_reactions_select_public" on public.forum_reactions for select using (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='forum_reactions' and policyname='forum_reactions_insert_own') then
    create policy "forum_reactions_insert_own" on public.forum_reactions for insert to authenticated with check (auth.uid() = user_id);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='forum_reactions' and policyname='forum_reactions_delete_own') then
    create policy "forum_reactions_delete_own" on public.forum_reactions for delete to authenticated using (auth.uid() = user_id);
  end if;
end $$;

create index if not exists forum_reactions_target_idx on public.forum_reactions(target_type, target_id);
create index if not exists forum_reactions_user_idx on public.forum_reactions(user_id);


-- Storage bucket for forum uploads
insert into storage.buckets (id, name, public)
values ('forum-uploads', 'forum-uploads', true)
on conflict (id) do nothing;

-- Anyone can read forum uploads
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='forum_uploads_read_public') then
    create policy "forum_uploads_read_public" on storage.objects for select using (bucket_id = 'forum-uploads');
  end if;
end $$;

-- Authenticated users can upload to forum-uploads
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='forum_uploads_insert_authed') then
    create policy "forum_uploads_insert_authed" on storage.objects for insert to authenticated with check (bucket_id = 'forum-uploads');
  end if;
end $$;


-- ============================================================
-- 5. Auto-subscribe thread author on thread creation
-- ============================================================
create or replace function public.auto_subscribe_thread_author()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.forum_subscriptions (user_id, thread_id, type)
  values (new.author_id, new.id, 'thread')
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_forum_thread_created on public.forum_threads;
create trigger on_forum_thread_created
  after insert on public.forum_threads
  for each row execute function public.auto_subscribe_thread_author();
