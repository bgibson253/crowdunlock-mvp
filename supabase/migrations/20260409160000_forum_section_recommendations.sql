-- Add "Recommendations to the Creator" section under General Discussion
insert into public.forum_sections (id, name, description, sort_order)
values
  ('recommendations', 'Site Recommendations', 'Suggestions, feature requests, and feedback for the Unmaskr team.', 12)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order;
