-- Expand profiles for richer profile settings (no username editing).

alter table public.profiles
  add column if not exists display_name text,
  add column if not exists bio text,
  add column if not exists website text,
  add column if not exists location text,
  add column if not exists twitter text,
  add column if not exists github text,
  add column if not exists linkedin text,
  add column if not exists banner_url text;

-- Basic length guards
alter table public.profiles
  drop constraint if exists profiles_bio_len;

alter table public.profiles
  add constraint profiles_bio_len check (bio is null or char_length(bio) <= 280);

-- Backfill display_name from existing username if missing
update public.profiles
set display_name = username
where display_name is null and username is not null;
