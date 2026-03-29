-- 1. Edit timestamps for threads and replies
alter table public.forum_threads add column if not exists edited_at timestamptz;
alter table public.forum_replies add column if not exists edited_at timestamptz;

-- 2. Set Unmaskr user as admin
update public.profiles set is_admin = true where username = 'Unmaskr';

-- 3. Admin can read all forum_reports
DO $$ BEGIN
  create policy forum_reports_admin_read on public.forum_reports
    for select to authenticated
    using (
      exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 4. Admin can update forum_reports (resolve/dismiss)
DO $$ BEGIN
  create policy forum_reports_admin_update on public.forum_reports
    for update to authenticated
    using (
      exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
    )
    with check (
      exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;
