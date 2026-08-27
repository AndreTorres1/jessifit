-- JessiFit — esquema inicial (Fase 1)
-- Correr no SQL Editor do projeto Supabase, ou via CLI.
-- Modelo: um treinador envia treinos semanais a uma atleta; a atleta marca
-- o que fez. Row Level Security garante que cada um só vê o que deve.

-- ---------------------------------------------------------------------------
-- profiles: um registo por utilizador autenticado (coach ou athlete)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  role text not null default 'athlete' check (role in ('coach', 'athlete')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- exercises: biblioteca reutilizável, com demonstração (vídeo e/ou foto)
-- ---------------------------------------------------------------------------
create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  description text,
  muscle_group text,
  video_url text,           -- link (ex.: YouTube)
  media_path text,          -- foto/GIF em Supabase Storage
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- workouts: um dia de treino, atribuído a uma atleta, numa semana
-- ---------------------------------------------------------------------------
create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles (id) on delete cascade,
  athlete_id uuid not null references public.profiles (id) on delete cascade,
  week_number int not null default 1,
  weekday text not null check (
    weekday in ('segunda','terca','quarta','quinta','sexta','sabado','domingo')
  ),
  title text,
  rest boolean not null default false,
  raw_text text,            -- texto original importado, para reimportar/editar
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- workout_items: exercícios de um treino (dados estruturados pelo parser)
-- ---------------------------------------------------------------------------
create table if not exists public.workout_items (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts (id) on delete cascade,
  exercise_id uuid references public.exercises (id) on delete set null,
  name text not null,       -- nome tal como escrito (liga à biblioteca por nome)
  sets int,
  reps text,                -- "8", "30s", "falha", "8-12"…
  weight text,              -- "60kg"
  note text,                -- "cada perna"…
  position int not null default 0
);

-- ---------------------------------------------------------------------------
-- completions: registo de conclusão por treino (feito/falhado + feedback)
-- ---------------------------------------------------------------------------
create table if not exists public.completions (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts (id) on delete cascade,
  athlete_id uuid not null references public.profiles (id) on delete cascade,
  status text not null check (status in ('done', 'failed')),
  difficulty int check (difficulty between 1 and 5),
  note text,
  fail_reason text,
  marked_at timestamptz not null default now(),
  unique (workout_id, athlete_id)
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles      enable row level security;
alter table public.exercises     enable row level security;
alter table public.workouts      enable row level security;
alter table public.workout_items enable row level security;
alter table public.completions   enable row level security;

-- helper: o utilizador atual é treinador?
create or replace function public.is_coach()
returns boolean language sql stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'coach'
  );
$$;

-- profiles: cada um lê/edita o seu; o treinador lê todos (para ver a atleta)
create policy "profiles_select_own_or_coach" on public.profiles
  for select using (id = auth.uid() or public.is_coach());
create policy "profiles_upsert_own" on public.profiles
  for insert with check (id = auth.uid());
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());

-- exercises: o dono (treinador) gere; a atleta pode ler (ver demonstrações)
create policy "exercises_read" on public.exercises
  for select using (owner_id = auth.uid() or not public.is_coach());
create policy "exercises_write_owner" on public.exercises
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- workouts: o treinador gere os que criou; a atleta lê os seus
create policy "workouts_read" on public.workouts
  for select using (athlete_id = auth.uid() or coach_id = auth.uid());
create policy "workouts_write_coach" on public.workouts
  for all using (coach_id = auth.uid()) with check (coach_id = auth.uid());

-- workout_items: seguem a permissão do treino a que pertencem
create policy "items_read" on public.workout_items
  for select using (
    exists (
      select 1 from public.workouts w
      where w.id = workout_id
        and (w.athlete_id = auth.uid() or w.coach_id = auth.uid())
    )
  );
create policy "items_write_coach" on public.workout_items
  for all using (
    exists (select 1 from public.workouts w where w.id = workout_id and w.coach_id = auth.uid())
  ) with check (
    exists (select 1 from public.workouts w where w.id = workout_id and w.coach_id = auth.uid())
  );

-- completions: a atleta gere as suas; o treinador lê
create policy "completions_read" on public.completions
  for select using (
    athlete_id = auth.uid()
    or exists (select 1 from public.workouts w where w.id = workout_id and w.coach_id = auth.uid())
  );
create policy "completions_write_athlete" on public.completions
  for all using (athlete_id = auth.uid()) with check (athlete_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Ao registar um utilizador, criar automaticamente o seu profile
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
