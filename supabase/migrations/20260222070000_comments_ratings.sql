-- Comments + ratings (post-unlock)

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  upload_id uuid not null references public.uploads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamp default now()
);

create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  upload_id uuid not null references public.uploads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  stars integer not null check (stars between 1 and 5),
  created_at timestamp default now(),
  constraint ratings_unique_user_per_upload unique (upload_id, user_id)
);

alter table public.comments enable row level security;
alter table public.ratings enable row level security;

-- Comments: authenticated users can comment only on unlocked uploads
create policy "comments_insert_on_unlocked"
on public.comments
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (select 1 from public.uploads u where u.id = upload_id and u.status = 'unlocked')
);

-- Comments readable by public only when upload is unlocked
create policy "comments_select_public_on_unlocked"
on public.comments
for select
to public
using (exists (select 1 from public.uploads u where u.id = upload_id and u.status = 'unlocked'));

-- Ratings: authenticated users can rate only unlocked uploads
create policy "ratings_upsert_on_unlocked"
on public.ratings
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (select 1 from public.uploads u where u.id = upload_id and u.status = 'unlocked')
);

create policy "ratings_update_own"
on public.ratings
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Ratings readable by public only when upload is unlocked
create policy "ratings_select_public_on_unlocked"
on public.ratings
for select
to public
using (exists (select 1 from public.uploads u where u.id = upload_id and u.status = 'unlocked'));
