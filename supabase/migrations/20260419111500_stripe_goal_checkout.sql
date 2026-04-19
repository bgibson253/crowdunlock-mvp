-- Stripe-backed goal contributions + tips + fee accounting

-- Add Stripe + refund accounting to contributions
alter table public.contributions
  add column if not exists currency text not null default 'usd',
  add column if not exists stripe_checkout_session_id text,
  add column if not exists stripe_payment_intent_id text,
  add column if not exists tip_amount integer not null default 0,
  add column if not exists platform_fee_amount integer not null default 0,
  add column if not exists refunded_at timestamp,
  add column if not exists refund_stripe_id text;

-- Ensure Stripe ids are not duplicated
create unique index if not exists contributions_stripe_checkout_session_id_uniq
  on public.contributions(stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

create unique index if not exists contributions_stripe_payment_intent_id_uniq
  on public.contributions(stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

-- Upload (goal) timeline + Stripe fee settings
alter table public.uploads
  add column if not exists deadline_at timestamp,
  add column if not exists fee_bps integer not null default 500, -- 5%
  add column if not exists allow_tips boolean not null default true,
  add column if not exists is_refundable boolean not null default true;

-- Only goals with a deadline are refundable (per Ben decision)
-- If deadline_at is null => no refunds.
create or replace function public.set_upload_refundable_from_deadline()
returns trigger
language plpgsql
as $$
begin
  new.is_refundable := (new.deadline_at is not null);
  return new;
end;
$$;

drop trigger if exists trg_uploads_set_refundable on public.uploads;
create trigger trg_uploads_set_refundable
before insert or update of deadline_at on public.uploads
for each row
execute function public.set_upload_refundable_from_deadline();

-- Helper view for funding pages (includes deadline + refund policy)
create or replace view public.uploads_funding as
select
  u.id,
  u.title,
  u.tags,
  u.ai_teaser,
  u.quality_score,
  u.status,
  u.funding_goal,
  u.current_funded,
  u.deadline_at,
  u.is_refundable,
  u.fee_bps,
  u.allow_tips,
  u.created_at
from public.uploads u
where u.status in ('funding','unlocked');
