-- Forum: best-in-world upgrades
-- 1) thread_interest: "I'd fund this" pledges of intent on request threads (proto-campaigns)
-- 2) forum_section_stats(): one aggregate call replacing full-table scans on the forum index
-- 3) realtime on forum_replies for live thread updates

-- ============================================================
-- 1) Thread interest (proto-campaign signal)
-- ============================================================
create table if not exists public.thread_interest (
  thread_id uuid not null references public.forum_threads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount_cents int null,              -- optional "I'd chip in about $X" signal
  created_at timestamptz not null default now(),
  primary key (thread_id, user_id)
);

alter table public.thread_interest enable row level security;

create policy "thread_interest_read_public" on public.thread_interest
  for select using (true);

create policy "thread_interest_insert_own" on public.thread_interest
  for insert with check (auth.uid() = user_id);

create policy "thread_interest_delete_own" on public.thread_interest
  for delete using (auth.uid() = user_id);

create policy "thread_interest_update_own" on public.thread_interest
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists thread_interest_thread_idx on public.thread_interest(thread_id);

-- Aggregate helper: interest stats for a thread in one call
create or replace function public.thread_interest_stats(p_thread_id uuid)
returns table (backers bigint, pledged_cents bigint)
language sql stable as $$
  select
    count(*)::bigint as backers,
    coalesce(sum(amount_cents), 0)::bigint as pledged_cents
  from public.thread_interest
  where thread_id = p_thread_id;
$$;

-- ============================================================
-- 2) Forum index stats in ONE call (was: full scan of threads + replies)
-- ============================================================
create or replace function public.forum_section_stats()
returns table (section_id text, threads_count bigint, replies_count bigint)
language sql stable as $$
  select
    t.section_id,
    count(distinct t.id)::bigint as threads_count,
    count(r.id)::bigint as replies_count
  from public.forum_threads t
  left join public.forum_replies r on r.thread_id = t.id and r.deleted_at is null
  where t.section_id is not null
    and t.deleted_at is null
  group by t.section_id;
$$;

-- ============================================================
-- 3) Realtime for live replies
-- ============================================================
do $$
begin
  alter publication supabase_realtime add table public.forum_replies;
exception when duplicate_object then
  null; -- already added
end $$;
