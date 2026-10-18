-- Mealwise Phase 3: per-user meal choices ("Saved", "Not for me"). Owner-only access.
-- One row per user and meal. Saving/un-saving and hiding/showing again set or clear a timestamp,
-- so users never need to remove rows (account deletion removes them via cascade).
-- Meals live in the app's catalogue files, so meal_slug is validated by format, not a foreign key.

create table public.meal_preferences (
  user_id uuid not null references public.profiles (id) on delete cascade,
  meal_slug text not null check (meal_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(meal_slug) <= 80),
  saved_at timestamptz,
  rejected_at timestamptz,
  reject_reason text check (reject_reason in ('dislike', 'too_expensive', 'too_long', 'allergy', 'other')),
  updated_at timestamptz not null default now(),
  primary key (user_id, meal_slug),
  -- A reason only makes sense while the meal is hidden.
  check (rejected_at is not null or reject_reason is null)
);

comment on table public.meal_preferences is 'Saved and "Not for me" meals per user. Personal data: owner-only via RLS.';

alter table public.meal_preferences enable row level security;

create policy "Users can read their own meal choices"
  on public.meal_preferences for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can add their own meal choices"
  on public.meal_preferences for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can change their own meal choices"
  on public.meal_preferences for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke all on public.meal_preferences from anon;
revoke truncate, references, trigger on public.meal_preferences from authenticated;

create or replace function public.meal_preferences_touch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.meal_preferences_touch() from public, anon, authenticated;

create trigger meal_preferences_touch
  before insert or update on public.meal_preferences
  for each row execute function public.meal_preferences_touch();
