-- AI Moderation Tracking: reviewed status on forum content + dispute support
-- Adds moderation_reviewed_at, moderation_status, moderation_notes to forum tables
-- Plus a dedicated ai_moderation_log for audit trail

------------------------------------------------------------
-- Add moderation tracking columns to forum_threads
------------------------------------------------------------
alter table public.forum_threads
  add column if not exists moderation_status text not null default 'unreviewed'
    check (moderation_status in ('unreviewed','approved','flagged','rejected','disputed')),
  add column if not exists moderation_reviewed_at timestamptz,
  add column if not exists moderation_model text,
  add column if not exists moderation_confidence smallint check (moderation_confidence is null or moderation_confidence between 0 and 100),
  add column if not exists moderation_notes text;

------------------------------------------------------------
-- Add moderation tracking columns to forum_replies
------------------------------------------------------------
alter table public.forum_replies
  add column if not exists moderation_status text not null default 'unreviewed'
    check (moderation_status in ('unreviewed','approved','flagged','rejected','disputed')),
  add column if not exists moderation_reviewed_at timestamptz,
  add column if not exists moderation_model text,
  add column if not exists moderation_confidence smallint check (moderation_confidence is null or moderation_confidence between 0 and 100),
  add column if not exists moderation_notes text;

------------------------------------------------------------
-- Indexes for AI moderator queries (fetch unreviewed/disputed)
------------------------------------------------------------
create index if not exists idx_threads_mod_status on public.forum_threads (moderation_status, created_at desc);
create index if not exists idx_replies_mod_status on public.forum_replies (moderation_status, created_at desc);

------------------------------------------------------------
-- AI Moderation Log (full audit trail)
------------------------------------------------------------
create table if not exists public.ai_moderation_log (
  id              uuid primary key default gen_random_uuid(),
  target_type     text not null check (target_type in ('thread','reply')),
  target_id       uuid not null,
  verdict         text not null check (verdict in ('approve','flag','reject','review')),
  confidence      smallint not null check (confidence between 0 and 100),
  categories      jsonb not null default '[]'::jsonb,
  reasoning       text,
  model_used      text not null,
  prompt_version  text not null default 'v1',
  created_at      timestamptz not null default now()
);

create index if not exists idx_ai_mod_log_target on public.ai_moderation_log (target_type, target_id);
create index if not exists idx_ai_mod_log_created on public.ai_moderation_log (created_at desc);
alter table public.ai_moderation_log enable row level security;
-- No public policies — service role / admin only

------------------------------------------------------------
-- RPC: ai_moderate_post()
-- Called by the AI moderator. Marks the post as reviewed,
-- logs the decision, and auto-hides high-confidence rejections.
------------------------------------------------------------
create or replace function public.ai_moderate_post(
  p_target_type   text,         -- 'thread' | 'reply'
  p_target_id     uuid,
  p_verdict       text,         -- 'approve' | 'flag' | 'reject'
  p_confidence    int,
  p_categories    jsonb default '[]'::jsonb,
  p_reasoning     text default null,
  p_model         text default 'unknown',
  p_prompt_version text default 'v1'
)
returns jsonb
language plpgsql security definer
as $$
declare
  v_mod_status text;
begin
  -- Map verdict to moderation_status
  v_mod_status := case
    when p_verdict = 'approve' then 'approved'
    when p_verdict = 'flag'    then 'flagged'
    when p_verdict = 'reject'  then 'rejected'
    else 'flagged'
  end;

  -- Update the forum post
  if p_target_type = 'thread' then
    update public.forum_threads set
      moderation_status      = v_mod_status,
      moderation_reviewed_at = now(),
      moderation_model       = p_model,
      moderation_confidence  = p_confidence,
      moderation_notes       = p_reasoning
    where id = p_target_id;

    -- Auto-hide high-confidence rejections
    if p_verdict = 'reject' and p_confidence >= 90 then
      update public.forum_threads
        set deleted_at = now()
      where id = p_target_id and deleted_at is null;
    end if;

  elsif p_target_type = 'reply' then
    update public.forum_replies set
      moderation_status      = v_mod_status,
      moderation_reviewed_at = now(),
      moderation_model       = p_model,
      moderation_confidence  = p_confidence,
      moderation_notes       = p_reasoning
    where id = p_target_id;

    -- Auto-hide high-confidence rejections
    if p_verdict = 'reject' and p_confidence >= 90 then
      update public.forum_replies
        set deleted_at = now()
      where id = p_target_id and deleted_at is null;
    end if;
  else
    return jsonb_build_object('ok', false, 'error', 'invalid target_type');
  end if;

  -- Audit log entry
  insert into public.ai_moderation_log (
    target_type, target_id, verdict, confidence,
    categories, reasoning, model_used, prompt_version
  ) values (
    p_target_type, p_target_id, p_verdict, p_confidence,
    p_categories, p_reasoning, p_model, p_prompt_version
  );

  return jsonb_build_object(
    'ok', true,
    'status', v_mod_status,
    'auto_hidden', p_verdict = 'reject' and p_confidence >= 90
  );
