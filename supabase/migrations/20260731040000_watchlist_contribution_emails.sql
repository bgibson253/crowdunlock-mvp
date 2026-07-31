-- Throttle tracking for watchlist contribution emails:
-- one row per (user, upload), updated each send.

create table if not exists public.watchlist_contribution_emails (
  user_id uuid not null references auth.users(id) on delete cascade,
  upload_id uuid not null references public.uploads(id) on delete cascade,
  sent_at timestamptz not null default now(),
  primary key (user_id, upload_id)
);

alter table public.watchlist_contribution_emails enable row level security;
-- Service role only (written from webhook path); no client policies.
