-- ============================================================
-- NutriTrack — Schema Supabase
-- Cole e execute no Supabase > SQL Editor > New Query
-- ============================================================

-- Habilitar UUID
create extension if not exists "uuid-ossp";

-- ── TABELA: food_items ──────────────────────────────────────
-- Produtos cadastrados pelo usuário (personalizados)
create table if not exists food_items (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null,
  brand       text,
  category    text default 'mercado',
  store       text,
  calories    numeric(8,2) default 0,
  protein     numeric(8,2) default 0,
  carbs       numeric(8,2) default 0,
  fat         numeric(8,2) default 0,
  serving     numeric(8,2) default 100,
  unit        text default 'g',
  price       numeric(8,2) default 0,
  photo_url   text,
  description text,
  barcode     text,
  source      text default 'manual',  -- 'manual' | 'openfoodfacts'
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ── TABELA: daily_logs ──────────────────────────────────────
-- Refeições registradas por dia
create table if not exists daily_logs (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  item_id     uuid references food_items(id) on delete cascade,
  log_date    date not null default current_date,
  meal        text not null,
  quantity    numeric(8,2) not null,
  -- snapshot nutricional no momento do registro
  snap_calories numeric(8,2),
  snap_protein  numeric(8,2),
  snap_carbs    numeric(8,2),
  snap_fat      numeric(8,2),
  created_at  timestamptz default now()
);

-- ── TABELA: scheduled_plans ─────────────────────────────────
-- Planos agendados para dias futuros
create table if not exists scheduled_plans (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  plan_date   date not null,
  item_id     uuid references food_items(id) on delete cascade,
  meal        text not null,
  quantity    numeric(8,2) not null,
  created_at  timestamptz default now(),
  unique (user_id, plan_date, item_id, meal)
);

-- ── TABELA: user_goals ──────────────────────────────────────
-- Metas diárias de cada usuário
create table if not exists user_goals (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references auth.users(id) on delete cascade not null unique,
  calories_goal integer default 2500,
  protein_goal  integer default 150,
  updated_at    timestamptz default now()
);

-- ── ROW LEVEL SECURITY (RLS) ────────────────────────────────
-- Cada usuário só acessa seus próprios dados

alter table food_items      enable row level security;
alter table daily_logs      enable row level security;
alter table scheduled_plans enable row level security;
alter table user_goals      enable row level security;

-- food_items
create policy "Users manage own items"
  on food_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- daily_logs
create policy "Users manage own logs"
  on daily_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- scheduled_plans
create policy "Users manage own plans"
  on scheduled_plans for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- user_goals
create policy "Users manage own goals"
  on user_goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── TRIGGER: updated_at automático ──────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger food_items_updated_at
  before update on food_items
  for each row execute function update_updated_at();

-- ── ÍNDICES ─────────────────────────────────────────────────
create index if not exists idx_food_items_user    on food_items(user_id);
create index if not exists idx_daily_logs_user    on daily_logs(user_id, log_date);
create index if not exists idx_scheduled_plans_user on scheduled_plans(user_id, plan_date);
