-- Feature 1: Uploader-chosen unlock timing
alter table public.uploads
  add column if not exists unlock_mode text not null default 'instant'
    check (unlock_mode in ('instant', 'timed_24h', 'timed_48h', 'timed_7d', 'manual')),
  add column if not exists unlock_at timestamptz;

-- Feature 2: Backer updates / contributor comments
create table if not exists public.upload_updates (
  id uuid primary key default gen_random_uuid(),
  upload_id uuid not null references public.uploads(id) on delete cascade,
  author_id uuid not null references auth.users(id),
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_upload_updates_upload on public.upload_updates(upload_id);
create index if not exists idx_upload_updates_author on public.upload_updates(author_id);

alter table public.upload_updates enable row level security;

-- Public read
create policy "upload_updates_select_public"
on public.upload_updates for select
using (true);

-- Only the uploader of the upload can insert updates
create policy "upload_updates_insert_uploader"
on public.upload_updates for insert
with check (
  auth.uid() = author_id
  and exists (
    select 1 from public.uploads u
    where u.id = upload_id and u.uploader_id = auth.uid()
  )
);

-- Feature 4: Thumbnail URL for image previews
alter table public.uploads
  add column if not exists thumbnail_url text;

-- RPC: manual_unlock_upload — only callable by the upload's owner
create or replace function public.manual_unlock_upload(p_upload_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_upload record;
begin
  select id, uploader_id, status, unlock_mode, current_funded, funding_goal
  into v_upload
  from public.uploads
  where id = p_upload_id;

  if not found then
    raise exception 'Upload not found';
  end if;

  if v_upload.uploader_id is distinct from auth.uid() then
    raise exception 'Only the uploader can manually unlock';
  end if;

  if v_upload.unlock_mode <> 'manual' then
    raise exception 'Upload is not set to manual unlock mode';
  end if;

  if v_upload.status = 'unlocked' then
    raise exception 'Upload is already unlocked';
  end if;

  -- Must be fully funded first
  if v_upload.current_funded < v_upload.funding_goal then
    raise exception 'Upload is not yet fully funded';
  end if;

  update public.uploads
  set status = 'unlocked', unlock_at = now()
  where id = p_upload_id;
end;
$$;
