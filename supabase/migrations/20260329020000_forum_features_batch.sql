-- Forum Features Batch: soft-delete, view counts, locking, pinning, last_activity_at
-- Also: forum_reports table for thread/reply-level reporting (separate from content_reports)

------------------------------------------------------------
-- 1. SOFT DELETE: deleted_at on forum_threads and forum_replies
------------------------------------------------------------
alter table public.forum_threads add column if not exists deleted_at timestamptz;
alter table public.forum_replies add column if not exists deleted_at timestamptz;

------------------------------------------------------------
-- 2. VIEW COUNT
------------------------------------------------------------
alter table public.forum_threads add column if not exists view_count integer not null default 0;

-- RPC to increment view count (avoids RLS issues)
create or replace function public.increment_thread_view(p_thread_id uuid)
returns void
language plpgsql security definer
as $$
begin
  update public.forum_threads
  set view_count = view_count + 1
  where id = p_thread_id;
end;
$$;

grant execute on function public.increment_thread_view(uuid) to anon, authenticated;

------------------------------------------------------------
-- 3. THREAD LOCKING
------------------------------------------------------------
alter table public.forum_threads add column if not exists locked boolean not null default false;

------------------------------------------------------------
-- 4. THREAD PINNING
------------------------------------------------------------
alter table public.forum_threads add column if not exists pinned boolean not null default false;

------------------------------------------------------------
-- 5. LAST ACTIVITY TIMESTAMP
------------------------------------------------------------
alter table public.forum_threads add column if not exists last_activity_at timestamptz;

-- Backfill last_activity_at from created_at
update public.forum_threads
set last_activity_at = created_at
where last_activity_at is null;

-- Set default for new rows
alter table public.forum_threads alter column last_activity_at set default now();

-- Trigger: update last_activity_at when a reply is inserted
create or replace function public.update_thread_last_activity()
returns trigger
language plpgsql security definer
as $$
begin
  update public.forum_threads
  set last_activity_at = now()
  where id = new.thread_id;
  return new;
end;
$$;

drop trigger if exists on_reply_update_last_activity on public.forum_replies;
create trigger on_reply_update_last_activity
  after insert on public.forum_replies
  for each row execute function public.update_thread_last_activity();

-- Index for sorting
create index if not exists forum_threads_last_activity_idx
  on public.forum_threads (pinned desc, last_activity_at desc);

------------------------------------------------------------
-- 6. FORUM-LEVEL REPORTS (threads & replies, separate from content_reports)
------------------------------------------------------------
create table if not exists public.forum_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('thread', 'reply')),
  target_id uuid not null,
  category text not null check (category in ('spam', 'harassment', 'inappropriate', 'other')),
  details text,
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  unique (reporter_id, target_type, target_id)
);

alter table public.forum_reports enable row level security;

DO $$ BEGIN
  create policy forum_reports_insert_own on public.forum_reports
    for insert to authenticated
    with check (reporter_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  create policy forum_reports_read_own on public.forum_reports
    for select to authenticated
    using (reporter_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;

------------------------------------------------------------
-- 7. RLS policy for admin updates (lock/pin threads)
------------------------------------------------------------
-- Allow admins to update any thread (for lock/pin)
DO $$ BEGIN
  create policy forum_threads_admin_update on public.forum_threads
    for update to authenticated
    using (
      exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
    )
    with check (
      exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;
