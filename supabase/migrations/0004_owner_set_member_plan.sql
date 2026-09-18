-- (Substituída pela 0005: coaching passou a ser por ligação treinador→atleta,
-- via set_athlete_plan. Mantida por histórico.)
-- O organizador podia definir o plano de um participante do seu desafio.
create or replace function public.set_member_plan(p_challenge uuid, p_user uuid, p_plan jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from public.challenges
    where id = p_challenge and owner_id = auth.uid()
  ) then
    raise exception 'NOT_OWNER';
  end if;
  update public.members
  set state = jsonb_set(
                jsonb_set(coalesce(state, '{}'::jsonb), '{plan}', p_plan, true),
                '{_rev}', to_jsonb(gen_random_uuid()::text), true
              ),
      updated_at = now()
  where challenge_id = p_challenge and user_id = p_user;
end;
$$;
revoke all on function public.set_member_plan(uuid, uuid, jsonb) from public;
grant execute on function public.set_member_plan(uuid, uuid, jsonb) to authenticated;
