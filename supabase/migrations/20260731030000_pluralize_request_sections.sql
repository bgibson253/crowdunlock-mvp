-- Grammar pass on forum section names: pluralize request categories.
-- "Request Story" → "Request Stories", etc.

update public.forum_sections set name = 'Request Stories'   where id = 'request_story';
update public.forum_sections set name = 'Request Data'      where id = 'request_data';
update public.forum_sections set name = 'Request Videos'    where id = 'request_video';
update public.forum_sections set name = 'Request Documents' where id = 'request_document';
update public.forum_sections set name = 'Request Images'    where id = 'request_image';
update public.forum_sections set name = 'Request Other'     where id = 'request_other';
