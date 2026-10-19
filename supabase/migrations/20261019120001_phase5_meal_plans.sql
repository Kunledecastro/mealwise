-- Mealwise Phase 5: one meal plan per user, with the shopping-list ticks.
-- One row per user (DECISION_LOG 058): the plan's meals and the shopping ticks are small JSON values
-- validated by the database, so creating, swapping and clearing are all plain updates (no row removal
-- needed). The row goes when the account goes (cascade from profiles). Owner-only via RLS.

-- items: [{ "day": 0-6, "slot": breakfast|lunch|dinner|snack, "slug": meal slug, "servings": 0.5-8 in halves }]
--        at most one meal per day and slot, days within the plan's length.
create or replace function public.meal_plan_items_valid(items jsonb, days smallint)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(items) = 'array'
    and jsonb_array_length(items) <= 28
    and not exists (
      select 1 from jsonb_array_elements(items) e
      where not (
        jsonb_typeof(e) = 'object'
        and (select count(*) from jsonb_object_keys(e)) = 4
        and coalesce(e ->> 'day', '') ~ '^[0-6]$'
        and (e ->> 'day')::int < days
        and e ->> 'slot' in ('breakfast', 'lunch', 'dinner', 'snack')
        and coalesce(e ->> 'slug', '') ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
        and char_length(e ->> 'slug') <= 80
        and jsonb_typeof(e -> 'servings') = 'number'
        and (e ->> 'servings')::numeric between 0.5 and 8
        and (e ->> 'servings')::numeric * 2 = trunc((e ->> 'servings')::numeric * 2)
      )
    )
    and (select count(distinct (e ->> 'day', e ->> 'slot')) from jsonb_array_elements(items) e) = jsonb_array_length(items);
$$;

-- shopping: { "<ingredient id>": "have" | "bought" }, at most 300 entries.
create or replace function public.meal_plan_shopping_valid(shopping jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(shopping) = 'object'
    and (select count(*) from jsonb_object_keys(shopping)) <= 300
    and not exists (
      select 1 from jsonb_each(shopping) kv
      where not (kv.key ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(kv.key) <= 60 and kv.value in ('"have"'::jsonb, '"bought"'::jsonb))
    );
$$;

create table public.meal_plans (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  start_date date not null check (start_date >= date '2020-01-01' and start_date <= current_date + 31),
  days smallint not null check (days between 1 and 7),
  include_snacks boolean not null default false,
  items jsonb not null default '[]'::jsonb,
  shopping jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint meal_plan_items_valid check (public.meal_plan_items_valid(items, days)),
  constraint meal_plan_shopping_valid check (public.meal_plan_shopping_valid(shopping))
);

comment on table public.meal_plans is 'Each user''s current meal plan and shopping-list ticks. Personal data: owner-only via RLS.';

alter table public.meal_plans enable row level security;

create policy "Users can read their own plan" on public.meal_plans for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can create their own plan" on public.meal_plans for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users can change their own plan" on public.meal_plans for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

revoke all on public.meal_plans from anon;
revoke truncate, references, trigger on public.meal_plans from authenticated;

create or replace function public.meal_plans_touch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.meal_plans_touch() from public, anon, authenticated;

create trigger meal_plans_touch
  before insert or update on public.meal_plans
  for each row execute function public.meal_plans_touch();
