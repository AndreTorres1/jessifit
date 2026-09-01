-- JessiFit — esquema inicial (online)
-- Modelo simples para uma app pessoal de 2 utilizadores (treinador + atleta):
-- um documento de estado partilhado (JSON) que ambos leem/escrevem, com
-- sincronização em tempo real. Autenticação por email+password; o papel de
-- cada utilizador fica no seu perfil.

-- ---------------------------------------------------------------------------
-- profiles: um registo por utilizador autenticado
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  role text not null default 'athlete' check (role in ('coach', 'athlete')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- utilizadores autenticados veem todos os perfis (para mostrar nomes) e gerem o seu
create policy "profiles_read_authenticated" on public.profiles
  for select using (auth.role() = 'authenticated');
create policy "profiles_insert_own" on public.profiles
  for insert with check (id = auth.uid());
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());

-- ---------------------------------------------------------------------------
-- shared_state: documento único partilhado com todo o estado da app
-- ---------------------------------------------------------------------------
create table if not exists public.shared_state (
  id text primary key default 'main',
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.shared_state enable row level security;

-- qualquer utilizador autenticado pode ler e escrever o documento partilhado
create policy "shared_read" on public.shared_state
  for select using (auth.role() = 'authenticated');
create policy "shared_insert" on public.shared_state
  for insert with check (auth.role() = 'authenticated');
create policy "shared_update" on public.shared_state
  for update using (auth.role() = 'authenticated');

-- linha inicial vazia
insert into public.shared_state (id, data) values ('main', '{}'::jsonb)
  on conflict (id) do nothing;

-- sincronização em tempo real do documento partilhado
alter publication supabase_realtime add table public.shared_state;

-- ---------------------------------------------------------------------------
-- Ao registar um utilizador, criar automaticamente o seu perfil
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
