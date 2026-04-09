-- Upload reports, rate limiting RPC, and DM block enforcement
-- Features: upload_reports table, rate_limit_check RPC, DM block trigger

------------------------------------------------------------
-- 1. UPLOAD REPORTS TABLE
------------------------------------------------------------
create table if not exists public.upload_reports (
  id           uuid primary key default gen_random_uuid(),
  upload_id    uuid not null references public.uploads(id) on delete cascade,
  reporter_id  uuid not null references auth.users(id) on delete cascade,
  reason       text not null check (reason in ('Inappropriate','Copyright','Spam','Misleading','Other')),
  details      text,
  status       text not null default 'pending' check (status in ('pending','resolved','dismissed')),
  created_at   timestamptz not null default now(),
  resolved_at  timestamptz,
  resolved_by  uuid references auth.users(id) on delete set null,
  unique (upload_id, reporter_id)
);

create index if not exists idx_upload_reports_upload on public.upload_reports (upload_id);
create index if not exists idx_upload_reports_reporter on public.upload_reports (reporter_id);
create index if not exists idx_upload_reports_status on public.upload_reports (status);
alter table public.upload_reports enable row level security;

-- Authenticated users can insert their own reports
DO $$ BEGIN
  create policy upload_reports_insert_own on public.upload_reports
    for insert to authenticated
    with check (reporter_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Users can read their own reports
DO $$ BEGIN
  create policy upload_reports_read_own on public.upload_reports
    for select to authenticated
    using (reporter_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Admins can read all upload reports
DO $$ BEGIN
  create policy upload_reports_admin_read on public.upload_reports
    for select to authenticated
    using (
      exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Admins can update upload reports (resolve/dismiss)
DO $$ BEGIN
  create policy upload_reports_admin_update on public.upload_reports
    for update to authenticated
    using (
      exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

------------------------------------------------------------
-- 2. RATE LIMITING RPC
------------------------------------------------------------
-- Returns true if the action is allowed, false if rate-limited
-- action_type: 'upload' | 'thread' | 'reply'
-- Trust level multipliers: 0=1x, 1=1.25x, 2=1.5x, 3=2x, 4=3x
create or replace function public.rate_limit_check(
  p_user_id uuid,
  p_action_type text
) returns boolean
language plpgsql security definer
as $$
declare
  v_count int;
  v_limit int;
  v_window interval;
  v_trust_level int;
  v_multiplier numeric;
begin
  -- Get trust level
  select coalesce(trust_level, 0) into v_trust_level
  from public.profiles
  where id = p_user_id;

  -- Set multiplier based on trust level
  v_multiplier := case v_trust_level
    when 0 then 1.0
    when 1 then 1.25
    when 2 then 1.5
    when 3 then 2.0
    when 4 then 3.0
    else 1.0
  end;

  -- Set base limits and windows
  if p_action_type = 'upload' then
    v_limit := ceil(5 * v_multiplier);
    v_window := interval '1 hour';

    select count(*) into v_count
    from public.uploads
    where uploader_id = p_user_id
      and created_at > now() - v_window;

  elsif p_action_type = 'thread' then
    v_limit := ceil(20 * v_multiplier);
    v_window := interval '1 day';

    select count(*) into v_count
    from public.forum_threads
    where author_id = p_user_id
      and created_at > now() - v_window;

  elsif p_action_type = 'reply' then
    v_limit := ceil(60 * v_multiplier);
    v_window := interval '1 hour';

    select count(*) into v_count
    from public.forum_replies
    where author_id = p_user_id
      and created_at > now() - v_window;

  else
    return true; -- unknown action, allow
  end if;

  return v_count < v_limit;
end;
$$;

-- Also provide limit info for UI display
create or replace function public.rate_limit_info(
  p_user_id uuid,
  p_action_type text
) returns jsonb
language plpgsql security definer
as $$
declare
  v_count int;
  v_limit int;
  v_window interval;
  v_trust_level int;
  v_multiplier numeric;
  v_window_text text;
begin
  select coalesce(trust_level, 0) into v_trust_level
  from public.profiles
  where id = p_user_id;

  v_multiplier := case v_trust_level
    when 0 then 1.0
    when 1 then 1.25
    when 2 then 1.5
    when 3 then 2.0
    when 4 then 3.0
    else 1.0
  end;

  if p_action_type = 'upload' then
    v_limit := ceil(5 * v_multiplier);
    v_window := interval '1 hour';
    v_window_text := 'hour';
    select count(*) into v_count from public.uploads
    where uploader_id = p_user_id and created_at > now() - v_window;

  elsif p_action_type = 'thread' then
    v_limit := ceil(20 * v_multiplier);
    v_window := interval '1 day';
    v_window_text := 'day';
    select count(*) into v_count from public.forum_threads
    where author_id = p_user_id and created_at > now() - v_window;

  elsif p_action_type = 'reply' then
    v_limit := ceil(60 * v_multiplier);
    v_window := interval '1 hour';
    v_window_text := 'hour';
    select count(*) into v_count from public.forum_replies
    where author_id = p_user_id and created_at > now() - v_window;

  else
    return jsonb_build_object('allowed', true, 'count', 0, 'limit', 999, 'window', 'unknown');
  end if;

  return jsonb_build_object(
    'allowed', v_count < v_limit,
    'count', v_count,
    'limit', v_limit,
    'window', v_window_text,
    'remaining', greatest(0, v_limit - v_count)
  );
end;
$$;

------------------------------------------------------------
-- 3. DM BLOCK ENFORCEMENT (prevent DMs between blocked users)
------------------------------------------------------------
create or replace function public.check_dm_block()
returns trigger
language plpgsql security definer
as $$
begin
  -- Check if sender blocked recipient or recipient blocked sender
  if exists (
    select 1 from public.user_blocks
    where (blocker_id = NEW.sender_id and blocked_id = NEW.recipient_id)
       or (blocker_id = NEW.recipient_id and blocked_id = NEW.sender_id)
  ) then
    raise exception 'Cannot send messages to or from blocked users';
  end if;
  return NEW;
end;
$$;

-- Only create the trigger if forum_dms table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'forum_dms') THEN
    DROP TRIGGER IF EXISTS check_dm_block_trigger ON public.forum_dms;
    CREATE TRIGGER check_dm_block_trigger
      BEFORE INSERT ON public.forum_dms
      FOR EACH ROW EXECUTE FUNCTION public.check_dm_block();
  END IF;
END $$;
