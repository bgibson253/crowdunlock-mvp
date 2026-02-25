-- Backfill forum_threads.author_id when missing.
-- Assumption: thread author is the author of the first reply (old bug created threads with null author_id).

update public.forum_threads t
set author_id = r.author_id
from (
  select distinct on (thread_id)
    thread_id,
    author_id
  from public.forum_replies
  where author_id is not null
  order by thread_id, created_at asc
) r
where t.id = r.thread_id
  and t.author_id is null;
