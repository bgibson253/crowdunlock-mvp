-- Forum MVP: public read, authed write

create table if not exists public.forum_threads (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.forum_replies (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.forum_threads(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.forum_threads enable row level security;
alter table public.forum_replies enable row level security;

-- Public can read threads + replies
create policy "forum_threads_read_public" on public.forum_threads
  for select using (true);

create policy "forum_replies_read_public" on public.forum_replies
  for select using (true);

-- Authed users can create threads/replies as themselves
create policy "forum_threads_insert_self" on public.forum_threads
  for insert to authenticated
  with check (auth.uid() = author_id);

create policy "forum_replies_insert_self" on public.forum_replies
  for insert to authenticated
  with check (auth.uid() = author_id);

-- Authors can edit/delete their own content (optional but useful)
create policy "forum_threads_update_own" on public.forum_threads
  for update to authenticated
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

create policy "forum_threads_delete_own" on public.forum_threads
  for delete to authenticated
  using (auth.uid() = author_id);

create policy "forum_replies_update_own" on public.forum_replies
  for update to authenticated
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

create policy "forum_replies_delete_own" on public.forum_replies
  for delete to authenticated
  using (auth.uid() = author_id);

-- Helpful indexes
create index if not exists forum_threads_created_at_idx on public.forum_threads (created_at desc);
create index if not exists forum_replies_thread_id_created_at_idx on public.forum_replies (thread_id, created_at asc);
