-- Public profiles + denormalized post count for forum UI

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_read_public" on public.profiles
  for select using (true);

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Post count materialization
alter table public.profiles add column if not exists post_count int not null default 0;

create or replace function public.recompute_post_count(p_user_id uuid)
returns void
language sql
security definer
as $$
  update public.profiles p
  set post_count = (
    (select count(*) from public.forum_threads t where t.author_id = p_user_id)
    +
    (select count(*) from public.forum_replies r where r.author_id = p_user_id)
  )
  where p.id = p_user_id;
$$;

create or replace function public.bump_post_count_on_thread()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.author_id is not null then
    perform public.recompute_post_count(new.author_id);
  end if;
  return new;
end;
$$;

create or replace function public.bump_post_count_on_reply()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.author_id is not null then
    perform public.recompute_post_count(new.author_id);
  end if;
  return new;
end;
$$;

drop trigger if exists forum_threads_bump_post_count on public.forum_threads;
create trigger forum_threads_bump_post_count
after insert on public.forum_threads
for each row execute procedure public.bump_post_count_on_thread();

drop trigger if exists forum_replies_bump_post_count on public.forum_replies;
create trigger forum_replies_bump_post_count
after insert on public.forum_replies
for each row execute procedure public.bump_post_count_on_reply();
