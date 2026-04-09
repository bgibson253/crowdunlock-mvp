-- Fix section names: "Introduce Yourself" capitalization + "Site Recommendations" rename

update public.forum_sections
set name = 'Introduce Yourself'
where id = 'introduce_yourself' and name = 'Introduce yourself';

update public.forum_sections
set name = 'Site Recommendations'
where id = 'recommendations';
