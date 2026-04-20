-- Live rooms: pin SFU region per live session so host+viewers always connect to same SFU

alter table public.live_rooms
  add column if not exists sfu_region text;

create index if not exists live_rooms_sfu_region_idx on public.live_rooms (sfu_region);
