-- Feature batch: Referral system, Blog posts, Upload full-text search

-- ══════════════════════════════════════════════
-- 1. REFERRAL SYSTEM
-- ══════════════════════════════════════════════

-- Add referral_code to profiles
alter table public.profiles add column if not exists referral_code text unique;

-- Backfill existing profiles with unique referral codes
update public.profiles
set referral_code = substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)
where referral_code is null;

-- Make not null after backfill
alter table public.profiles alter column referral_code set default substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);

-- Update handle_new_user to include referral_code
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, username, avatar_url, referral_code)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Referrals table
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references auth.users(id) on delete cascade,
  referred_id uuid references auth.users(id) on delete set null,
  referral_code text not null,
  clicks integer not null default 0,
  created_at timestamptz not null default now(),
  converted_at timestamptz
);

create index if not exists idx_referrals_referrer on public.referrals(referrer_id);
create index if not exists idx_referrals_code on public.referrals(referral_code);

alter table public.referrals enable row level security;

create policy "referrals_read_own" on public.referrals
  for select using (auth.uid() = referrer_id);

create policy "referrals_insert_service" on public.referrals
  for insert to authenticated
  with check (auth.uid() = referrer_id);

-- RPC to increment click count (called from redirect route, no auth needed)
create or replace function public.increment_referral_clicks(p_code text)
returns void
language plpgsql
security definer
as $$
begin
  -- Update click count on the profile's referral tracking
  -- We track clicks on a per-code basis in a simple way
  update public.referrals
  set clicks = clicks + 1
  where referral_code = p_code;

  -- If no referral row exists yet, create one
  if not found then
    insert into public.referrals (referrer_id, referral_code, clicks)
    select p.id, p.referral_code, 1
    from public.profiles p
    where p.referral_code = p_code
    on conflict do nothing;
  end if;
end;
$$;

grant execute on function public.increment_referral_clicks(text) to anon, authenticated;

-- RPC to convert a referral on signup
create or replace function public.convert_referral(p_code text, p_new_user_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_referrer_id uuid;
begin
  select id into v_referrer_id from public.profiles where referral_code = p_code;
  if v_referrer_id is null or v_referrer_id = p_new_user_id then
    return; -- invalid code or self-referral
  end if;

  -- Check if this user was already referred
  if exists (select 1 from public.referrals where referred_id = p_new_user_id) then
    return;
  end if;

  -- Update existing tracking row or create conversion record
  update public.referrals
  set referred_id = p_new_user_id, converted_at = now()
  where referral_code = p_code and referred_id is null and referrer_id = v_referrer_id;

  if not found then
    insert into public.referrals (referrer_id, referred_id, referral_code, converted_at)
    values (v_referrer_id, p_new_user_id, p_code, now());
  end if;
end;
$$;

grant execute on function public.convert_referral(text, uuid) to authenticated;

-- RPC to get referral stats for a user
create or replace function public.get_referral_stats(p_user_id uuid)
returns table (
  total_referrals bigint,
  converted bigint,
  total_clicks bigint
)
language sql
security definer stable
as $$
  select
    count(*) as total_referrals,
    count(referred_id) as converted,
    coalesce(sum(clicks), 0)::bigint as total_clicks
  from public.referrals
  where referrer_id = p_user_id;
$$;

grant execute on function public.get_referral_stats(uuid) to authenticated;


-- ══════════════════════════════════════════════
-- 2. BLOG POSTS
-- ══════════════════════════════════════════════

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  body text not null default '',
  author_id uuid references auth.users(id) on delete set null,
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  meta_description text,
  og_image_url text
);

create index if not exists idx_blog_posts_slug on public.blog_posts(slug);
create index if not exists idx_blog_posts_published on public.blog_posts(published, published_at desc);

alter table public.blog_posts enable row level security;

-- Public can read published posts
create policy "blog_read_published" on public.blog_posts
  for select using (published = true or auth.uid() = author_id or exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  ));

-- Admin can insert
create policy "blog_insert_admin" on public.blog_posts
  for insert to authenticated
  with check (exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  ));

-- Admin can update
create policy "blog_update_admin" on public.blog_posts
  for update to authenticated
  using (exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  ))
  with check (exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  ));

