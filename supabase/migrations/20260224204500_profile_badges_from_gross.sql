-- Compute badge label/icon directly from unlock_gross_cents.
-- Avoids trying to encode 17 tiers into a small enum.

create or replace function public.unlock_badge_label_for_gross(gross_cents bigint)
returns text
language sql
immutable
as $$
  select case
    when gross_cents >= 100000000 then 'The Final Reveal'
    when gross_cents >= 50000000 then 'The Unmasker'
    when gross_cents >= 25000000 then 'The Mask Breaker'
    when gross_cents >= 10000000 then 'The Vault Opens'
    when gross_cents >= 5000000 then 'Dealmaker'
    when gross_cents >= 2500000 then 'Shadow Sponsor'
    when gross_cents >= 1000000 then 'Kingmaker'
    when gross_cents >= 500000 then 'Quiet Backer'
    when gross_cents >= 200000 then 'Double-K Patron'
    when gross_cents >= 100000 then 'Four-Figure Financier'
    when gross_cents >= 75000 then 'Paper Trail'
    when gross_cents >= 50000 then 'Money Talks'
    when gross_cents >= 30000 then 'Three-Plate Stack'
    when gross_cents >= 20000 then 'It''s all about the Benjamins'
    when gross_cents >= 10000 then 'It''s all about the Benjamin'
    when gross_cents >= 5000 then 'Half Stack'
    when gross_cents >= 2000 then 'First Bill'
    else null
  end;
$$;

create or replace function public.unlock_badge_icon_for_gross(gross_cents bigint)
returns text
language sql
immutable
as $$
  select case
    when gross_cents >= 100000000 then '👁️'
    when gross_cents >= 50000000 then '🜁'
    when gross_cents >= 25000000 then '🎭⚡'
    when gross_cents >= 10000000 then '🗝️'
    when gross_cents >= 5000000 then '🤝💼'
    when gross_cents >= 2500000 then '🌑'
    when gross_cents >= 1000000 then '👑'
    when gross_cents >= 500000 then '🕶️'
    when gross_cents >= 200000 then '💎'
    when gross_cents >= 100000 then '🏦'
    when gross_cents >= 75000 then '🧾🕵️'
    when gross_cents >= 50000 then '📣💰'
    when gross_cents >= 30000 then '🧱'
    when gross_cents >= 20000 then '💵💵'
    when gross_cents >= 10000 then '💵'
    when gross_cents >= 5000 then '🟩'
    when gross_cents >= 2000 then '🧾'
    else null
  end;
$$;

drop view if exists public.profile_badges;

create view public.profile_badges as
select
  p.id,
  p.unlock_gross_cents,
  public.unlock_badge_label_for_gross(p.unlock_gross_cents) as unlock_tier_label,
  public.unlock_badge_icon_for_gross(p.unlock_gross_cents) as unlock_tier_icon
from public.profiles p;
