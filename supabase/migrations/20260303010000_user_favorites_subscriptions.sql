-- User favorites and subscriptions (follow users)
create table if not exists public.user_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, target_user_id)
);

create index if not exists idx_user_favorites_user on public.user_favorites(user_id);
create index if not exists idx_user_favorites_target on public.user_favorites(target_user_id);

alter table public.user_favorites enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='user_favorites' and policyname='user_favorites_select') then
    create policy "user_favorites_select" on public.user_favorites for select to authenticated using (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='user_favorites' and policyname='user_favorites_insert_own') then
    create policy "user_favorites_insert_own" on public.user_favorites for insert to authenticated with check (auth.uid() = user_id);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='user_favorites' and policyname='user_favorites_delete_own') then
    create policy "user_favorites_delete_own" on public.user_favorites for delete to authenticated using (auth.uid() = user_id);
  end if;
end $$;

-- User subscriptions (get notified when a user posts)
create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, target_user_id)
);

create index if not exists idx_user_subscriptions_user on public.user_subscriptions(user_id);
create index if not exists idx_user_subscriptions_target on public.user_subscriptions(target_user_id);

alter table public.user_subscriptions enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='user_subscriptions' and policyname='user_subscriptions_select') then
    create policy "user_subscriptions_select" on public.user_subscriptions for select to authenticated using (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='user_subscriptions' and policyname='user_subscriptions_insert_own') then
    create policy "user_subscriptions_insert_own" on public.user_subscriptions for insert to authenticated with check (auth.uid() = user_id);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='user_subscriptions' and policyname='user_subscriptions_delete_own') then
    create policy "user_subscriptions_delete_own" on public.user_subscriptions for delete to authenticated using (auth.uid() = user_id);
  end if;
end $$;
