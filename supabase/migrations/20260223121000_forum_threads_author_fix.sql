-- Ensure forum threads are authored by the logged-in user (ignore client-provided author_id)

create or replace function public.set_thread_author()
returns trigger
language plpgsql
as $$
begin
  new.author_id := auth.uid();
  return new;
end;
$$;

drop trigger if exists trg_forum_threads_set_author on public.forum_threads;
create trigger trg_forum_threads_set_author
before insert on public.forum_threads
for each row
when (new.author_id is null)
execute procedure public.set_thread_author();
