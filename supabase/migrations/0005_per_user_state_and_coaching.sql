-- Treino por utilizador (independente de desafios) + ligações treinador→atleta.
-- Cada pessoa tem o seu estado de treino em user_state; o desafio passa a ser
-- opcional e o ranking lê o user_state de cada membro.

create table if not exists public.user_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.user_state enable row level security;
grant select, insert, update on public.user_state to authenticated;

create table if not exists public.coach_athletes (
  coach_id uuid not null references auth.users(id) on delete cascade,
  athlete_id uuid not null references auth.users(id) on delete cascade,
  athlete_name text not null default '',
  created_at timestamptz not null default now(),
  primary key (coach_id, athlete_id)
);
alter table public.coach_athletes enable row level security;
grant select, insert, delete on public.coach_athletes to authenticated;

create or replace function public.is_coach_of(other uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.coach_athletes where coach_id = auth.uid() and athlete_id = other
  );
$$;
revoke all on function public.is_coach_of(uuid) from public;
grant execute on function public.is_coach_of(uuid) to authenticated;

create or replace function public.shares_challenge(other uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.members m1
    join public.members m2 on m1.challenge_id = m2.challenge_id
    where m1.user_id = auth.uid() and m2.user_id = other
  );
$$;
revoke all on function public.shares_challenge(uuid) from public;
grant execute on function public.shares_challenge(uuid) to authenticated;

drop policy if exists user_state_select on public.user_state;
create policy user_state_select on public.user_state for select
  using (user_id = auth.uid() or public.is_coach_of(user_id) or public.shares_challenge(user_id));
drop policy if exists user_state_insert on public.user_state;
create policy user_state_insert on public.user_state for insert
  with check (user_id = auth.uid());
drop policy if exists user_state_update on public.user_state;
create policy user_state_update on public.user_state for update
  using (user_id = auth.uid());

drop policy if exists coach_select on public.coach_athletes;
create policy coach_select on public.coach_athletes for select
  using (coach_id = auth.uid() or athlete_id = auth.uid());
drop policy if exists coach_insert on public.coach_athletes;
create policy coach_insert on public.coach_athletes for insert
  with check (coach_id = auth.uid());
drop policy if exists coach_delete on public.coach_athletes;
create policy coach_delete on public.coach_athletes for delete
  using (coach_id = auth.uid());

create or replace function public.add_athlete_by_email(p_email text)
returns table (athlete_id uuid, athlete_name text)
language plpgsql security definer set search_path = public as $$
declare
  uid uuid;
  nm text;
begin
  select id into uid from auth.users where lower(email) = lower(trim(p_email));
  if uid is null then raise exception 'USER_NOT_FOUND'; end if;
  if uid = auth.uid() then raise exception 'CANNOT_ADD_SELF'; end if;
  select coalesce(nullif(trim(p.name), ''), split_part(p_email, '@', 1))
    into nm from public.profiles p where p.id = uid;
  insert into public.coach_athletes (coach_id, athlete_id, athlete_name)
  values (auth.uid(), uid, nm)
  on conflict (coach_id, athlete_id) do update set athlete_name = excluded.athlete_name;
  return query select uid, nm;
end;
$$;
revoke all on function public.add_athlete_by_email(text) from public;
grant execute on function public.add_athlete_by_email(text) to authenticated;

create or replace function public.set_athlete_plan(p_athlete uuid, p_plan jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from public.coach_athletes where coach_id = auth.uid() and athlete_id = p_athlete
  ) then
    raise exception 'NOT_COACH';
  end if;
  insert into public.user_state (user_id, state, updated_at)
  values (p_athlete, jsonb_build_object('plan', p_plan, '_rev', gen_random_uuid()::text), now())
  on conflict (user_id) do update
    set state = jsonb_set(
                  jsonb_set(coalesce(public.user_state.state, '{}'::jsonb), '{plan}', p_plan, true),
                  '{_rev}', to_jsonb(gen_random_uuid()::text), true),
        updated_at = now();
end;
$$;
revoke all on function public.set_athlete_plan(uuid, jsonb) from public;
grant execute on function public.set_athlete_plan(uuid, jsonb) to authenticated;

create or replace function public.my_athletes()
returns table (athlete_id uuid, athlete_name text)
language sql security definer stable set search_path = public as $$
  select athlete_id, athlete_name from public.coach_athletes
  where coach_id = auth.uid() order by created_at;
$$;
revoke all on function public.my_athletes() from public;
grant execute on function public.my_athletes() to authenticated;

alter publication supabase_realtime add table public.user_state;
