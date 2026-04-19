-- Non-cash points economy (minted from platform fee) + spendable pin/highlight perks

-- Store point balance on profiles for fast reads
alter table public.profiles
  add column if not exists points_balance bigint not null default 0;

-- Ledger for points (auditable)
create table if not exists public.points_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  delta_points bigint not null,
  reason text not null,
  ref_type text,
  ref_id text,
  created_at timestamp not null default now(),
  constraint points_ledger_ref_uniq unique (user_id, ref_type, ref_id)
);

alter table public.points_ledger enable row level security;

-- Users can see their own ledger
drop policy if exists "points_ledger_select_own" on public.points_ledger;
create policy "points_ledger_select_own"
on public.points_ledger
for select
to authenticated
using (user_id = auth.uid());

-- Users cannot arbitrarily insert; all mints/spends happen via security definer functions
drop policy if exists "points_ledger_no_insert" on public.points_ledger;
create policy "points_ledger_no_insert"
on public.points_ledger
for insert
to authenticated
with check (false);

-- allow service role to select (debug/admin tooling)
drop policy if exists "points_ledger_select_service_role" on public.points_ledger;
create policy "points_ledger_select_service_role"
on public.points_ledger
for select
to service_role
using (true);

-- Atomic apply points helper
create or replace function public.apply_points(
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
  insert into public.points_ledger(user_id, delta_points, reason, ref_type, ref_id)
  values (p_user_id, p_delta, p_reason, p_ref_type, p_ref_id);

  update public.profiles
  set points_balance = points_balance + p_delta
  where id = p_user_id;
end;
$$;

revoke all on function public.apply_points(uuid,bigint,text,text,text) from public;

grant execute on function public.apply_points(uuid,bigint,text,text,text) to service_role;

-- Thread pins (7-day increments allowed / stackable)
create table if not exists public.thread_pins (
  thread_id uuid primary key references public.forum_threads(id) on delete cascade,
  pinned_until timestamp not null,
  pinned_by uuid not null references auth.users(id) on delete set null,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

alter table public.thread_pins enable row level security;

drop policy if exists "thread_pins_select_public" on public.thread_pins;
create policy "thread_pins_select_public"
on public.thread_pins
for select
to public
using (true);

-- Reply highlights (7-day increments allowed / stackable)
create table if not exists public.reply_highlights (
  reply_id uuid primary key references public.forum_replies(id) on delete cascade,
  highlighted_until timestamp not null,
  highlighted_by uuid not null references auth.users(id) on delete set null,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

alter table public.reply_highlights enable row level security;

drop policy if exists "reply_highlights_select_public" on public.reply_highlights;
create policy "reply_highlights_select_public"
on public.reply_highlights
for select
to public
using (true);

-- Spend helpers (costs in points):
-- pin thread 7 days = 500 points (=$5)
-- highlight reply 7 days = 100 points (=$1)
create or replace function public.spend_points_for_thread_pin(p_thread_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_user uuid;
  v_now timestamp := now();
  v_existing_until timestamp;
  v_new_until timestamp;
  v_cost bigint := 500;
  v_balance bigint;
begin
  v_user := auth.uid();
  if v_user is null then
    raise exception 'not_authenticated';
  end if;

  select points_balance into v_balance from public.profiles where id = v_user;
  if v_balance is null then raise exception 'profile_missing'; end if;
  if v_balance < v_cost then raise exception 'insufficient_points'; end if;

  select pinned_until into v_existing_until from public.thread_pins where thread_id = p_thread_id;
  if v_existing_until is null or v_existing_until < v_now then
    v_new_until := v_now + interval '7 days';
  else
    v_new_until := v_existing_until + interval '7 days';
  end if;

  insert into public.thread_pins(thread_id, pinned_until, pinned_by)
  values (p_thread_id, v_new_until, v_user)
  on conflict (thread_id)
  do update set pinned_until = excluded.pinned_until, pinned_by = excluded.pinned_by, updated_at = now();

  perform public.apply_points(v_user, -v_cost, 'thread_pin', 'forum_thread', p_thread_id::text);
end;
$$;

create or replace function public.spend_points_for_reply_highlight(p_reply_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_user uuid;
  v_now timestamp := now();
  v_existing_until timestamp;
  v_new_until timestamp;
  v_cost bigint := 100;
  v_balance bigint;
begin
  v_user := auth.uid();
  if v_user is null then
    raise exception 'not_authenticated';
  end if;

  select points_balance into v_balance from public.profiles where id = v_user;
  if v_balance is null then raise exception 'profile_missing'; end if;
  if v_balance < v_cost then raise exception 'insufficient_points'; end if;

  select highlighted_until into v_existing_until from public.reply_highlights where reply_id = p_reply_id;
  if v_existing_until is null or v_existing_until < v_now then
    v_new_until := v_now + interval '7 days';
  else
    v_new_until := v_existing_until + interval '7 days';
  end if;

  insert into public.reply_highlights(reply_id, highlighted_until, highlighted_by)
  values (p_reply_id, v_new_until, v_user)
  on conflict (reply_id)
  do update set highlighted_until = excluded.highlighted_until, highlighted_by = excluded.highlighted_by, updated_at = now();

  perform public.apply_points(v_user, -v_cost, 'reply_highlight', 'forum_reply', p_reply_id::text);
end;
$$;

-- Allow authenticated users to execute spend functions
revoke all on function public.spend_points_for_thread_pin(uuid) from public;
revoke all on function public.spend_points_for_reply_highlight(uuid) from public;

grant execute on function public.spend_points_for_thread_pin(uuid) to authenticated;
grant execute on function public.spend_points_for_reply_highlight(uuid) to authenticated;
