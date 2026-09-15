-- Poderes de organizador: datas do desafio + remover participante.

alter table public.challenges add column if not exists starts_on date;
alter table public.challenges add column if not exists ends_on date;

-- Remover um participante (só o organizador; não pode remover-se a si próprio).
create or replace function public.remove_member(p_challenge uuid, p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from public.challenges
    where id = p_challenge and owner_id = auth.uid()
  ) then
    raise exception 'NOT_OWNER';
  end if;
  if p_user = auth.uid() then
    raise exception 'CANNOT_REMOVE_SELF';
  end if;
  delete from public.members where challenge_id = p_challenge and user_id = p_user;
end;
$$;
revoke all on function public.remove_member(uuid, uuid) from public;
grant execute on function public.remove_member(uuid, uuid) to authenticated;
