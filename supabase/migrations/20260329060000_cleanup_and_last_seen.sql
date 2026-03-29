-- Clean up debug table
drop table if exists public._debug_log;

-- Add last_seen_at for online status
alter table public.profiles add column if not exists last_seen_at timestamptz;
