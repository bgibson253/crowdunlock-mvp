-- Email notification preferences + user blocking + mark-as-solution

------------------------------------------------------------
-- Notification preferences
------------------------------------------------------------
create table if not exists public.notification_preferences (
  user_id         uuid primary key references auth.users(id) on delete cascade,
  email_replies   boolean not null default true,
  email_mentions  boolean not null default true,
  email_keywords  boolean not null default false,
  email_dms       boolean not null default true,
  push_enabled    boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

DO $$ BEGIN
  create policy notif_prefs_read_own on public.notification_preferences
    for select to authenticated using (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  create policy notif_prefs_insert_own on public.notification_preferences
    for insert to authenticated with check (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  create policy notif_prefs_update_own on public.notification_preferences
    for update to authenticated using (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;

------------------------------------------------------------
-- User blocking
------------------------------------------------------------
create table if not exists public.user_blocks (
  id          uuid primary key default gen_random_uuid(),
  blocker_id  uuid not null references auth.users(id) on delete cascade,
  blocked_id  uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (blocker_id, blocked_id)
);

create index if not exists idx_user_blocks_blocker on public.user_blocks (blocker_id);
create index if not exists idx_user_blocks_blocked on public.user_blocks (blocked_id);
alter table public.user_blocks enable row level security;

DO $$ BEGIN
  create policy blocks_read_own on public.user_blocks
    for select to authenticated using (blocker_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  create policy blocks_insert_own on public.user_blocks
    for insert to authenticated with check (blocker_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  create policy blocks_delete_own on public.user_blocks
    for delete to authenticated using (blocker_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;

------------------------------------------------------------
-- Mark-as-solution (best answer on thread replies)
------------------------------------------------------------
alter table public.forum_threads
  add column if not exists solution_reply_id uuid references public.forum_replies(id) on delete set null;
