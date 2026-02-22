-- Seed example forum content for first-run UX.
-- Safe to run multiple times.

-- Create a deterministic "system" user id (does not need to exist in auth.users)
-- We'll store as null author_id? But schema requires author_id NOT NULL.
-- Instead we insert as the first real user who signs up (not possible in SQL).
-- So: create rows only when at least one auth user exists; pick latest.

with u as (
  select id as author_id
  from auth.users
  order by created_at asc
  limit 1
),
ins_threads as (
  insert into public.forum_threads (author_id, title, body)
  select
    u.author_id,
    'Welcome to the CrowdUnlock Forum',
    'Use this forum to request content, discuss what should be unlocked next, and coordinate support.\n\nPublic can read everything. You must sign in to post.'
  from u
  where u.author_id is not null
  on conflict do nothing
  returning id
)
insert into public.forum_replies (thread_id, author_id, body)
select
  t.id,
  u.author_id,
  'Tip: Start a thread with a specific request (what, why, and a link if relevant).'
from public.forum_threads t
join u on true
where t.title = 'Welcome to the CrowdUnlock Forum'
on conflict do nothing;
