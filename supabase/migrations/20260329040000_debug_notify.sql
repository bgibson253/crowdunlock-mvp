-- Add a debug log table and update the trigger to log what's happening
create table if not exists public._debug_log (
  id serial primary key,
  ts timestamptz default now(),
  msg text
);
alter table public._debug_log disable row level security;

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

  insert into public._debug_log (msg) values (
    'notify_on_reply fired: reply_id=' || new.id::text
    || ' thread_id=' || v_thread_id::text
    || ' author_id=' || coalesce(v_reply_author::text, 'NULL')
    || ' body=' || left(new.body, 100)
  );

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
    insert into public._debug_log (msg) values (
      'mention found: ' || v_mention
    );

    select p.id into v_mentioned_user_id
    from public.profiles p
    where lower(p.username) = lower(v_mention)
       or lower(p.display_name) = lower(v_mention)
    limit 1;

    insert into public._debug_log (msg) values (
      'mention resolved to user_id: ' || coalesce(v_mentioned_user_id::text, 'NULL')
    );

    if v_mentioned_user_id is not null then
      begin
        insert into public.forum_notifications (user_id, thread_id, reply_id, type)
        values (v_mentioned_user_id, v_thread_id, new.id, 'mention');
        insert into public._debug_log (msg) values ('notification inserted successfully');
      exception when others then
        insert into public._debug_log (msg) values ('notification insert FAILED: ' || sqlerrm);
      end;
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
