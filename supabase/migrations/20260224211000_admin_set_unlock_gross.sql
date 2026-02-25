-- Admin helper: set a specific user's unlock gross spend (cents)
-- This is to let the operator manually test badges.

create or replace function public.admin_set_unlock_gross(target_user_id uuid, gross_cents bigint)
returns void
language plpgsql
security definer
as $$
begin
  update public.profiles
  set unlock_gross_cents = greatest(gross_cents, 0)
  where id = target_user_id;
end;
$$;

-- Tighten execution: only service_role should call this.
revoke all on function public.admin_set_unlock_gross(uuid, bigint) from public;
revoke all on function public.admin_set_unlock_gross(uuid, bigint) from authenticated;
revoke all on function public.admin_set_unlock_gross(uuid, bigint) from anon;
