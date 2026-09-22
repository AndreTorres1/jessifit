-- set_athlete_plan passa a poder enviar também os guias de exercício
-- (state.exercises: vídeo + técnica) para a atleta, além do plano.
drop function if exists public.set_athlete_plan(uuid, jsonb);

create or replace function public.set_athlete_plan(
  p_athlete uuid,
  p_plan jsonb,
  p_exercises jsonb default null
)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from public.coach_athletes where coach_id = auth.uid() and athlete_id = p_athlete
  ) then
    raise exception 'NOT_COACH';
  end if;
  insert into public.user_state (user_id, state, updated_at)
  values (
    p_athlete,
    jsonb_build_object(
      'plan', p_plan,
      'exercises', coalesce(p_exercises, '[]'::jsonb),
      '_rev', gen_random_uuid()::text
    ),
    now()
  )
  on conflict (user_id) do update
    set state = jsonb_set(
                  jsonb_set(
                    jsonb_set(coalesce(public.user_state.state, '{}'::jsonb), '{plan}', p_plan, true),
                    '{exercises}',
                    coalesce(p_exercises, public.user_state.state -> 'exercises', '[]'::jsonb),
                    true
                  ),
                  '{_rev}', to_jsonb(gen_random_uuid()::text), true
                ),
        updated_at = now();
end;
$$;
revoke all on function public.set_athlete_plan(uuid, jsonb, jsonb) from public;
grant execute on function public.set_athlete_plan(uuid, jsonb, jsonb) to authenticated;
