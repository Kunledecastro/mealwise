-- Mealwise Phase 2: user profiles (one row per auth user), owner-only access.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 60),
  birth_year smallint check (birth_year between 1900 and 2100),
  height_cm numeric(5,1) check (height_cm between 100 and 250),
  -- Weight given during setup. Full weight history arrives in Phase 4 (weight_entries).
  current_weight_kg numeric(5,2) check (current_weight_kg between 20 and 400),
  target_weight_kg numeric(5,2) check (target_weight_kg between 20 and 400),
  units text not null default 'metric' check (units in ('metric', 'imperial')),
  goal text check (goal in ('lose', 'gain', 'maintain')),
  activity_level text check (activity_level in ('sedentary', 'light', 'moderate', 'very')),
  diet text[] not null default '{}'
    check (diet <@ array['Vegetarian','Vegan','Pescatarian','No pork','Halal']),
  allergies text[] not null default '{}'
    check (allergies <@ array['Peanuts','Tree nuts','Shellfish','Fish','Eggs','Milk','Soy','Wheat','Sesame']),
  dislikes text[] not null default '{}' check (cardinality(dislikes) <= 30),
  cuisines text[] not null default '{}'
    check (cuisines <@ array['Nigerian','Ghanaian','International','Asian','Mediterranean']),
  budget_band text check (budget_band in ('low', 'medium', 'high')),
  max_prep_minutes smallint check (max_prep_minutes in (0, 15, 30, 45, 60)),
  consent_version text,
  consent_at timestamptz,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'One row per user. Personal data: owner-only via RLS.';

-- Row Level Security: a user can read and update only their own profile.
-- No insert from clients (the handle_new_user trigger creates the row) and no removal from clients
-- (account deletion runs server-side in the delete-account edge function; the row cascades).
alter table public.profiles enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

