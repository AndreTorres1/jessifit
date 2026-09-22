-- Corrige "column reference athlete_id is ambiguous": os nomes das colunas de
-- saída (RETURNS TABLE) chocavam com as colunas da tabela no ON CONFLICT.
-- Usa variáveis locais + conflito pelo nome da constraint.
create or replace function public.add_athlete_by_email(p_email text)
returns table (athlete_id uuid, athlete_name text)
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid;
  v_nm text;
begin
  select id into v_uid from auth.users where lower(email) = lower(trim(p_email));
  if v_uid is null then raise exception 'USER_NOT_FOUND'; end if;
  if v_uid = auth.uid() then raise exception 'CANNOT_ADD_SELF'; end if;
  select coalesce(nullif(trim(p.name), ''), split_part(p_email, '@', 1))
    into v_nm from public.profiles p where p.id = v_uid;
  insert into public.coach_athletes as ca (coach_id, athlete_id, athlete_name)
  values (auth.uid(), v_uid, v_nm)
  on conflict on constraint coach_athletes_pkey
  do update set athlete_name = excluded.athlete_name;
  athlete_id := v_uid;
  athlete_name := v_nm;
  return next;
end;
$$;
revoke all on function public.add_athlete_by_email(text) from public;
grant execute on function public.add_athlete_by_email(text) to authenticated;
