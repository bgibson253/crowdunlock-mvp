-- Share tracking on forum threads
alter table public.forum_threads
  add column if not exists share_count integer not null default 0;

-- Public RPC: count a share action (no auth required — shares can come from
-- logged-out readers too). Rate limiting happens at the API layer.
create or replace function public.increment_thread_share(p_thread_id uuid)
returns void
language sql
security definer
as $$
  update public.forum_threads
  set share_count = share_count + 1
  where id = p_thread_id and deleted_at is null;
$$;
