-- Two features:
-- 1) Anonymous posting: is_anonymous flag on threads/replies. Author keeps
--    earning points/achievements (author_id unchanged); display code hides
--    identity when the flag is set.
-- 2) Realtime contribution ticker: public feed of contribution events
--    (no contributor identity), broadcast via supabase_realtime.

-- ── Anonymous posting ──
alter table public.forum_threads
  add column if not exists is_anonymous boolean not null default false;

alter table public.forum_replies
  add column if not exists is_anonymous boolean not null default false;

-- ── Contribution ticker feed ──
create table if not exists public.contribution_events (
  id uuid primary key default gen_random_uuid(),
  upload_id uuid not null references public.uploads(id) on delete cascade,
  upload_title text not null,
  amount_cents int not null,
  pct_funded int not null,
  created_at timestamptz not null default now()
);

alter table public.contribution_events enable row level security;

-- Public read (it's a public ticker); writes only via service role.
create policy "contribution_events_read_public" on public.contribution_events
  for select using (true);

create index if not exists contribution_events_created_idx
  on public.contribution_events(created_at desc);

do $$
begin
  alter publication supabase_realtime add table public.contribution_events;
exception when duplicate_object then
  null;
end $$;
