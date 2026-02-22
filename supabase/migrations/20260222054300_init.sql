-- CrowdUnlock MVP schema

create extension if not exists "pgcrypto";
create extension if not exists "pg_cron";

create table if not exists public.uploads (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  uploader_id uuid references auth.users,
  why_it_matters text not null,
  tags text[],
  file_path text,
  ai_teaser text,
  quality_score integer,
  status text default 'private' check (status in ('private','funding','unlocked','rejected')),
  funding_goal integer default 500,
  current_funded integer default 0,
  posting_fee_payment_intent_id text,
  created_at timestamp default now(),
  constraint why_it_matters_min_len check (char_length(why_it_matters) >= 100)
);

create table if not exists public.contributions (
  id uuid primary key default gen_random_uuid(),
  upload_id uuid references public.uploads,
  user_id uuid references auth.users,
  amount integer not null,
  created_at timestamp default now()
);

alter table public.uploads enable row level security;
alter table public.contributions enable row level security;

create or replace view public.uploads_public as
select
  id,
  title,
  tags,
  ai_teaser,
  quality_score,
  status,
  funding_goal,
  current_funded,
  created_at
from public.uploads
where status in ('funding','unlocked');

create policy "uploads_insert_own"
on public.uploads
for insert
to authenticated
with check (uploader_id = auth.uid());

create policy "uploads_update_own"
on public.uploads
for update
to authenticated
using (uploader_id = auth.uid())
with check (uploader_id = auth.uid());

create policy "contributions_insert_auth"
on public.contributions
for insert
to authenticated
with check (user_id = auth.uid());

create policy "contributions_select_own"
on public.contributions
for select
to authenticated
using (user_id = auth.uid());

insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', false)
on conflict (id) do nothing;

create policy "uploads_bucket_owner_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'uploads'
  and (owner = auth.uid())
);

create policy "uploads_bucket_public_read_if_unlocked"
on storage.objects
for select
to public
using (
  bucket_id = 'uploads'
  and exists (
    select 1
    from public.uploads u
    where u.file_path = (storage.objects.bucket_id || '/' || storage.objects.name)
      and u.status = 'unlocked'
  )
);

create or replace function public.posting_fee_refund_candidates()
returns table(upload_id uuid, payment_intent_id text)
language sql
security definer
as $$
  select id, posting_fee_payment_intent_id
  from public.uploads
  where created_at < now() - interval '180 days'
    and status <> 'unlocked'
    and posting_fee_payment_intent_id is not null
$$;

select cron.schedule(
  'refund_posting_fees_daily_0200_utc',
  '0 2 * * *',
  $$select * from public.posting_fee_refund_candidates();$$
);
