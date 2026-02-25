-- AI-native unified content stream + secure agent actions

-- NOTE: Postgres does NOT support `create type if not exists`.

-- 1) Types
DO $$ BEGIN
  create type public.content_item_type as enum (
    'upload',
    'bounty',
    'forum_thread',
    'forum_reply',
    'comment',
    'request'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  create type public.content_item_status as enum (
    'visible',
    'hidden',
    'rejected',
    'resolved'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2) Unified table
create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  type public.content_item_type not null,
  -- For agent operations, we keep a stable id plus optional link to source entity.
  source_table text,
  source_id uuid,

  title text,
  teaser text,
  body text,

  status public.content_item_status not null default 'visible',

  author_id uuid references auth.users(id) on delete set null,
  parent_id uuid references public.content_items(id) on delete cascade,

  reply_count integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists content_items_created_at_idx on public.content_items (created_at desc);
create index if not exists content_items_type_created_at_idx on public.content_items (type, created_at desc);
create index if not exists content_items_parent_id_idx on public.content_items (parent_id);
create index if not exists content_items_source_idx on public.content_items (source_table, source_id);

alter table public.content_items enable row level security;

-- Public readable (like forum)
DO $$ BEGIN
  create policy content_items_read_public on public.content_items
    for select using (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- (Optional) authed can create own items
DO $$ BEGIN
  create policy content_items_insert_self on public.content_items
    for insert to authenticated
    with check (author_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_content_items_updated_at on public.content_items;
create trigger trg_content_items_updated_at
before update on public.content_items
for each row execute function public.set_updated_at();

-- 3) Backfill from existing tables (uploads + forum)
-- Uploads
insert into public.content_items (type, source_table, source_id, title, teaser, body, status, author_id, metadata, created_at)
select
  'upload'::public.content_item_type,
  'uploads',
  u.id,
  u.title,
  coalesce(u.ai_teaser, left(u.why_it_matters, 240)),
  u.why_it_matters,
  case
    when u.status = 'rejected' then 'rejected'::public.content_item_status
    when u.status in ('funding','unlocked') then 'visible'::public.content_item_status
    else 'hidden'::public.content_item_status
  end,
  u.uploader_id,
  jsonb_build_object(
    'upload_status', u.status,
    'funding_goal', u.funding_goal,
    'current_funded', u.current_funded
  ),
  u.created_at
from public.uploads u
where not exists (
  select 1 from public.content_items ci where ci.source_table='uploads' and ci.source_id=u.id
);

-- Forum threads
insert into public.content_items (type, source_table, source_id, title, teaser, body, status, author_id, metadata, created_at)
select
  'forum_thread'::public.content_item_type,
  'forum_threads',
  t.id,
  t.title,
  left(t.body, 240),
  t.body,
  'visible'::public.content_item_status,
  t.author_id,
  jsonb_build_object('thread_id', t.id),
  t.created_at
from public.forum_threads t
where not exists (
  select 1 from public.content_items ci where ci.source_table='forum_threads' and ci.source_id=t.id
);

-- Forum replies, parented to their thread content_item
insert into public.content_items (type, source_table, source_id, title, teaser, body, status, author_id, parent_id, metadata, created_at)
select
  'forum_reply'::public.content_item_type,
  'forum_replies',
  r.id,
  null,
  left(r.body, 240),
  r.body,
  'visible'::public.content_item_status,
  r.author_id,
  ci_thread.id,
  jsonb_build_object('thread_id', r.thread_id, 'reply_id', r.id),
  r.created_at
from public.forum_replies r
join public.content_items ci_thread
  on ci_thread.source_table='forum_threads' and ci_thread.source_id=r.thread_id
where not exists (
  select 1 from public.content_items ci where ci.source_table='forum_replies' and ci.source_id=r.id
);

-- 4) Reply counts maintenance (compute once, then triggers for new replies)
update public.content_items t
set reply_count = x.cnt
from (
  select parent_id, count(*)::int as cnt
  from public.content_items
  where parent_id is not null
  group by parent_id
) x
where t.id = x.parent_id;

create or replace function public.bump_content_item_reply_count()
returns trigger
language plpgsql
as $$
begin
  if new.parent_id is not null then
    update public.content_items
      set reply_count = reply_count + 1
    where id = new.parent_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_bump_content_item_reply_count on public.content_items;
create trigger trg_bump_content_item_reply_count
after insert on public.content_items
for each row execute function public.bump_content_item_reply_count();

-- 5) Agent view (single call)
create or replace view public.agent_all_content as
select
  ci.id,
  ci.type,
  ci.title,
  ci.teaser,
  ci.status,
  ci.reply_count,
  ci.metadata,
  ci.author_id,
  p.username as author_username,
  p.display_name as author_display_name,
  ci.created_at,
  ci.updated_at
from public.content_items ci
left join public.profiles p on p.id = ci.author_id
order by ci.created_at desc;

