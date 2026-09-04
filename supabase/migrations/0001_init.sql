-- JessiFit — esquema (online)
-- App pessoal de 2 utilizadores (treinador + atleta): um documento de estado
-- partilhado (JSON) que ambos leem/escrevem, com sincronização em tempo real.
-- Autenticação por email+password; acesso restrito aos 2 primeiros registados.

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  role text not null default 'athlete' check (role in ('coach', 'athlete')),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles_read_authenticated" on public.profiles
  for select using (auth.role() = 'authenticated');
create policy "profiles_insert_own" on public.profiles
  for insert with check (id = auth.uid());
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());

-- ---------------------------------------------------------------------------
-- allowed_users: só os 2 primeiros registados acedem aos dados
-- ---------------------------------------------------------------------------
create table if not exists public.allowed_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.allowed_users enable row level security;
create policy "allowed_read" on public.allowed_users
  for select using (auth.role() = 'authenticated');

create or replace function public.claim_access()
returns boolean language plpgsql security definer set search_path = public as $$
declare cnt int;
begin
  if exists (select 1 from public.allowed_users where user_id = auth.uid()) then
    return true;
  end if;
  select count(*) into cnt from public.allowed_users;
  if cnt < 2 then
    insert into public.allowed_users (user_id) values (auth.uid());
    return true;
  end if;
  return false;
end;
$$;
revoke all on function public.claim_access() from public;
grant execute on function public.claim_access() to authenticated;

-- ---------------------------------------------------------------------------
-- shared_state: documento único partilhado (restrito a allowed_users)
-- ---------------------------------------------------------------------------
create table if not exists public.shared_state (
  id text primary key default 'main',
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.shared_state enable row level security;
create policy "shared_read" on public.shared_state for select
  using (exists (select 1 from public.allowed_users a where a.user_id = auth.uid()));
create policy "shared_insert" on public.shared_state for insert
  with check (exists (select 1 from public.allowed_users a where a.user_id = auth.uid()));
create policy "shared_update" on public.shared_state for update
  using (exists (select 1 from public.allowed_users a where a.user_id = auth.uid()));

insert into public.shared_state (id, data) values ('main', '{}'::jsonb)
  on conflict (id) do nothing;
alter publication supabase_realtime add table public.shared_state;

-- ---------------------------------------------------------------------------
-- Ao registar: cria o perfil e auto-confirma o email (sem passo de email)
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.auto_confirm()
returns trigger language plpgsql security definer set search_path = auth as $$
begin
  if new.email_confirmed_at is null then
    new.email_confirmed_at := now();
  end if;
  return new;
end;
$$;
drop trigger if exists auto_confirm_users on auth.users;
create trigger auto_confirm_users
  before insert on auth.users
  for each row execute function public.auto_confirm();
