-- Categories, tags, view_count on uploads, and supporting indexes for browse pagination/filtering

-- ══════════════════════════════════════════════
-- 1. CATEGORIES TABLE
-- ══════════════════════════════════════════════

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  icon text not null default '📁',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;
create policy "categories_read_all" on public.categories for select to public using (true);

-- Seed categories
insert into public.categories (name, slug, icon, sort_order) values
  ('Stories',   'stories',   '📖', 1),
  ('Data',      'data',      '📊', 2),
  ('Videos',    'videos',    '🎬', 3),
  ('Documents', 'documents', '📄', 4),
  ('Images',    'images',    '🖼️', 5),
  ('Other',     'other',     '📁', 6)
on conflict (slug) do nothing;

-- ══════════════════════════════════════════════
-- 2. ADD category_id FK TO uploads
-- ══════════════════════════════════════════════

alter table public.uploads add column if not exists category_id uuid references public.categories(id);
alter table public.uploads add column if not exists view_count integer not null default 0;

create index if not exists idx_uploads_category on public.uploads(category_id);
create index if not exists idx_uploads_created on public.uploads(created_at desc);
create index if not exists idx_uploads_view_count on public.uploads(view_count desc);
create index if not exists idx_uploads_current_funded on public.uploads(current_funded desc);

-- ══════════════════════════════════════════════
-- 3. UPLOAD_TAGS junction table
-- ══════════════════════════════════════════════

create table if not exists public.upload_tags (
  id uuid primary key default gen_random_uuid(),
  upload_id uuid not null references public.uploads(id) on delete cascade,
  tag text not null,
  created_at timestamptz not null default now(),
  unique(upload_id, tag)
);

create index if not exists idx_upload_tags_upload on public.upload_tags(upload_id);
create index if not exists idx_upload_tags_tag on public.upload_tags(tag);

alter table public.upload_tags enable row level security;
create policy "upload_tags_read_all" on public.upload_tags for select to public using (true);
create policy "upload_tags_insert_authed" on public.upload_tags for insert to authenticated
  with check (true);

-- ══════════════════════════════════════════════
-- 4. UPDATE uploads_public VIEW to include category
-- ══════════════════════════════════════════════

drop view if exists public.uploads_public;
create or replace view public.uploads_public as
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
  u.created_at,
  u.category_id,
  c.name as category_name,
  c.slug as category_slug,
  c.icon as category_icon,
  p.id as uploader_id,
  p.username as uploader_username,
  p.avatar_url as uploader_avatar_url
from public.uploads u
left join public.profiles p on p.id = u.uploader_id
left join public.categories c on c.id = u.category_id
where u.status in ('funding','unlocked');

-- ══════════════════════════════════════════════
-- 5. RPC: increment upload view count
-- ══════════════════════════════════════════════

create or replace function public.increment_upload_views(p_upload_id uuid)
returns void language plpgsql security definer as $$
begin
  update public.uploads set view_count = view_count + 1 where id = p_upload_id;
end;
$$;

grant execute on function public.increment_upload_views(uuid) to authenticated, anon;

-- ══════════════════════════════════════════════
-- 6. RPC: browse uploads with filtering, sorting, pagination
-- ══════════════════════════════════════════════

create or replace function public.browse_uploads(
  p_category_slug text default null,
  p_tag text default null,
  p_sort text default 'newest',
  p_limit integer default 12,
  p_offset integer default 0
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
  total_count bigint
)
language plpgsql security definer stable as $$
declare
  v_total bigint;
begin
  -- Count total matching
  select count(*) into v_total
  from public.uploads u
  left join public.categories c on c.id = u.category_id
  where u.status in ('funding','unlocked')
    and (p_category_slug is null or c.slug = p_category_slug)
    and (p_tag is null or exists (
      select 1 from public.upload_tags ut where ut.upload_id = u.id and lower(ut.tag) = lower(p_tag)
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
    v_total as total_count
  from public.uploads u
  left join public.profiles p on p.id = u.uploader_id
  left join public.categories c on c.id = u.category_id
  where u.status in ('funding','unlocked')
    and (p_category_slug is null or c.slug = p_category_slug)
    and (p_tag is null or exists (
      select 1 from public.upload_tags ut where ut.upload_id = u.id and lower(ut.tag) = lower(p_tag)
    ))
  order by
    case p_sort
      when 'newest' then extract(epoch from u.created_at)
      else 0
    end desc,
    case p_sort
      when 'most_funded' then u.current_funded
      else 0
    end desc,
    case p_sort
      when 'trending' then
        (coalesce(u.current_funded, 0)::float + coalesce(u.view_count, 0) * 10)
        / (extract(epoch from (now() - u.created_at)) / 3600 + 2)
      else 0
    end desc,
    case p_sort
      when 'almost_unlocked' then
        case when u.funding_goal > 0
          then coalesce(u.current_funded, 0)::float / u.funding_goal
          else 0
        end
      else 0
    end desc,
    u.created_at desc
  limit p_limit
  offset p_offset;
end;
$$;

grant execute on function public.browse_uploads(text, text, text, integer, integer) to authenticated, anon;
