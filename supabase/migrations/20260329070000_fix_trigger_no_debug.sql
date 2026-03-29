-- Remove debug logging from notify_on_reply trigger (the _debug_log table was dropped)
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
      begin
        insert into public.forum_notifications (user_id, thread_id, reply_id, type)
        values (v_mentioned_user_id, v_thread_id, new.id, 'mention');
      exception when others then
        null; -- silently skip duplicates
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
