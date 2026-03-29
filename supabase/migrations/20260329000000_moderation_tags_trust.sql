-- AI moderation, content tagging, trust/reputation system
-- Adds tables for moderation queue, tags, user trust, appeals, and reports.
-- All integrate with existing content_items + profiles.

------------------------------------------------------------
-- MODERATION QUEUE
------------------------------------------------------------
DO $$ BEGIN
  create type public.mod_verdict as enum ('approve','reject','review');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  create type public.mod_status as enum ('pending','approved','rejected','escalated');
EXCEPTION WHEN duplicate_object THEN null; END $$;

create table if not exists public.moderation_queue (
  id              uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  ai_verdict      public.mod_verdict not null,
  confidence      smallint not null check (confidence between 0 and 100),
  violation_categories jsonb not null default '[]'::jsonb,
  ai_reasoning    text,
  model_used      text not null default 'pending',
  prompt_version  text not null default 'v1',
  status          public.mod_status not null default 'pending',
  reviewer_id     uuid references public.profiles(id) on delete set null,
  reviewed_at     timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists idx_modqueue_status  on public.moderation_queue (status, created_at desc);
create index if not exists idx_modqueue_content on public.moderation_queue (content_item_id);
alter table public.moderation_queue enable row level security;
-- No public/anon/authenticated policies — service role only

------------------------------------------------------------
-- CONTENT TAGS
------------------------------------------------------------
create table if not exists public.content_tags (
  id              uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  tag_slug        text not null,
  confidence      smallint not null check (confidence between 0 and 100),
  ai_reasoning    text,
  model_used      text,
  created_at      timestamptz not null default now(),
  unique (content_item_id, tag_slug)
);

create index if not exists idx_content_tags_item on public.content_tags (content_item_id);
create index if not exists idx_content_tags_slug on public.content_tags (tag_slug);
alter table public.content_tags enable row level security;

-- Public can read tags (transparency)
DO $$ BEGIN
  create policy content_tags_read on public.content_tags for select using (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

------------------------------------------------------------
-- TAG VOTES (user feedback on AI tags)
------------------------------------------------------------
create table if not exists public.content_tag_votes (
  id             uuid primary key default gen_random_uuid(),
  content_tag_id uuid not null references public.content_tags(id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  vote           text not null check (vote in ('agree','disagree')),
  created_at     timestamptz not null default now(),
  unique (content_tag_id, user_id)
);

alter table public.content_tag_votes enable row level security;

DO $$ BEGIN
  create policy tag_votes_read on public.content_tag_votes for select using (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  create policy tag_votes_insert on public.content_tag_votes for insert to authenticated
    with check (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  create policy tag_votes_delete on public.content_tag_votes for delete to authenticated
    using (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;

------------------------------------------------------------
-- USER TRUST
------------------------------------------------------------
create table if not exists public.user_trust (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  trust_level          smallint not null default 0 check (trust_level between 0 and 4),
  trust_score          numeric not null default 0,
  positive_interactions int not null default 0,
  flags_received       int not null default 0,
  flags_given_accurate int not null default 0,
  days_active          int not null default 0,
  quality_posts        int not null default 0,
  manual_boost         int not null default 0,
  last_computed_at     timestamptz,
  created_at           timestamptz not null default now()
);

alter table public.user_trust enable row level security;
DO $$ BEGIN
  create policy trust_read on public.user_trust for select using (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Add trust_level to profiles
alter table public.profiles add column if not exists trust_level smallint not null default 0;

------------------------------------------------------------
-- TRUST HISTORY
------------------------------------------------------------
create table if not exists public.user_trust_history (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  old_level  smallint not null,
  new_level  smallint not null,
  old_score  numeric,
  new_score  numeric,
  reason     text not null,
  changed_by text not null default 'system',
  created_at timestamptz not null default now()
);

create index if not exists idx_trust_history_user on public.user_trust_history (user_id, created_at desc);
alter table public.user_trust_history enable row level security;
DO $$ BEGIN
  create policy trust_history_read on public.user_trust_history for select to authenticated
    using (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;

------------------------------------------------------------
-- MODERATION APPEALS
------------------------------------------------------------
DO $$ BEGIN
  create type public.appeal_status as enum ('pending','approved','denied');
EXCEPTION WHEN duplicate_object THEN null; END $$;

create table if not exists public.moderation_appeals (
  id              uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  appeal_text     text not null,
  status          public.appeal_status not null default 'pending',
  reviewer_id     uuid references public.profiles(id) on delete set null,
  reviewer_notes  text,
  created_at      timestamptz not null default now(),
  resolved_at     timestamptz,
  unique (content_item_id, user_id)
);

create index if not exists idx_appeals_status on public.moderation_appeals (status, created_at);
alter table public.moderation_appeals enable row level security;
DO $$ BEGIN
  create policy appeals_read_own on public.moderation_appeals for select to authenticated
    using (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  create policy appeals_insert_own on public.moderation_appeals for insert to authenticated
    with check (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;

------------------------------------------------------------
-- USER REPORTS / FLAGS
------------------------------------------------------------
create table if not exists public.content_reports (
  id              uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  reporter_id     uuid not null references auth.users(id) on delete cascade,
  category        text not null check (category in (
    'spam','harassment','hate_speech','misinformation',
    'nsfw','off_topic','other'
  )),
  details         text,
  status          text not null default 'open' check (status in ('open','resolved','dismissed')),
  created_at      timestamptz not null default now(),
  unique (content_item_id, reporter_id)
);

alter table public.content_reports enable row level security;
DO $$ BEGIN
  create policy reports_insert on public.content_reports for insert to authenticated
    with check (reporter_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;

------------------------------------------------------------
-- RPC: moderate_content()
-- Called by whatever moderation system you wire up (local LLM, API, manual)
-- Stores the verdict, auto-acts on high-confidence results, inserts tags
------------------------------------------------------------
create or replace function public.moderate_content(
  p_content_item_id uuid,
  p_verdict         text,       -- 'approve' | 'reject' | 'review'
  p_confidence      int,
  p_violations      jsonb default '[]'::jsonb,
  p_reasoning       text default null,
  p_model           text default 'manual',
  p_prompt_version  text default 'v1',
  p_tags            jsonb default '[]'::jsonb
  -- tags: [{"slug":"partisan","confidence":82,"reasoning":"..."}]
)
returns jsonb
language plpgsql security definer
as $$
declare
  v_mod_id uuid;
  v_status public.mod_status;
  v_action text;
  v_tag    jsonb;
begin
  -- Auto-action based on confidence
  if p_verdict = 'approve' and p_confidence >= 95 then
    v_status := 'approved';
    v_action := null;
  elsif p_verdict = 'reject' and p_confidence >= 95 then
    v_status := 'rejected';
    v_action := 'hide';
  else
    v_status := 'pending';
    v_action := null;
  end if;

  -- Upsert moderation record
  insert into public.moderation_queue (
    content_item_id, ai_verdict, confidence, violation_categories,
    ai_reasoning, model_used, prompt_version, status
  ) values (
    p_content_item_id, p_verdict::public.mod_verdict, p_confidence,
    p_violations, p_reasoning, p_model, p_prompt_version, v_status
  )
  on conflict (content_item_id) do update set
    ai_verdict = excluded.ai_verdict,
    confidence = excluded.confidence,
    violation_categories = excluded.violation_categories,
    ai_reasoning = excluded.ai_reasoning,
    model_used = excluded.model_used,
    prompt_version = excluded.prompt_version,
    status = excluded.status
  returning id into v_mod_id;

  -- Auto-hide if high-confidence rejection
  if v_action = 'hide' then
    update public.content_items set status = 'hidden' where id = p_content_item_id;
    insert into public.agent_action_audit (content_item_id, action, payload, success, actor)
    values (p_content_item_id, 'auto_hide', jsonb_build_object(
      'confidence', p_confidence, 'reasoning', p_reasoning
    ), true, 'ai_moderator');
  end if;

  -- Upsert tags
  for v_tag in select * from jsonb_array_elements(p_tags) loop
    insert into public.content_tags (content_item_id, tag_slug, confidence, ai_reasoning, model_used)
    values (
      p_content_item_id,
      v_tag->>'slug',
      (v_tag->>'confidence')::smallint,
      v_tag->>'reasoning',
      p_model
    )
    on conflict (content_item_id, tag_slug) do update set
      confidence = excluded.confidence,
      ai_reasoning = excluded.ai_reasoning,
      model_used = excluded.model_used;
  end loop;

  return jsonb_build_object(
    'ok', true,
    'moderation_id', v_mod_id,
    'auto_status', v_status,
    'auto_action', coalesce(v_action, 'none')
  );
end;
$$;

revoke all on function public.moderate_content from public, anon, authenticated;

------------------------------------------------------------
-- RPC: compute_user_trust()
-- Recomputes a user's trust score + level from all signals
------------------------------------------------------------
create or replace function public.compute_user_trust(p_user_id uuid)
returns jsonb
language plpgsql security definer
as $$
declare
  v_old  public.user_trust%rowtype;
  v_score numeric;
  v_level smallint;
  v_pos_interactions int;
  v_flags int;
  v_flags_accurate int;
  v_days int;
  v_quality int;
  v_boost int;
begin
  -- Ensure trust record exists
  insert into public.user_trust (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  select * into v_old from public.user_trust where user_id = p_user_id;

  -- Positive interactions: reactions from Level 1+ users on this user's content
  select coalesce(count(*), 0) into v_pos_interactions
  from public.forum_reactions fr
  join public.content_items ci on ci.source_id::text = fr.target_id::text
  join public.user_trust ut on ut.user_id = fr.user_id and ut.trust_level >= 1
  where ci.author_id = p_user_id;

  -- Flags received (resolved reports against this user's content)
  select coalesce(count(*), 0) into v_flags
  from public.content_reports cr
  join public.content_items ci on ci.id = cr.content_item_id
  where ci.author_id = p_user_id and cr.status = 'resolved';

  -- Accurate flags given by this user
  select coalesce(count(*), 0) into v_flags_accurate
  from public.content_reports cr
  where cr.reporter_id = p_user_id and cr.status = 'resolved';

  -- Days active (distinct days with content)
  select coalesce(count(distinct date(ci.created_at)), 0) into v_days
  from public.content_items ci
  where ci.author_id = p_user_id;

  -- Quality posts (AI-tagged high-quality with confidence >= 70)
  select coalesce(count(distinct ct.content_item_id), 0) into v_quality
  from public.content_tags ct
  join public.content_items ci on ci.id = ct.content_item_id
  where ci.author_id = p_user_id
    and ct.tag_slug = 'high-quality'
    and ct.confidence >= 70;

  v_boost := v_old.manual_boost;

  -- Score: +5 reactions, +2/day (cap 365), +15/quality post, +10/accurate flag, -20/flag received, +boost
  v_score := greatest(0,
    (v_pos_interactions * 5) +
    (least(v_days, 365) * 2) +
    (v_quality * 15) +
    (v_flags_accurate * 10) -
    (v_flags * 20) +
    v_boost
  );

  -- Level: 0(0-99), 1(100-299), 2(300-599), 3(600-899), 4(900+)
  v_level := case
    when v_score >= 900 then 4
    when v_score >= 600 then 3
    when v_score >= 300 then 2
    when v_score >= 100 then 1
    else 0
  end;

  update public.user_trust set
    trust_level = v_level,
    trust_score = v_score,
    positive_interactions = v_pos_interactions,
    flags_received = v_flags,
    flags_given_accurate = v_flags_accurate,
    days_active = v_days,
    quality_posts = v_quality,
    last_computed_at = now()
  where user_id = p_user_id;

  update public.profiles set trust_level = v_level where id = p_user_id;

  -- Log level changes
  if v_old.trust_level is distinct from v_level then
    insert into public.user_trust_history (user_id, old_level, new_level, old_score, new_score, reason)
    values (p_user_id, coalesce(v_old.trust_level,0), v_level,
            coalesce(v_old.trust_score,0), v_score, 'auto_recompute');
  end if;

  return jsonb_build_object(
    'ok', true,
    'score', v_score,
    'level', v_level,
    'changed', v_old.trust_level is distinct from v_level
  );
end;
$$;

revoke all on function public.compute_user_trust from public, anon, authenticated;
