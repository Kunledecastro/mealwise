-- Mealwise: access-control tests for public.weight_entries and public.meal_logs (Phase 4).
-- Two synthetic users; everything is rolled back by the final exception. Every check should be true.

do $$
declare
  a uuid := '11111111-1111-4111-8111-111111111111';
  b uuid := '22222222-2222-4222-8222-222222222222';
  res jsonb := '{}'::jsonb;
  n int;
  ok boolean;
begin
  insert into auth.users (id, email, aud, role, raw_user_meta_data, created_at, updated_at)
  values (a, 'tester.a@example.test', 'authenticated', 'authenticated', '{"consent_version":"2026-10-18"}', now(), now()),
         (b, 'tester.b@example.test', 'authenticated', 'authenticated', '{"consent_version":"2026-10-18"}', now(), now());
  insert into public.weight_entries (user_id, measured_on, weight_kg) values (b, current_date, 70);
  insert into public.meal_logs (user_id, meal_slug, logged_for, meal_type, portion, kcal, protein_g, carbs_g, fat_g)
  values (b, 'red-red', current_date, 'lunch', 1, 500, 20, 60, 15);

  -- ===== As user A =====
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;

  -- Weights
  insert into public.weight_entries (user_id, measured_on, weight_kg, entered_unit) values (a, current_date - 7, 80.5, 'kg');
  insert into public.weight_entries (user_id, measured_on, weight_kg, entered_unit) values (a, current_date, 80.1, 'lb');
  get diagnostics n = row_count;
  res := res || jsonb_build_object('01_a_adds_own_weight', n = 1);

  insert into public.weight_entries (user_id, measured_on, weight_kg) values (a, current_date, 79.9)
  on conflict (user_id, measured_on) do update set weight_kg = excluded.weight_kg;
  select count(*) into n from public.weight_entries where user_id = a and measured_on = current_date and weight_kg = 79.9;
  res := res || jsonb_build_object('02_one_weight_per_day_replaced', n = 1);

  select count(*) into n from public.weight_entries;
  res := res || jsonb_build_object('03_a_sees_only_own_weights', n = 2);

  update public.weight_entries set weight_kg = 50 where user_id = b;
  get diagnostics n = row_count;
  res := res || jsonb_build_object('04_a_cannot_change_b_weight', n = 0);

  begin
    insert into public.weight_entries (user_id, measured_on, weight_kg) values (b, current_date - 1, 60);
    ok := false;
  exception when insufficient_privilege then ok := true;
  end;
  res := res || jsonb_build_object('06_a_cannot_add_weight_for_b', ok);

  begin
    insert into public.weight_entries (user_id, measured_on, weight_kg) values (a, current_date - 2, 900);
    ok := false;
  exception when check_violation then ok := true;
  end;
  res := res || jsonb_build_object('07_impossible_weight_rejected', ok);

  begin
    insert into public.weight_entries (user_id, measured_on, weight_kg) values (a, current_date + 5, 80);
    ok := false;
  exception when check_violation then ok := true;
  end;
  res := res || jsonb_build_object('08_future_date_rejected', ok);

  -- Meal log
  insert into public.meal_logs (user_id, meal_slug, logged_for, meal_type, portion, kcal, protein_g, carbs_g, fat_g)
  values (a, 'jollof-rice-chicken', current_date, 'lunch', 1.5, 900, 40, 120, 30);
  get diagnostics n = row_count;
  res := res || jsonb_build_object('10_a_logs_own_meal', n = 1);

  select count(*) into n from public.meal_logs;
  res := res || jsonb_build_object('11_a_sees_only_own_log', n = 1);

  update public.meal_logs set kcal = 1 where user_id = b;
  get diagnostics n = row_count;
  res := res || jsonb_build_object('12_a_cannot_change_b_log', n = 0);

  begin
    insert into public.meal_logs (user_id, meal_slug, logged_for, meal_type, portion, kcal, protein_g, carbs_g, fat_g)
    values (b, 'okpa', current_date, 'snack', 1, 300, 10, 30, 10);
    ok := false;
  exception when insufficient_privilege then ok := true;
  end;
  res := res || jsonb_build_object('14_a_cannot_log_for_b', ok);

  begin
    update public.meal_logs set user_id = b where user_id = a;
    ok := false;
  exception when insufficient_privilege then ok := true;
  end;
  res := res || jsonb_build_object('15_a_cannot_hand_log_to_b', ok);

  begin
    insert into public.meal_logs (user_id, meal_slug, logged_for, meal_type, portion, kcal, protein_g, carbs_g, fat_g)
    values (a, 'okpa', current_date, 'snack', 9, 300, 10, 30, 10);
    ok := false;
  exception when check_violation then ok := true;
  end;
  res := res || jsonb_build_object('16_bad_portion_rejected', ok);

  begin
    insert into public.meal_logs (user_id, meal_slug, logged_for, meal_type, portion, kcal, protein_g, carbs_g, fat_g)
    values (a, 'okpa', current_date, 'supper', 1, 300, 10, 30, 10);
    ok := false;
  exception when check_violation then ok := true;
  end;
  res := res || jsonb_build_object('17_unknown_meal_type_rejected', ok);

  -- Profile additions
  update public.profiles set sex = 'female', needs_guidance = true where id = a;
  get diagnostics n = row_count;
  res := res || jsonb_build_object('19_a_sets_sex_and_guidance', n = 1);

  begin
    update public.profiles set sex = 'other-value' where id = a;
    ok := false;
  exception when check_violation then ok := true;
  end;
  res := res || jsonb_build_object('20_unknown_sex_value_rejected', ok);

  -- ===== Anonymous =====
  reset role;
  perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
  set local role anon;
  begin
    select count(*) into n from public.weight_entries;
    ok := false;
  exception when insufficient_privilege then ok := true;
  end;
  res := res || jsonb_build_object('21_anon_cannot_read_weights', ok);
  begin
    select count(*) into n from public.meal_logs;
    ok := false;
  exception when insufficient_privilege then ok := true;
  end;
  res := res || jsonb_build_object('22_anon_cannot_read_log', ok);

  -- ===== Checks as test runner =====
  reset role;
  select count(*) = 1 into ok from public.weight_entries where user_id = b and weight_kg = 70;
  res := res || jsonb_build_object('23_b_weight_unchanged', ok);
  select count(*) = 1 into ok from public.meal_logs where user_id = b and kcal = 500;
  res := res || jsonb_build_object('24_b_log_unchanged', ok);

  select bool_and(relrowsecurity) into ok from pg_class
  where oid in ('public.weight_entries'::regclass, 'public.meal_logs'::regclass);
  res := res || jsonb_build_object('25_rls_enabled', ok);

  select count(*) = 8 into ok from pg_policies
  where schemaname = 'public' and tablename in ('weight_entries', 'meal_logs');
  res := res || jsonb_build_object('26_eight_owner_policies_in_total', ok);

  select count(*) = 2 into ok from pg_constraint
  where conrelid in ('public.weight_entries'::regclass, 'public.meal_logs'::regclass) and contype = 'f' and confdeltype = 'c';
  res := res || jsonb_build_object('27_rows_cascade_with_account', ok);

  raise exception 'RLS_TEST_RESULTS %', res;
end $$;
