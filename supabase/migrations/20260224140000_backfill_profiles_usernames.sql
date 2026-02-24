-- Backfill any missing profiles so forum posts show the correct author instead of Administrator.

insert into public.profiles (id, username, avatar_url)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
  u.raw_user_meta_data->>'avatar_url'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- Ensure the specific account uses the expected display name.
update public.profiles
set username = 'Unmaskvr'
where username is null
  and id in (
    select id from auth.users where email = 'unmaskvr@proton.me'
  );

update public.profiles
set username = 'Unmaskvr'
where id in (
  select id from auth.users where email = 'unmaskvr@proton.me'
);
