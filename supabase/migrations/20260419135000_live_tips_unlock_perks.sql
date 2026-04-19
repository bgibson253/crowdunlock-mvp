-- Ensure live tips contribute to points/perks progress (non-cash) in test/prod.
-- Strategy: when a live_tip completes, mint points to the TIPPER (already done)
-- AND also add the gross tip amount to the tipper's spend milestones via contributions-style ledger.

-- Create a simple table to track user spend from live tips (for perks/milestones)
create table if not exists public.user_spend_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null, -- e.g. 'live_tip'
  amount_cents bigint not null,
  currency text not null default 'usd',
  ref_type text,
  ref_id text,
  created_at timestamp not null default now(),
  constraint user_spend_events_ref_uniq unique (user_id, ref_type, ref_id)
);

alter table public.user_spend_events enable row level security;

drop policy if exists "user_spend_events_select_own" on public.user_spend_events;
create policy "user_spend_events_select_own"
on public.user_spend_events
for select
to authenticated
using (user_id = auth.uid());

-- service role can insert
-- (webhook inserts through service role key)
