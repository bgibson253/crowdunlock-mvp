-- Forum sections + mapping uploads -> thread

create table if not exists public.forum_sections (
  id text primary key,
  name text not null,
  description text null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.forum_sections enable row level security;

-- Public read
create policy "forum_sections_read_public" on public.forum_sections
  for select using (true);

-- Only service/admin can write (no UI yet)
create policy "forum_sections_write_service" on public.forum_sections
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

alter table public.forum_threads
  add column if not exists section_id text null references public.forum_sections(id);

alter table public.forum_threads
  add column if not exists upload_id uuid null references public.uploads(id) on delete cascade;

create unique index if not exists forum_threads_upload_id_unique
  on public.forum_threads(upload_id)
  where upload_id is not null;

-- default sections
insert into public.forum_sections (id, name, description, sort_order)
values
  ('general', 'General Discussion', 'Announcements, questions, meta, and everything else.', 10),
  ('request_story', 'Request Story', 'Request an investigation or article.', 20),
  ('request_data', 'Request Data', 'Request datasets, documents, FOIAs, and analysis.', 30),
  ('request_video', 'Request Video', 'Request interviews, documentaries, and on-the-ground video.', 40),
  ('listed_stories', 'Listed Stories', 'Auto-generated threads for new story uploads.', 100),
  ('listed_data', 'Listed Data', 'Auto-generated threads for new data uploads.', 110),
  ('listed_videos', 'Listed Videos', 'Auto-generated threads for new video uploads.', 120)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order;
