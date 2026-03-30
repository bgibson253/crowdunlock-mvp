-- Profile settings overhaul: social accounts, signature flags, username change tracking, image cropping support
-- Add new social media columns
alter table public.profiles add column if not exists instagram text;
alter table public.profiles add column if not exists tiktok text;
alter table public.profiles add column if not exists reddit text;

-- Username change tracking (once per 6 months)
alter table public.profiles add column if not exists username_changed_at timestamptz;

-- Signature flags (what shows in forum post signatures)
alter table public.profiles add column if not exists sig_bio boolean not null default false;
alter table public.profiles add column if not exists sig_twitter boolean not null default false;
alter table public.profiles add column if not exists sig_instagram boolean not null default false;
alter table public.profiles add column if not exists sig_tiktok boolean not null default false;
alter table public.profiles add column if not exists sig_reddit boolean not null default false;

-- Drop columns we no longer need on the settings form (keep in DB for backward compat, just ignore)
-- website, location, github, linkedin are kept as columns but won't be editable in new UI
