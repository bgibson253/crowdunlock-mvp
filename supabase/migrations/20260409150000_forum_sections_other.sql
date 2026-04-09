-- Add missing forum sections for document, image, and other content types
-- Both "request" and "listed" sections to match existing pattern

insert into public.forum_sections (id, name, description, sort_order)
values
  ('request_document', 'Request Document', 'Request leaked memos, contracts, legal filings, internal communications, and other documents.', 50),
  ('request_image', 'Request Image', 'Request photos, screenshots, receipts, and visual evidence.', 60),
  ('request_other', 'Request Other', 'Request anything that doesn''t fit the other categories.', 70),
  ('listed_documents', 'Listed Documents', 'Auto-generated threads for new document uploads.', 130),
  ('listed_images', 'Listed Images', 'Auto-generated threads for new image uploads.', 140),
  ('listed_other', 'Listed Other', 'Auto-generated threads for other upload types.', 150)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order;
