-- DMCA claims, notification digest preferences, onboarding, user interests

-- ══════════════════════════════════════════════
-- 1. DMCA CLAIMS TABLE
-- ══════════════════════════════════════════════

create table if not exists public.dmca_claims (
  id               uuid primary key default gen_random_uuid(),
  claimant_name    text not null,
  claimant_email   text not null,
  copyrighted_work text not null,
  infringing_url   text not null,
  statement        text not null,
  signature        text not null,
  status           text not null default 'pending',
  created_at       timestamptz not null default now(),
  resolved_at      timestamptz,
  resolved_by      uuid references auth.users(id) on delete set null
);

alter table public.dmca_claims enable row level security;

-- Admins can read all DMCA claims
create policy "dmca_claims_admin_read" on public.dmca_claims
  for select to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

-- Admins can update DMCA claims (resolve)
create policy "dmca_claims_admin_update" on public.dmca_claims
  for update to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

-- Anyone can insert a DMCA claim (public submission)
create policy "dmca_claims_public_insert" on public.dmca_claims
  for insert to anon, authenticated
  with check (true);

-- ══════════════════════════════════════════════
-- 2. NOTIFICATION DIGEST PREFERENCES
-- ══════════════════════════════════════════════

-- Add email_digest_frequency to notification_preferences
alter table public.notification_preferences
  add column if not exists email_digest_frequency text not null default 'instant';

-- Add last_digest_sent_at to profiles for tracking
alter table public.profiles
  add column if not exists last_digest_sent_at timestamptz;

-- Add emailed flag to forum_notifications for digest tracking
alter table public.forum_notifications
  add column if not exists emailed boolean not null default false;

-- ══════════════════════════════════════════════
-- 3. ONBOARDING
-- ══════════════════════════════════════════════

alter table public.profiles
  add column if not exists has_onboarded boolean not null default false;

-- Backfill: mark existing users with display_name as onboarded
update public.profiles
  set has_onboarded = true
  where display_name is not null and display_name != '';

-- ══════════════════════════════════════════════
-- 4. USER INTERESTS TABLE
-- ══════════════════════════════════════════════

create table if not exists public.user_interests (
  user_id     uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, category_id)
);

alter table public.user_interests enable row level security;

create policy "user_interests_read_own" on public.user_interests
  for select to authenticated using (user_id = auth.uid());

create policy "user_interests_insert_own" on public.user_interests
  for insert to authenticated with check (user_id = auth.uid());

create policy "user_interests_delete_own" on public.user_interests
  for delete to authenticated using (user_id = auth.uid());

-- Public read for profiles that share their interests
create policy "user_interests_public_read" on public.user_interests
  for select to anon using (true);
