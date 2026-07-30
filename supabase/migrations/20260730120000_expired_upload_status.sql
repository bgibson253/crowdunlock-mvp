-- Allow 'expired' status for uploads whose funding deadline passed unfunded.
-- Refund automation (/api/cron/expire-refunds) sets this status after
-- refunding all contributions on the upload.

alter table public.uploads
  drop constraint if exists uploads_status_check;

alter table public.uploads
  add constraint uploads_status_check
  check (status in ('private','funding','unlocked','rejected','expired'));
