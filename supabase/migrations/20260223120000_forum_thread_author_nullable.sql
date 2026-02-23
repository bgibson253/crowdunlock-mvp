-- Allow auto-generated listing threads to have NULL author_id (system/admin)

alter table public.forum_threads alter column author_id drop not null;