end;
$$;

revoke all on function public.ai_moderate_post from public, anon, authenticated;

------------------------------------------------------------
-- RPC: get_unmoderated_posts()
-- Returns threads + replies that need review
-- (status = 'unreviewed' OR 'disputed'), ordered oldest first.
------------------------------------------------------------
create or replace function public.get_unmoderated_posts(
  p_limit int default 50
)
returns jsonb
language plpgsql security definer
as $$
declare
  v_threads jsonb;
  v_replies jsonb;
begin
  select coalesce(jsonb_agg(row_to_json(t)::jsonb), '[]'::jsonb)
  into v_threads
  from (
    select
      ft.id,
      'thread' as target_type,
      ft.title,
      ft.body,
      ft.author_id,
      p.username as author_username,
      p.display_name as author_display_name,
      ft.section_id,
      ft.moderation_status,
      ft.created_at
    from public.forum_threads ft
    left join public.profiles p on p.id = ft.author_id
    where ft.moderation_status in ('unreviewed', 'disputed')
      and ft.deleted_at is null
    order by ft.created_at asc
    limit p_limit
  ) t;

  select coalesce(jsonb_agg(row_to_json(r)::jsonb), '[]'::jsonb)
  into v_replies
  from (
    select
      fr.id,
      'reply' as target_type,
      null as title,
      fr.body,
      fr.author_id,
      p.username as author_username,
      p.display_name as author_display_name,
      fr.thread_id,
      fr.moderation_status,
      fr.created_at
    from public.forum_replies fr
    left join public.profiles p on p.id = fr.author_id
    where fr.moderation_status in ('unreviewed', 'disputed')
      and fr.deleted_at is null
    order by fr.created_at asc
    limit p_limit
  ) r;

  return jsonb_build_object(
    'threads', v_threads,
    'replies', v_replies,
    'total', (jsonb_array_length(v_threads) + jsonb_array_length(v_replies))
  );
end;
$$;

revoke all on function public.get_unmoderated_posts from public, anon, authenticated;

------------------------------------------------------------
-- RPC: dispute_moderation()
-- Allows a post author to dispute an AI moderation decision.
-- Sets status back to 'disputed' for re-review.
------------------------------------------------------------
create or replace function public.dispute_moderation(
  p_target_type text,
  p_target_id   uuid,
  p_reason      text default null
)
returns jsonb
language plpgsql security definer
as $$
declare
  v_author uuid;
  v_current_user uuid := auth.uid();
begin
  if v_current_user is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  -- Verify caller is the author
  if p_target_type = 'thread' then
    select author_id into v_author from public.forum_threads where id = p_target_id;
  elsif p_target_type = 'reply' then
    select author_id into v_author from public.forum_replies where id = p_target_id;
  else
    return jsonb_build_object('ok', false, 'error', 'invalid target_type');
  end if;

  if v_author is null or v_author != v_current_user then
    return jsonb_build_object('ok', false, 'error', 'not_author');
  end if;

  -- Set status to disputed
  if p_target_type = 'thread' then
    update public.forum_threads set
      moderation_status = 'disputed',
      moderation_notes = coalesce(moderation_notes || E'\n\n', '') || 'DISPUTE: ' || coalesce(p_reason, 'No reason given')
    where id = p_target_id
      and moderation_status in ('flagged', 'rejected');
  else
    update public.forum_replies set
      moderation_status = 'disputed',
      moderation_notes = coalesce(moderation_notes || E'\n\n', '') || 'DISPUTE: ' || coalesce(p_reason, 'No reason given')
    where id = p_target_id
      and moderation_status in ('flagged', 'rejected');
  end if;

  -- Log the dispute
  insert into public.ai_moderation_log (
    target_type, target_id, verdict, confidence,
    reasoning, model_used, prompt_version
  ) values (
    p_target_type, p_target_id, 'review', 0,
    'User dispute: ' || coalesce(p_reason, 'No reason given'),
    'user_dispute', 'n/a'
  );

  return jsonb_build_object('ok', true, 'status', 'disputed');
end;
$$;

-- dispute_moderation is callable by authenticated users (authors only, enforced in function)
revoke all on function public.dispute_moderation from public, anon;
grant execute on function public.dispute_moderation to authenticated;
