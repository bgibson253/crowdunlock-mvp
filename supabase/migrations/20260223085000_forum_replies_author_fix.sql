-- Ensure forum replies are authored by the logged-in user, not an explicit author_id from the client

alter table public.forum_replies alter column author_id drop default;

create or replace function public.set_reply_author()
returns trigger
language plpgsql
as $$
begin
  new.author_id := auth.uid();
  return new;
end;
$$;

drop trigger if exists trg_forum_replies_set_author on public.forum_replies;
create trigger trg_forum_replies_set_author
before insert on public.forum_replies
for each row
execute procedure public.set_reply_author();
