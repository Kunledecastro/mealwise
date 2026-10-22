-- Mealwise 2026-10-22 (DECISION_LOG 072-075): kitchen equipment, moods and usual shop on profiles;
-- the user's own shopping-list items on meal plans. Additive only: new nullable or defaulted columns.

alter table public.profiles
  add column appliances text[]
    check (appliances is null or (cardinality(appliances) between 1 and 5
      and appliances <@ array['stove','oven','grill','airfryer','blender'])),
  add column moods text[] not null default '{}'
    check (cardinality(moods) <= 3 and moods <@ array['quick','light','protein','budget','classic','different']),
  add column shop text check (shop in ('market', 'shoprite', 'spar', 'supermarket'));

comment on column public.profiles.appliances is 'Kitchen equipment the user has. Null = not answered (no filtering).';
comment on column public.profiles.moods is 'Up to three "in the mood for" tiles; soft preference for suggestions.';
comment on column public.profiles.shop is 'Where the user usually shops; labels the shopping list and selects shop prices where collected.';

-- extras: [{ "id": "own-<1-20 lowercase letters or digits>", "name": "1-60 characters" }], at most 50, ids unique.
create or replace function public.meal_plan_extras_valid(extras jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(extras) = 'array'
    and jsonb_array_length(extras) <= 50
    and not exists (
      select 1 from jsonb_array_elements(extras) e
      where not (
        jsonb_typeof(e) = 'object'
        and (select count(*) from jsonb_object_keys(e)) = 2
        and coalesce(e ->> 'id', '') ~ '^own-[a-z0-9]{1,20}$'
        and jsonb_typeof(e -> 'name') = 'string'
        and char_length(btrim(e ->> 'name')) between 1 and 60
      )
    )
    and (select count(distinct e ->> 'id') from jsonb_array_elements(extras) e) = jsonb_array_length(extras);
$$;

revoke all on function public.meal_plan_extras_valid(jsonb) from public, anon;
grant execute on function public.meal_plan_extras_valid(jsonb) to authenticated;

alter table public.meal_plans
  add column extras jsonb not null default '[]'::jsonb,
  add constraint meal_plan_extras_valid check (public.meal_plan_extras_valid(extras));

comment on column public.meal_plans.extras is 'Items the user added to their shopping list themselves. Owner-only via the table''s RLS.';
