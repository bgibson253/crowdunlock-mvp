-- Add an "Introduce yourself" forum section for uploader credibility.

insert into public.forum_sections (id, name, description, sort_order)
values (
  'introduce_yourself',
  'Introduce yourself',
  'Introduce yourself, share credibility, and what you plan to upload.',
  5
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order;
