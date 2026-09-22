-- Notificações push: subscrições por telemóvel + config privada do servidor.
-- (As chaves VAPID são inseridas em app_config fora do controlo de versões.)

create table if not exists public.push_subscriptions (
  endpoint text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
grant select, insert, delete on public.push_subscriptions to authenticated;

drop policy if exists push_select_own on public.push_subscriptions;
create policy push_select_own on public.push_subscriptions for select
  using (user_id = auth.uid());
drop policy if exists push_insert_own on public.push_subscriptions;
create policy push_insert_own on public.push_subscriptions for insert
  with check (user_id = auth.uid());
drop policy if exists push_delete_own on public.push_subscriptions;
create policy push_delete_own on public.push_subscriptions for delete
  using (user_id = auth.uid());

-- Config privada do servidor (RLS sem políticas = só o service role lê).
create table if not exists public.app_config (
  key text primary key,
  value text not null
);
alter table public.app_config enable row level security;
