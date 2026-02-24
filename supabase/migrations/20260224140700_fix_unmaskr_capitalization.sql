-- Ensure Ben's accounts have desired username capitalization.

update public.profiles
set username = 'Unmaskr'
where id = (
  select id from auth.users where email = 'unmaskr@proton.me' limit 1
);

update public.profiles
set username = 'Unmaskvr'
where id = (
  select id from auth.users where email = 'unmaskvr@proton.me' limit 1
);
