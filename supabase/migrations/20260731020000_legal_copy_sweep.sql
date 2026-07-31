-- Legal-safety copy sweep: remove language soliciting unlawfully obtained
-- documents. Platform copy must describe LAWFUL content (public records,
-- FOIA results, court filings, authorized disclosures) — user requests are
-- their own speech, but OUR copy must not induce misappropriation.

update public.forum_sections set
  description = 'Request public records, contracts, court filings, FOIA results, and other documents of public interest.'
where id = 'request_document';

update public.forum_sections set
  description = 'Request datasets, public records, FOIA results, and analysis.'
where id = 'request_data';

-- Gift catalog: 'Leak Dropbox' brands the platform around leaks. Rename.
update public.gift_catalog set name = 'Document Vault'
where id = 'leak_dropbox' and name = 'Leak Dropbox';
