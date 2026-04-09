-- Email notifications: add email_notifications_enabled to profiles, add email_unlocks pref
-- Activity feed: no new tables needed (queries existing tables)

------------------------------------------------------------
-- Add email_notifications_enabled to profiles
------------------------------------------------------------
alter table public.profiles
  add column if not exists email_notifications_enabled boolean not null default true;

------------------------------------------------------------
-- Add email_unlocks preference to notification_preferences
------------------------------------------------------------
alter table public.notification_preferences
  add column if not exists email_unlocks boolean not null default true;

------------------------------------------------------------
-- Add read_at timestamp to forum_notifications for batch/delay pattern
------------------------------------------------------------
alter table public.forum_notifications
  add column if not exists read_at timestamptz;

-- Backfill read_at for already-read notifications
update public.forum_notifications
  set read_at = created_at
  where read = true and read_at is null;

-- When marking as read, also set read_at
create or replace function public.set_notification_read_at()
returns trigger as $$
begin
  if NEW.read = true and OLD.read = false then
    NEW.read_at = now();
  end if;
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists trg_set_notification_read_at on public.forum_notifications;
create trigger trg_set_notification_read_at
  before update on public.forum_notifications
  for each row execute function public.set_notification_read_at();

------------------------------------------------------------
-- Add hide_contributions to profiles for activity privacy
------------------------------------------------------------
alter table public.profiles
  add column if not exists hide_contributions boolean not null default false;
