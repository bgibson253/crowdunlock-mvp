-- Social verification: track verification status for linked social accounts
-- Users enter username, get a code, put it in their bio, we verify.

create table if not exists public.social_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  platform text not null check (platform in ('twitter', 'instagram', 'tiktok', 'reddit')),
  username text not null,
  verification_code text not null,
  verified boolean not null default false,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  unique(user_id, platform)
);

alter table public.social_verifications enable row level security;

-- Users can read their own verifications
create policy "social_verifications_read_own"
on public.social_verifications
for select to authenticated
using (auth.uid() = user_id);

-- Users can insert their own
create policy "social_verifications_insert_own"
on public.social_verifications
for insert to authenticated
with check (auth.uid() = user_id);

-- Users can update their own
create policy "social_verifications_update_own"
on public.social_verifications
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Users can delete their own (disconnect)
create policy "social_verifications_delete_own"
on public.social_verifications
for delete to authenticated
using (auth.uid() = user_id);
