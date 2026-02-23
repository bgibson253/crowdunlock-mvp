-- Allow system/admin-created listing threads by permitting NULL author_id

alter table public.forum_threads alter column author_id drop not null;
