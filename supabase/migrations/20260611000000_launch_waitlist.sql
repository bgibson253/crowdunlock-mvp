-- New waitlist for launch notification emails
create table if not exists public.launch_waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text not null default 'unmaskr.org',
  created_at timestamptz not null default now(),
  constraint launch_waitlist_email_unique unique (email)
);

alter table public.launch_waitlist enable row level security;

create policy "launch_waitlist_insert_anon"
  on public.launch_waitlist
  for insert
  to anon
  with check (true);

create policy "launch_waitlist_select_auth"
  on public.launch_waitlist
  for select
  to authenticated
  using (true);
