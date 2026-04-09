-- Replace unlock_mode/unlock_at with funding_deadline/deadline_at
-- funding_deadline: how long contributors have to fully fund before refund
-- deadline_at: computed timestamp (created_at + deadline duration)

-- Add new columns
alter table public.uploads add column if not exists funding_deadline text not null default '90d';
alter table public.uploads add column if not exists deadline_at timestamptz;

-- Migrate existing data
update public.uploads
set funding_deadline = case
  when unlock_mode = 'timed_24h' then '30d'
  when unlock_mode = 'timed_48h' then '30d'
  when unlock_mode = 'timed_7d' then '30d'
  when unlock_mode = 'manual' then 'none'
  else '90d'
end
where unlock_mode is not null;

-- Compute deadline_at for existing uploads that have a deadline
update public.uploads
set deadline_at = case funding_deadline
  when '30d' then created_at + interval '30 days'
  when '60d' then created_at + interval '60 days'
  when '90d' then created_at + interval '90 days'
  when '180d' then created_at + interval '180 days'
  when '365d' then created_at + interval '365 days'
  else null
end
where funding_deadline <> 'none' and deadline_at is null;

-- Auto-set deadline_at on insert
create or replace function public.set_upload_deadline()
returns trigger language plpgsql as $$
begin
  if NEW.funding_deadline is not null and NEW.funding_deadline <> 'none' and NEW.deadline_at is null then
    NEW.deadline_at := NEW.created_at + case NEW.funding_deadline
      when '30d' then interval '30 days'
      when '60d' then interval '60 days'
      when '90d' then interval '90 days'
      when '180d' then interval '180 days'
      when '365d' then interval '365 days'
      else interval '90 days'
    end;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_set_upload_deadline on public.uploads;
create trigger trg_set_upload_deadline
  before insert or update of funding_deadline on public.uploads
  for each row execute function public.set_upload_deadline();

-- Drop old columns (keep them nullable for now to avoid breaking running queries)
-- alter table public.uploads drop column if exists unlock_mode;
-- alter table public.uploads drop column if exists unlock_at;
