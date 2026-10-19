-- Mealwise Phase 4: weight history, meal log, and the two profile answers the daily target needs.
-- Body weight and what someone eats are sensitive personal data: owner-only access via RLS,
-- anon has no access, and every row goes when the account goes (cascade from profiles).

-- 1. Profile: sex (optional, only for the energy estimate) and a single "needs professional guidance"
--    answer. We deliberately do not record WHICH condition (pregnancy, illness, …): data minimisation.
alter table public.profiles
  add column sex text check (sex in ('female', 'male')),
  add column needs_guidance boolean not null default false;

comment on column public.profiles.sex is 'Optional. Used only for the calorie estimate; null = not given (midpoint used).';
comment on column public.profiles.needs_guidance is 'User said they are pregnant/breastfeeding or have a condition affecting diet. Targets are not shown. Which one is not stored.';

-- 2. Weight history: one entry per day; editing a day replaces it.
create table public.weight_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  measured_on date not null check (measured_on >= date '2000-01-01' and measured_on <= current_date + 1),
  weight_kg numeric(5, 2) not null check (weight_kg between 20 and 400),
  entered_unit text not null default 'kg' check (entered_unit in ('kg', 'lb')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, measured_on)
);

comment on table public.weight_entries is 'Body weight history. Sensitive personal data: owner-only via RLS.';

-- 3. Meal log. Figures are copied at logging time so later catalogue corrections never rewrite history.
create table public.meal_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  meal_slug text not null check (meal_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(meal_slug) <= 80),
  logged_for date not null check (logged_for >= date '2000-01-01' and logged_for <= current_date + 1),
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  portion numeric(4, 2) not null check (portion between 0.25 and 4),
  kcal integer not null check (kcal between 0 and 10000),
  protein_g numeric(6, 1) not null check (protein_g between 0 and 1000),
  carbs_g numeric(6, 1) not null check (carbs_g between 0 and 1000),
  fat_g numeric(6, 1) not null check (fat_g between 0 and 1000),
  created_at timestamptz not null default now()
);

create index meal_logs_user_day on public.meal_logs (user_id, logged_for);

comment on table public.meal_logs is 'What a user ate, with per-entry figures copied at logging time. Sensitive personal data: owner-only via RLS.';

-- 4. Row-level security: read, add and change own rows only. (Removing rows: see …100002.)
alter table public.weight_entries enable row level security;
alter table public.meal_logs enable row level security;

create policy "Users can read their own weights" on public.weight_entries for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can add their own weights" on public.weight_entries for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users can change their own weights" on public.weight_entries for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "Users can read their own meal log" on public.meal_logs for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can add to their own meal log" on public.meal_logs for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users can change their own meal log" on public.meal_logs for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

revoke all on public.weight_entries, public.meal_logs from anon;
revoke truncate, references, trigger on public.weight_entries, public.meal_logs from authenticated;

-- 5. Keep updated_at honest on weights.
create or replace function public.weight_entries_touch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.weight_entries_touch() from public, anon, authenticated;

create trigger weight_entries_touch
  before insert or update on public.weight_entries
  for each row execute function public.weight_entries_touch();
