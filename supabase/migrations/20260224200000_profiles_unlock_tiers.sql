-- Unlock tiers based on *gross unlock purchases* (sum of contributions.amount)
-- Adds a computed badge + icon that can be displayed next to a user.

create type public.unlock_tier as enum (
  'none',
  'first_bill',
  'all_about_the_benjamin',
  'all_about_the_benjamins',
  'stacking_hundreds',
  'money_printer',
  'cash_vault',
  'midas',
  'whale',
  'legend'
);

alter table public.profiles
  add column if not exists unlock_gross_cents bigint not null default 0,
  add column if not exists unlock_tier public.unlock_tier not null default 'none';

-- Backfill gross cents from contributions table (amount is stored in cents)
update public.profiles p
set unlock_gross_cents = coalesce(x.gross, 0)
from (
  select user_id, sum(amount)::bigint as gross
  from public.contributions
  group by user_id
) x
where p.id = x.user_id;

-- Tier assignment + labels
create or replace function public.unlock_tier_for_gross(gross_cents bigint)
returns public.unlock_tier
language sql
immutable
as $$
  select case
    when gross_cents >= 1000000 then 'legend'::public.unlock_tier          -- $10,000+
    when gross_cents >= 500000 then 'whale'::public.unlock_tier           -- $5,000+
    when gross_cents >= 250000 then 'midas'::public.unlock_tier           -- $2,500+
    when gross_cents >= 100000 then 'cash_vault'::public.unlock_tier      -- $1,000+
    when gross_cents >= 50000 then 'money_printer'::public.unlock_tier    -- $500+
    when gross_cents >= 30000 then 'stacking_hundreds'::public.unlock_tier-- $300+
    when gross_cents >= 20000 then 'all_about_the_benjamins'::public.unlock_tier -- $200+
    when gross_cents >= 10000 then 'all_about_the_benjamin'::public.unlock_tier  -- $100+
    when gross_cents >= 2000 then 'first_bill'::public.unlock_tier        -- $20+
    else 'none'::public.unlock_tier
  end;
$$;

create or replace function public.unlock_tier_label(tier public.unlock_tier)
returns text
language sql
immutable
as $$
  select case tier
    when 'first_bill' then 'First Bill'
    when 'all_about_the_benjamin' then 'It''s all about the Benjamin'
    when 'all_about_the_benjamins' then 'It''s all about the Benjamins'
    when 'stacking_hundreds' then 'Stacking Hundreds'
    when 'money_printer' then 'Money Printer'
    when 'cash_vault' then 'Cash Vault'
    when 'midas' then 'Midas Touch'
    when 'whale' then 'Whale'
    when 'legend' then 'Legend'
    else null
  end;
$$;

create or replace function public.unlock_tier_icon(tier public.unlock_tier)
returns text
language sql
immutable
as $$
  -- simple “little pictures” via emoji for now; can be swapped to SVG later
  select case tier
    when 'first_bill' then '💵'
    when 'all_about_the_benjamin' then '💯'
    when 'all_about_the_benjamins' then '🤑'
    when 'stacking_hundreds' then '📈'
    when 'money_printer' then '🖨️'
    when 'cash_vault' then '🏦'
    when 'midas' then '👑'
    when 'whale' then '🐳'
    when 'legend' then '🏆'
    else null
  end;
$$;

-- Keep tier in sync when unlock_gross_cents changes
create or replace function public.set_unlock_tier_from_gross()
returns trigger
language plpgsql
as $$
begin
  new.unlock_tier := public.unlock_tier_for_gross(new.unlock_gross_cents);
  return new;
end;
$$;

drop trigger if exists trg_profiles_set_unlock_tier on public.profiles;
create trigger trg_profiles_set_unlock_tier
before insert or update of unlock_gross_cents on public.profiles
for each row
execute function public.set_unlock_tier_from_gross();

-- Maintain gross + tier when a contribution is created (gross unlock purchase)
create or replace function public.bump_unlock_gross_on_contribution()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.profiles
  set unlock_gross_cents = unlock_gross_cents + new.amount
  where id = new.user_id;
  return new;
end;
$$;

drop trigger if exists trg_contributions_bump_unlock_gross on public.contributions;
create trigger trg_contributions_bump_unlock_gross
after insert on public.contributions
for each row
execute function public.bump_unlock_gross_on_contribution();

-- Public-safe view for displaying badges (avoid exposing emails)
create or replace view public.profile_badges as
select
  p.id,
  p.unlock_gross_cents,
  p.unlock_tier,
  public.unlock_tier_label(p.unlock_tier) as unlock_tier_label,
  public.unlock_tier_icon(p.unlock_tier) as unlock_tier_icon
from public.profiles p;
