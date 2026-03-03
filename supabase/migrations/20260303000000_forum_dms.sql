-- Direct messages between forum users
create table if not exists public.forum_dms (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (length(body) > 0),
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_forum_dms_recipient on public.forum_dms(recipient_id, created_at desc);
create index if not exists idx_forum_dms_sender on public.forum_dms(sender_id, created_at desc);
create index if not exists idx_forum_dms_conversation on public.forum_dms(
  least(sender_id, recipient_id),
  greatest(sender_id, recipient_id),
  created_at desc
);

alter table public.forum_dms enable row level security;

-- Users can see DMs where they are sender or recipient
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='forum_dms' and policyname='forum_dms_select_own') then
    create policy "forum_dms_select_own" on public.forum_dms for select to authenticated using (auth.uid() = sender_id or auth.uid() = recipient_id);
  end if;
end $$;

-- Users can send DMs (insert where they are the sender)
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='forum_dms' and policyname='forum_dms_insert_own') then
    create policy "forum_dms_insert_own" on public.forum_dms for insert to authenticated with check (auth.uid() = sender_id);
  end if;
end $$;

-- Users can mark messages as read (only recipient)
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='forum_dms' and policyname='forum_dms_update_read') then
    create policy "forum_dms_update_read" on public.forum_dms for update to authenticated using (auth.uid() = recipient_id) with check (auth.uid() = recipient_id);
  end if;
end $$;
