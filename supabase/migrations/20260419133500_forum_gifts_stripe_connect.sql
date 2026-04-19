-- Forum gifts (coins) + creator cashout via Stripe Connect

-- Extend profiles with coin + earnings + stripe connect account
alter table public.profiles
  add column if not exists coins_balance bigint not null default 0,
  add column if not exists earnings_cents bigint not null default 0,
  add column if not exists stripe_connect_account_id text,
  add column if not exists stripe_connect_onboarded boolean not null default false;

-- Gift catalog
create table if not exists public.gift_catalog (
  id text primary key,
  name text not null,
  rarity text not null check (rarity in ('common','rare','legendary')),
  coin_cost bigint not null check (coin_cost > 0),
  is_active boolean not null default true,
  created_at timestamp not null default now()
);

alter table public.gift_catalog enable row level security;

drop policy if exists "gift_catalog_select_public" on public.gift_catalog;
create policy "gift_catalog_select_public"
on public.gift_catalog
for select
to public
using (is_active = true);

-- Forum gifts (anonymous on forum; sender_id stored for audit/fraud)
create table if not exists public.forum_gifts (
  id uuid primary key default gen_random_uuid(),
  post_type text not null check (post_type in ('thread','reply')),
  post_id uuid not null,
  sender_user_id uuid not null references auth.users(id) on delete cascade,
  receiver_user_id uuid not null references auth.users(id) on delete cascade,
  gift_id text not null references public.gift_catalog(id),
  coin_cost bigint not null,
  usd_value_cents bigint not null,
  platform_fee_cents bigint not null,
  net_earnings_cents bigint not null,
  stripe_payment_intent_id text,
  stripe_checkout_session_id text,
  created_at timestamp not null default now()
);

create index if not exists forum_gifts_post_idx on public.forum_gifts(post_type, post_id);
create index if not exists forum_gifts_receiver_idx on public.forum_gifts(receiver_user_id, created_at desc);

alter table public.forum_gifts enable row level security;

-- Public can see aggregate via a view/RPC; no direct select for authenticated users by default
-- Admin/service_role can read

drop policy if exists "forum_gifts_select_service_role" on public.forum_gifts;
create policy "forum_gifts_select_service_role"
on public.forum_gifts
for select
to service_role
using (true);

-- Creator earnings ledger (append-only)
create table if not exists public.creator_earnings_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  delta_cents bigint not null,
  reason text not null,
  ref_type text,
  ref_id text,
  created_at timestamp not null default now(),
  constraint creator_earnings_ref_uniq unique (user_id, ref_type, ref_id)
);

alter table public.creator_earnings_ledger enable row level security;

drop policy if exists "creator_earnings_select_own" on public.creator_earnings_ledger;
create policy "creator_earnings_select_own"
on public.creator_earnings_ledger
for select
to authenticated
using (user_id = auth.uid());

-- Coins ledger (append-only)
create table if not exists public.coins_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  delta_coins bigint not null,
  reason text not null,
  ref_type text,
  ref_id text,
  created_at timestamp not null default now(),
  constraint coins_ledger_ref_uniq unique (user_id, ref_type, ref_id)
);

alter table public.coins_ledger enable row level security;

drop policy if exists "coins_ledger_select_own" on public.coins_ledger;
create policy "coins_ledger_select_own"
on public.coins_ledger
for select
to authenticated
using (user_id = auth.uid());

-- Helpers (service_role only for mint from webhooks)
create or replace function public.apply_coins(
  p_user_id uuid,
  p_delta bigint,
  p_reason text,
  p_ref_type text default null,
  p_ref_id text default null
)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.coins_ledger(user_id, delta_coins, reason, ref_type, ref_id)
  values (p_user_id, p_delta, p_reason, p_ref_type, p_ref_id);

  update public.profiles
  set coins_balance = coins_balance + p_delta
  where id = p_user_id;
end;
$$;

revoke all on function public.apply_coins(uuid,bigint,text,text,text) from public;
grant execute on function public.apply_coins(uuid,bigint,text,text,text) to service_role;

create or replace function public.apply_earnings(
  p_user_id uuid,
  p_delta_cents bigint,
  p_reason text,
  p_ref_type text default null,
  p_ref_id text default null
)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.creator_earnings_ledger(user_id, delta_cents, reason, ref_type, ref_id)
  values (p_user_id, p_delta_cents, p_reason, p_ref_type, p_ref_id);

  update public.profiles
  set earnings_cents = earnings_cents + p_delta_cents
  where id = p_user_id;
end;
$$;

revoke all on function public.apply_earnings(uuid,bigint,text,text,text) from public;
grant execute on function public.apply_earnings(uuid,bigint,text,text,text) to service_role;

-- Public aggregate getter for forum post gift receipts (anonymous)
create or replace function public.get_forum_gift_summary(p_post_type text, p_post_id uuid)
returns table (
  gift_id text,
  gift_name text,
  rarity text,
  count bigint,
  total_coin_cost bigint,
  total_usd_value_cents bigint
)
language sql
stable
as $$
  select 
    fg.gift_id,
    gc.name as gift_name,
    gc.rarity,
    count(*)::bigint as count,
    sum(fg.coin_cost)::bigint as total_coin_cost,
    sum(fg.usd_value_cents)::bigint as total_usd_value_cents
  from public.forum_gifts fg
  join public.gift_catalog gc on gc.id = fg.gift_id
  where fg.post_type = p_post_type and fg.post_id = p_post_id
  group by fg.gift_id, gc.name, gc.rarity
  order by sum(fg.usd_value_cents) desc;
$$;

revoke all on function public.get_forum_gift_summary(text,uuid) from public;
grant execute on function public.get_forum_gift_summary(text,uuid) to public;