-- 6) Audit log
create table if not exists public.agent_action_audit (
  id uuid primary key default gen_random_uuid(),
  actor text not null default 'edge_agent',
  content_item_id uuid references public.content_items(id) on delete set null,
  action text not null,
  payload jsonb not null default '{}'::jsonb,
  success boolean not null default false,
  error text,
  created_at timestamptz not null default now()
);

alter table public.agent_action_audit enable row level security;

-- 7) Safe action RPC (called by Edge Function with service role)
create or replace function public.agent_apply_action(
  p_content_item_id uuid,
  p_action text,
  p_payload jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_item public.content_items%rowtype;
  v_res jsonb;
  v_err text;
begin
  select * into v_item from public.content_items where id = p_content_item_id;
  if not found then
    insert into public.agent_action_audit(content_item_id, action, payload, success, error)
    values (p_content_item_id, p_action, coalesce(p_payload,'{}'::jsonb), false, 'not_found');
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  if p_action not in ('hide','unhide','reject','edit_teaser','reply') then
    insert into public.agent_action_audit(content_item_id, action, payload, success, error)
    values (p_content_item_id, p_action, coalesce(p_payload,'{}'::jsonb), false, 'invalid_action');
    return jsonb_build_object('ok', false, 'error', 'invalid_action');
  end if;

  if p_action = 'hide' then
    update public.content_items set status='hidden' where id=p_content_item_id;
    v_res := jsonb_build_object('ok', true, 'status', 'hidden');

  elsif p_action = 'unhide' then
    update public.content_items set status='visible' where id=p_content_item_id;
    v_res := jsonb_build_object('ok', true, 'status', 'visible');

  elsif p_action = 'reject' then
    update public.content_items set status='rejected' where id=p_content_item_id;
    v_res := jsonb_build_object('ok', true, 'status', 'rejected');

  elsif p_action = 'edit_teaser' then
    update public.content_items
      set teaser = nullif(trim(coalesce(p_payload->>'teaser','')), '')
    where id=p_content_item_id;
    v_res := jsonb_build_object('ok', true);

  elsif p_action = 'reply' then
    if nullif(trim(coalesce(p_payload->>'body','')), '') is null then
      insert into public.agent_action_audit(content_item_id, action, payload, success, error)
      values (p_content_item_id, p_action, coalesce(p_payload,'{}'::jsonb), false, 'missing_body');
      return jsonb_build_object('ok', false, 'error', 'missing_body');
    end if;

    insert into public.content_items(type, source_table, source_id, title, teaser, body, status, author_id, parent_id, metadata)
    values (
      'comment'::public.content_item_type,
      'agent',
      gen_random_uuid(),
      null,
      left(p_payload->>'body', 240),
      p_payload->>'body',
      'visible'::public.content_item_status,
      null,
      p_content_item_id,
      jsonb_build_object('agent_reply', true)
    );

    v_res := jsonb_build_object('ok', true);
  end if;

  insert into public.agent_action_audit(content_item_id, action, payload, success)
  values (p_content_item_id, p_action, coalesce(p_payload,'{}'::jsonb), true);

  return v_res;
exception
  when others then
    v_err := sqlerrm;
    insert into public.agent_action_audit(content_item_id, action, payload, success, error)
    values (p_content_item_id, p_action, coalesce(p_payload,'{}'::jsonb), false, v_err);
    return jsonb_build_object('ok', false, 'error', v_err);
end;
$$;

revoke all on function public.agent_apply_action(uuid, text, jsonb) from public;
revoke all on function public.agent_apply_action(uuid, text, jsonb) from authenticated;
revoke all on function public.agent_apply_action(uuid, text, jsonb) from anon;

-- 8) Seed: sample posts (idempotent via metadata key)
insert into public.content_items (type, source_table, source_id, title, teaser, body, status, metadata)
select
  'request'::public.content_item_type,
  'seed',
  gen_random_uuid(),
  v.title,
  v.teaser,
  v.body,
  'visible'::public.content_item_status,
  jsonb_build_object('seed_key', v.seed_key)
from (
  values
    ('seed_1','[Sample] Request: Verify claim X','We need verification on claim X.','Please investigate claim X and attach sources.'),
    ('seed_2','[Sample] Bounty: Public record pull','Pull a public record.','Pull the public record and summarize findings.'),
    ('seed_3','[Sample] Comment: Great lead','Nice lead, needs follow-up.','This is a promising lead; confirm with a second source.'),
    ('seed_4','[Sample] Upload: Redacted doc','Partial doc teaser.','Redacted doc content goes here.'),
    ('seed_5','[Sample] Forum post: Intro','Hello Unmaskr.','Introducing myself and credibility.')
) as v(seed_key,title,teaser,body)
where not exists (
  select 1 from public.content_items ci
  where ci.source_table='seed'
    and (ci.metadata->>'seed_key') = v.seed_key
);
