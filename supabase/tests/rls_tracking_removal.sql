-- Mealwise: removal checks for public.weight_entries and public.meal_logs (Phase 4).
-- Run by the project owner in the Supabase SQL editor (Claude's database tool won't run statements
-- that remove rows). Two synthetic users; the final exception rolls EVERYTHING back, so nothing
-- is left behind. Expected: an error message "RLS_TEST_RESULTS {...}" in which every value is true.

do $$
declare
  a uuid := '11111111-1111-4111-8111-111111111111';
  b uuid := '22222222-2222-4222-8222-222222222222';
  res jsonb := '{}'::jsonb;
  n int;
begin
  insert into auth.users (id, email, aud, role, raw_user_meta_data, created_at, updated_at)
  values (a, 'tester.a@example.test', 'authenticated', 'authenticated', '{"consent_version":"2026-10-18"}', now(), now()),
         (b, 'tester.b@example.test', 'authenticated', 'authenticated', '{"consent_version":"2026-10-18"}', now(), now());
  insert into public.weight_entries (user_id, measured_on, weight_kg) values (a, current_date, 80), (b, current_date, 70);
  insert into public.meal_logs (user_id, meal_slug, logged_for, meal_type, portion, kcal, protein_g, carbs_g, fat_g)
  values (a, 'jollof-rice-chicken', current_date, 'lunch', 1, 600, 25, 80, 20),
         (b, 'red-red', current_date, 'lunch', 1, 500, 20, 60, 15);

  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;

  delete from public.weight_entries where user_id = b;
  get diagnostics n = row_count;
  res := res || jsonb_build_object('R1_a_cannot_remove_b_weight', n = 0);

  delete from public.meal_logs where user_id = b;
  get diagnostics n = row_count;
  res := res || jsonb_build_object('R2_a_cannot_remove_b_log', n = 0);

  delete from public.weight_entries where user_id = a;
  get diagnostics n = row_count;
  res := res || jsonb_build_object('R3_a_removes_own_weight', n = 1);

  delete from public.meal_logs where user_id = a;
  get diagnostics n = row_count;
  res := res || jsonb_build_object('R4_a_removes_own_log', n = 1);

  reset role;
  select count(*) into n from public.weight_entries where user_id = b;
  res := res || jsonb_build_object('R5_b_weight_still_there', n = 1);
  select count(*) into n from public.meal_logs where user_id = b;
  res := res || jsonb_build_object('R6_b_log_still_there', n = 1);

  raise exception 'RLS_TEST_RESULTS %', res;
end $$;
