-- Backup/restore drill: synthetic data only (three invented users).
insert into auth.users (id, email, aud, role, raw_user_meta_data, created_at, updated_at) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'drill.one@example.test', 'authenticated', 'authenticated', '{"consent_version":"2026-10-18"}', now(), now()),
  ('aaaaaaaa-0000-4000-8000-000000000002', 'drill.two@example.test', 'authenticated', 'authenticated', '{"consent_version":"2026-10-18"}', now(), now()),
  ('aaaaaaaa-0000-4000-8000-000000000003', 'drill.three@example.test', 'authenticated', 'authenticated', '{"consent_version":"2026-10-18"}', now(), now());

update public.profiles set display_name = 'Drill ' || right(id::text, 1), birth_year = 1990, height_cm = 170, current_weight_kg = 80,
  goal = 'lose', activity_level = 'light', units = 'metric', sex = 'female', allergies = array['Peanuts'], onboarding_completed_at = now();

insert into public.meal_preferences (user_id, meal_slug, saved_at)
select id, slug, now() from public.profiles, unnest(array['jollof-rice-chicken', 'red-red', 'okpa']) slug;

insert into public.weight_entries (user_id, measured_on, weight_kg, entered_unit)
select id, current_date - d * 7, 80 - d * 0.4, 'kg' from public.profiles, generate_series(0, 5) d;

insert into public.meal_logs (user_id, meal_slug, logged_for, meal_type, portion, kcal, protein_g, carbs_g, fat_g)
select id, 'akara-and-pap', current_date - d, 'breakfast', 1, 520, 21, 70, 17 from public.profiles, generate_series(0, 9) d;

insert into public.meal_plans (user_id, start_date, days, include_snacks, items, shopping)
select id, current_date, 2, false,
  '[{"day":0,"slot":"breakfast","slug":"akara-and-pap","servings":1},{"day":0,"slot":"lunch","slug":"red-red","servings":2},{"day":1,"slot":"dinner","slug":"okpa","servings":1}]',
  '{"rice-white":"have"}'
from public.profiles;
