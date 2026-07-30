-- Align profile_badges view functions with the new 9-tier ladder.
-- The 20260730210000 migration updated unlock_tier_label(tier) etc., but the
-- profile_badges view (what the forum actually reads via fetchProfileBadge)
-- uses unlock_badge_label_for_gross / unlock_badge_icon_for_gross — which
-- still returned the old 17-tier labels. This makes them match
-- src/lib/unlock-tiers.ts exactly (labels must match VARIANT_BY_LABEL in
-- src/components/badges/unlock-badge.tsx for the vector badges to render).

create or replace function public.unlock_badge_label_for_gross(gross_cents bigint)
returns text
language sql
immutable
as $$
  select case
    when gross_cents >= 10000000 then 'Unmaskr Legend'                    -- $100,000+
    when gross_cents >= 5000000  then 'The Whale'                        -- $50,000+
    when gross_cents >= 1000000  then 'Midas Touch'                      -- $10,000+
    when gross_cents >= 500000   then 'Cash Vault'                       -- $5,000+
    when gross_cents >= 100000   then 'Money Printer'                    -- $1,000+
    when gross_cents >= 50000    then 'Stacking Hundreds'                -- $500+
    when gross_cents >= 20000    then 'It''s All About the Benjamins'    -- $200+
    when gross_cents >= 10000    then 'It''s All About the Benjamin'     -- $100+
    when gross_cents >= 2000     then 'First Bill'                       -- $20+
    else null
  end;
$$;

create or replace function public.unlock_badge_icon_for_gross(gross_cents bigint)
returns text
language sql
immutable
as $$
  select case
    when gross_cents >= 10000000 then '👁️⚡'
    when gross_cents >= 5000000  then '🐋'
    when gross_cents >= 1000000  then '👑✨'
    when gross_cents >= 500000   then '🏦'
    when gross_cents >= 100000   then '🖨️💸'
    when gross_cents >= 50000    then '💰'
    when gross_cents >= 20000    then '💵💵'
    when gross_cents >= 10000    then '💵'
    when gross_cents >= 2000     then '🧾'
    else null
  end;
$$;