-- Admin can delete
create policy "blog_delete_admin" on public.blog_posts
  for delete to authenticated
  using (exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  ));

-- Auto-update updated_at
create or replace function public.blog_posts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists blog_posts_set_updated_at on public.blog_posts;
create trigger blog_posts_set_updated_at
  before update on public.blog_posts
  for each row execute procedure public.blog_posts_updated_at();


-- ══════════════════════════════════════════════
-- 3. UPLOAD FULL-TEXT SEARCH
-- ══════════════════════════════════════════════

alter table public.uploads add column if not exists search_vector tsvector;

-- Backfill existing rows
update public.uploads
set search_vector = to_tsvector('english', coalesce(title, '') || ' ' || coalesce(ai_teaser, ''))
where search_vector is null;

-- GIN index
create index if not exists idx_uploads_search_vector on public.uploads using gin(search_vector);

-- Trigger to auto-update search_vector
create or replace function public.uploads_search_vector_update()
returns trigger
language plpgsql
as $$
begin
  new.search_vector := to_tsvector('english', coalesce(new.title, '') || ' ' || coalesce(new.ai_teaser, ''));
  return new;
end;
$$;

drop trigger if exists uploads_search_vector_trigger on public.uploads;
create trigger uploads_search_vector_trigger
  before insert or update of title, ai_teaser on public.uploads
  for each row execute procedure public.uploads_search_vector_update();

-- Search RPC
create or replace function public.search_uploads(
  p_query text,
  p_category_slug text default null,
  p_sort text default 'relevance',
  p_limit integer default 12,
  p_offset integer default 0,
  p_caller_id uuid default null
)
returns table (
  id uuid,
  title text,
  tags text[],
  ai_teaser text,
  quality_score integer,
  status text,
  funding_goal integer,
  current_funded integer,
  view_count integer,
  created_at timestamptz,
  category_id uuid,
  category_name text,
  category_slug text,
  category_icon text,
  uploader_id uuid,
  uploader_username text,
  uploader_avatar_url text,
  rank real,
  total_count bigint
)
language plpgsql
security definer stable
as $$
declare
  v_tsquery tsquery;
  v_total bigint;
begin
  -- Build tsquery from input
  v_tsquery := plainto_tsquery('english', p_query);

  -- Count total
  select count(*) into v_total
  from public.uploads u
  left join public.categories c on c.id = u.category_id
  where u.status in ('funding','unlocked')
    and u.search_vector @@ v_tsquery
    and (p_category_slug is null or c.slug = p_category_slug)
    and (p_caller_id is null or not exists (
      select 1 from public.user_blocks ub
      where ub.blocker_id = p_caller_id and ub.blocked_id = u.uploader_id
    ));

  return query
  select
    u.id,
    u.title,
    u.tags,
    u.ai_teaser,
    u.quality_score,
    u.status,
    u.funding_goal,
    u.current_funded,
    u.view_count,
    u.created_at::timestamptz,
    u.category_id,
    c.name as category_name,
    c.slug as category_slug,
    c.icon as category_icon,
    p.id as uploader_id,
    p.username as uploader_username,
    p.avatar_url as uploader_avatar_url,
    ts_rank(u.search_vector, v_tsquery) as rank,
    v_total as total_count
  from public.uploads u
  left join public.profiles p on p.id = u.uploader_id
  left join public.categories c on c.id = u.category_id
  where u.status in ('funding','unlocked')
    and u.search_vector @@ v_tsquery
    and (p_category_slug is null or c.slug = p_category_slug)
    and (p_caller_id is null or not exists (
      select 1 from public.user_blocks ub
      where ub.blocker_id = p_caller_id and ub.blocked_id = u.uploader_id
    ))
  order by
    case p_sort
      when 'relevance' then ts_rank(u.search_vector, v_tsquery)
      else 0
    end desc,
    case p_sort
      when 'newest' then extract(epoch from u.created_at)
      else 0
    end desc,
    case p_sort
      when 'most_funded' then u.current_funded
      else 0
    end desc,
    u.created_at desc
  limit p_limit
  offset p_offset;
end;
$$;

grant execute on function public.search_uploads(text, text, text, integer, integer, uuid) to authenticated, anon;
