-- Mealwise: access-control and validation tests for public.meal_plans (Phase 5).
-- Two synthetic users; everything is rolled back by the final exception. Every check should be true.

do $$
declare
  a uuid := '11111111-1111-4111-8111-111111111111';
  b uuid := '22222222-2222-4222-8222-222222222222';
  res jsonb := '{}'::jsonb;
  n int;
  ok boolean;
  good jsonb := '[{"day":0,"slot":"breakfast","slug":"akara-and-pap","servings":1},{"day":0,"slot":"lunch","slug":"red-red","servings":2.5}]';
begin
  insert into auth.users (id, email, aud, role, raw_user_meta_data, created_at, updated_at)
  values (a, 'tester.a@example.test', 'authenticated', 'authenticated', '{"consent_version":"2026-10-18"}', now(), now()),
         (b, 'tester.b@example.test', 'authenticated', 'authenticated', '{"consent_version":"2026-10-18"}', now(), now());
  insert into public.meal_plans (user_id, start_date, days, items) values (b, current_date, 1, good);

  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;

  insert into public.meal_plans (user_id, start_date, days, items) values (a, current_date, 7, good);
  get diagnostics n = row_count;
  res := res || jsonb_build_object('01_a_creates_own_plan', n = 1);

  select count(*) into n from public.meal_plans;
  res := res || jsonb_build_object('02_a_sees_only_own_plan', n = 1);

  update public.meal_plans set shopping = '{"rice-white":"have","tomato":"bought"}' where user_id = a;
  get diagnostics n = row_count;
  res := res || jsonb_build_object('03_a_ticks_shopping', n = 1);

  update public.meal_plans set items = '[]', shopping = '{}' where user_id = b;
  get diagnostics n = row_count;
  res := res || jsonb_build_object('04_a_cannot_change_b_plan', n = 0);

  begin
    insert into public.meal_plans (user_id, start_date, days) values (b, current_date, 1);
    ok := false;
  exception when insufficient_privilege or unique_violation then ok := true;
  end;
  res := res || jsonb_build_object('05_a_cannot_create_plan_for_b', ok);

  begin
    update public.meal_plans set user_id = b where user_id = a;
    ok := false;
  exception when insufficient_privilege or unique_violation then ok := true;
  end;
  res := res || jsonb_build_object('06_a_cannot_hand_plan_to_b', ok);

  -- Validation of the plan's meals
  begin
    update public.meal_plans set items = '[{"day":0,"slot":"lunch","slug":"red-red","servings":1},{"day":0,"slot":"lunch","slug":"okpa","servings":1}]' where user_id = a;
    ok := false;
  exception when check_violation then ok := true;
  end;
  res := res || jsonb_build_object('07_two_meals_in_one_slot_rejected', ok);

  begin
    update public.meal_plans set days = 1, items = '[{"day":3,"slot":"lunch","slug":"red-red","servings":1}]' where user_id = a;
    ok := false;
  exception when check_violation then ok := true;
  end;
  res := res || jsonb_build_object('08_day_outside_plan_rejected', ok);

  begin
    update public.meal_plans set items = '[{"day":0,"slot":"lunch","slug":"red-red","servings":1.3}]' where user_id = a;
    ok := false;
  exception when check_violation then ok := true;
  end;
  res := res || jsonb_build_object('09_odd_servings_rejected', ok);

  begin
    update public.meal_plans set items = '[{"day":0,"slot":"supper","slug":"red-red","servings":1}]' where user_id = a;
    ok := false;
  exception when check_violation then ok := true;
  end;
  res := res || jsonb_build_object('10_unknown_slot_rejected', ok);

  begin
    update public.meal_plans set items = '[{"day":0,"slot":"lunch","slug":"Bad Slug!","servings":1}]' where user_id = a;
    ok := false;
  exception when check_violation then ok := true;
  end;
  res := res || jsonb_build_object('11_bad_slug_rejected', ok);

  begin
    update public.meal_plans set items = '[{"day":0,"slot":"lunch","slug":"red-red","servings":1,"note":"x"}]' where user_id = a;
    ok := false;
  exception when check_violation then ok := true;
  end;
  res := res || jsonb_build_object('12_extra_fields_rejected', ok);

  begin
    update public.meal_plans set shopping = '{"rice-white":"maybe"}' where user_id = a;
    ok := false;
  exception when check_violation then ok := true;
  end;
  res := res || jsonb_build_object('13_unknown_tick_rejected', ok);

  begin
    update public.meal_plans set days = 9 where user_id = a;
    ok := false;
  exception when check_violation then ok := true;
  end;
  res := res || jsonb_build_object('14_more_than_7_days_rejected', ok);

  update public.meal_plans set items = '[]', shopping = '{}' where user_id = a;
  get diagnostics n = row_count;
  res := res || jsonb_build_object('15_a_clears_own_plan', n = 1);

  reset role;
  perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
  set local role anon;
  begin
    select count(*) into n from public.meal_plans;
    ok := false;
  exception when insufficient_privilege then ok := true;
  end;
  res := res || jsonb_build_object('16_anon_cannot_read', ok);

  reset role;
  select items = good into ok from public.meal_plans where user_id = b;
  res := res || jsonb_build_object('17_b_plan_unchanged', ok);

  select relrowsecurity into ok from pg_class where oid = 'public.meal_plans'::regclass;
  res := res || jsonb_build_object('18_rls_enabled', ok);

  select count(*) = 3 into ok from pg_policies where schemaname = 'public' and tablename = 'meal_plans';
  res := res || jsonb_build_object('19_only_read_create_change_policies', ok);

  select count(*) = 1 into ok from pg_constraint
  where conrelid = 'public.meal_plans'::regclass and contype = 'f' and confdeltype = 'c';
  res := res || jsonb_build_object('20_plan_cascades_with_account', ok);

  raise exception 'RLS_TEST_RESULTS %', res;
end $$;
