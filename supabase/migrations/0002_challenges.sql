-- JessiFit — desafios de grupo
-- Evolução do modelo de 2 pessoas (treinador + atleta) para um grupo de
-- participantes, cada um com o seu próprio treino, e um ranking por pontos.
-- Acesso por código de convite; o criador é o organizador.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- challenges
-- ---------------------------------------------------------------------------
create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null default 'Desafio',
  weekly_goal int not null default 4,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.challenges enable row level security;

-- ---------------------------------------------------------------------------
-- members: participação + estado de treino de cada pessoa (JSON por membro)
-- ---------------------------------------------------------------------------
create table if not exists public.members (
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null default '',
  is_owner boolean not null default false,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (challenge_id, user_id)
);
alter table public.members enable row level security;

grant select, insert, update, delete on public.members to authenticated;
grant select, update on public.challenges to authenticated;

-- Sou membro deste desafio? (security definer evita recursão de RLS em members)
create or replace function public.is_challenge_member(cid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.members
    where challenge_id = cid and user_id = auth.uid()
  );
$$;
revoke all on function public.is_challenge_member(uuid) from public;
grant execute on function public.is_challenge_member(uuid) to authenticated;

-- RLS: challenges
drop policy if exists challenges_select_member on public.challenges;
create policy challenges_select_member on public.challenges
  for select using (owner_id = auth.uid() or public.is_challenge_member(id));
drop policy if exists challenges_update_owner on public.challenges;
create policy challenges_update_owner on public.challenges
  for update using (owner_id = auth.uid());

-- RLS: members (vejo todos os membros dos desafios onde participo; escrevo só o meu)
drop policy if exists members_select_same_challenge on public.members;
create policy members_select_same_challenge on public.members
  for select using (public.is_challenge_member(challenge_id));
drop policy if exists members_insert_self on public.members;
create policy members_insert_self on public.members
  for insert with check (user_id = auth.uid());
drop policy if exists members_update_self on public.members;
create policy members_update_self on public.members
  for update using (user_id = auth.uid());
drop policy if exists members_delete_self on public.members;
create policy members_delete_self on public.members
  for delete using (user_id = auth.uid());

-- Código de convite curto e único (sem caracteres ambíguos)
create or replace function public.gen_challenge_code()
returns text language plpgsql set search_path = public as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text;
  i int;
begin
  loop
    code := '';
    for i in 1..6 loop
      code := code || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    end loop;
    exit when not exists (select 1 from public.challenges c where c.code = code);
  end loop;
  return code;
end;
$$;

-- Criar desafio (o criador entra como organizador)
create or replace function public.create_challenge(p_name text, p_goal int)
returns public.challenges language plpgsql security definer set search_path = public as $$
declare
  c public.challenges;
  nm text;
begin
  select coalesce(nullif(trim(p.name), ''), '') into nm
    from public.profiles p where p.id = auth.uid();
  insert into public.challenges (code, name, weekly_goal, owner_id)
  values (
    public.gen_challenge_code(),
    coalesce(nullif(trim(p_name), ''), 'Desafio'),
    greatest(1, least(coalesce(p_goal, 4), 7)),
    auth.uid()
  )
  returning * into c;
  insert into public.members (challenge_id, user_id, display_name, is_owner)
  values (c.id, auth.uid(), nm, true)
  on conflict (challenge_id, user_id) do nothing;
  return c;
end;
$$;
revoke all on function public.create_challenge(text, int) from public;
grant execute on function public.create_challenge(text, int) to authenticated;

-- Entrar num desafio por código
create or replace function public.join_challenge(p_code text)
returns public.challenges language plpgsql security definer set search_path = public as $$
declare
  c public.challenges;
  nm text;
begin
  select * into c from public.challenges where code = upper(trim(p_code));
  if not found then
    raise exception 'CODE_NOT_FOUND';
  end if;
  select coalesce(nullif(trim(p.name), ''), '') into nm
    from public.profiles p where p.id = auth.uid();
  insert into public.members (challenge_id, user_id, display_name, is_owner)
  values (c.id, auth.uid(), nm, false)
  on conflict (challenge_id, user_id) do nothing;
  return c;
end;
$$;
revoke all on function public.join_challenge(text) from public;
grant execute on function public.join_challenge(text) to authenticated;

-- Os meus desafios
create or replace function public.my_challenges()
returns setof public.challenges language sql security definer stable set search_path = public as $$
  select c.* from public.challenges c
  join public.members m on m.challenge_id = c.id
  where m.user_id = auth.uid()
  order by c.created_at;
$$;
revoke all on function public.my_challenges() from public;
grant execute on function public.my_challenges() to authenticated;

-- Realtime para ranking ao vivo
alter publication supabase_realtime add table public.members;
alter publication supabase_realtime add table public.challenges;
