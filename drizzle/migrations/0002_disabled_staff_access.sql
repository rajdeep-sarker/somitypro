create or replace function public.has_access(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
 select public.has_role(_user_id,'admin') or (public.has_role(_user_id,'staff') and exists(select 1 from public.staff where user_id=_user_id and status='active'))
$$;