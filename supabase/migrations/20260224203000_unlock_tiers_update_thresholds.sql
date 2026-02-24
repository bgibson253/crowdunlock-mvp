-- Update unlock tier thresholds + labels per latest spec
-- NOTE: We keep enum values stable, but update mapping functions.

create or replace function public.unlock_tier_for_gross(gross_cents bigint)
returns public.unlock_tier
language sql
immutable
as $$
  select case
    when gross_cents >= 100000000 then 'legend'::public.unlock_tier          -- $1,000,000+
    when gross_cents >= 50000000 then 'whale'::public.unlock_tier            -- $500,000+
    when gross_cents >= 25000000 then 'midas'::public.unlock_tier            -- $250,000+
    when gross_cents >= 10000000 then 'cash_vault'::public.unlock_tier       -- $100,000+
    when gross_cents >= 5000000 then 'money_printer'::public.unlock_tier     -- $50,000+
    when gross_cents >= 2000000 then 'stacking_hundreds'::public.unlock_tier -- $20,000+
    when gross_cents >= 1000000 then 'all_about_the_benjamins'::public.unlock_tier -- $10,000+
    when gross_cents >= 500000 then 'all_about_the_benjamin'::public.unlock_tier   -- $5,000+
    when gross_cents >= 200000 then 'first_bill'::public.unlock_tier         -- $2,000+
    else 'none'::public.unlock_tier
  end;
$$;

create or replace function public.unlock_tier_label(tier public.unlock_tier)
returns text
language sql
immutable
as $$
  select case tier
    when 'first_bill' then 'Double-K Patron'
    when 'all_about_the_benjamin' then 'Quiet Backer'
    when 'all_about_the_benjamins' then 'Kingmaker'
    when 'stacking_hundreds' then 'Shadow Sponsor'
    when 'money_printer' then 'Dealmaker'
    when 'cash_vault' then 'The Vault Opens'
    when 'midas' then 'The Mask Breaker'
    when 'whale' then 'The Unmasker'
    when 'legend' then 'The Final Reveal'
    else null
  end;
$$;

create or replace function public.unlock_tier_icon(tier public.unlock_tier)
returns text
language sql
immutable
as $$
  select case tier
    when 'first_bill' then '💎'
    when 'all_about_the_benjamin' then '🕶️'
    when 'all_about_the_benjamins' then '👑'
    when 'stacking_hundreds' then '🌑'
    when 'money_printer' then '🤝💼'
    when 'cash_vault' then '🗝️'
    when 'midas' then '🎭⚡'
    when 'whale' then '🜁'
    when 'legend' then '👁️'
    else null
  end;
$$;

-- Recompute tiers for all profiles
update public.profiles
set unlock_tier = public.unlock_tier_for_gross(unlock_gross_cents);
