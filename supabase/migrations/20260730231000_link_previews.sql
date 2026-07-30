-- Link preview cache for Reddit-style article cards in the forum.
-- Written only by the server (service role via API route); no client access.

create table if not exists public.link_previews (
  url text primary key,
  title text null,
  description text null,
  image_url text null,
  site_name text null,
  fetched_at timestamptz not null default now(),
  ok boolean not null default true
);

alter table public.link_previews enable row level security;
-- No policies: only service role reads/writes (API route).
