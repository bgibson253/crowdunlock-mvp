-- 1. Edit timestamps for threads and replies
alter table public.forum_threads add column if not exists edited_at timestamptz;
alter table public.forum_replies add column if not exists edited_at timestamptz;

-- 2. Set Unmaskr user as admin
update public.profiles set is_admin = true where username = 'Unmaskr';

-- 3. Admin can read all forum_reports
DO $$ BEGIN
  create policy forum_reports_admin_read on public.forum_reports
    for select to authenticated
    using (
      exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 4. Admin can update forum_reports (resolve/dismiss)
DO $$ BEGIN
  create policy forum_reports_admin_update on public.forum_reports
    for update to authenticated
    using (
      exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
    )
    with check (
      exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 5. Fix @mention notifications: match on username OR display_name (case-insensitive)
-- Also add unique constraint needed for ON CONFLICT DO NOTHING in trigger
create unique index if not exists forum_notifications_user_thread_reply_type_idx
  on public.forum_notifications (user_id, thread_id, reply_id, type);

-- Add unique constraint on subscriptions so ON CONFLICT works
create unique index if not exists forum_subscriptions_user_thread_type_idx
  on public.forum_subscriptions (user_id, thread_id, type)
  where thread_id is not null;

-- Re-subscribe all existing thread authors
insert into public.forum_subscriptions (user_id, thread_id, type)
select author_id, id, 'thread'
from public.forum_threads
where author_id is not null
on conflict do nothing;

-- Fix notify_on_reply: allow self-mentions (user might want to test / link their own profile)
create or replace function public.notify_on_reply()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  v_thread_id uuid;
  v_section_id text;
  v_reply_author uuid;
  v_mention text;
  v_mentioned_user_id uuid;
begin
  v_thread_id := new.thread_id;
  v_reply_author := new.author_id;

  -- Get section_id for section subscriptions
  select section_id into v_section_id from public.forum_threads where id = v_thread_id;

  -- Notify thread subscribers (excluding reply author)
  insert into public.forum_notifications (user_id, thread_id, reply_id, type)
  select distinct s.user_id, v_thread_id, new.id, 'reply'
  from public.forum_subscriptions s
  where (
    (s.type = 'thread' and s.thread_id = v_thread_id)
    or (s.type = 'section' and s.section_id = v_section_id)
  )
  and s.user_id != v_reply_author;

  -- Notify @mentioned users (match username OR display_name, case-insensitive)
  for v_mention in
    select (regexp_matches(new.body, '@([a-zA-Z0-9_.-]+)', 'g'))[1]
  loop
    select p.id into v_mentioned_user_id
    from public.profiles p
    where lower(p.username) = lower(v_mention)
       or lower(p.display_name) = lower(v_mention)
    limit 1;

    if v_mentioned_user_id is not null then
      insert into public.forum_notifications (user_id, thread_id, reply_id, type)
      values (v_mentioned_user_id, v_thread_id, new.id, 'mention')
      on conflict do nothing;
    end if;
  end loop;

  -- Keyword subscriptions
  insert into public.forum_notifications (user_id, thread_id, reply_id, type)
  select distinct s.user_id, v_thread_id, new.id, 'keyword'
  from public.forum_subscriptions s
  where s.type = 'keyword'
    and s.keyword is not null
    and new.body ilike '%' || s.keyword || '%'
    and s.user_id != v_reply_author;

  return new;
end;
$$;
