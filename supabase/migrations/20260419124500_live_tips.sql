-- Live tips: record tip events for hosts/rooms; webhook inserts.

create table if not exists public.live_tips (
  id uuid primary key default gen_random_uuid(),
  live_room_id uuid,
  host_user_id uuid not null references public.profiles(id) on delete cascade,
  tipper_user_id uuid references public.profiles(id) on delete set null,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'usd',
  platform_fee_amount integer not null default 0,
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  created_at timestamptz not null default now()
);

alter table public.live_tips enable row level security;

-- Add FK to live_rooms only if the table exists in this DB
-- (some environments may not have had the live rooms migration applied yet).
do $$ begin
  if to_regclass('public.live_rooms') is not null then
    alter table public.live_tips
      add constraint live_tips_live_room_fk
      foreign key (live_room_id) references public.live_rooms(id) on delete set null;
  end if;
end $$;

-- Anyone authed can read tips (used for overlay/recent tips if we add later)
drop policy if exists "live_tips_select_authed" on public.live_tips;
create policy "live_tips_select_authed"
on public.live_tips
for select
to authenticated
using (true);

-- service role inserts via webhook
-- allow insert only via service role key (RLS bypass) or future RPC;
-- leave insert disabled for authed users.
