-- Set username for Ben's primary account

update public.profiles
set username = 'Unmaskr'
where id = (
  select id from auth.users where email = 'unmaskr@proton.me' limit 1
);
