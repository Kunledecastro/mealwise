-- Mealwise: access-control tests for public.meal_preferences (Phase 3).
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
  insert into public.meal_preferences (user_id, meal_slug, saved_at) values (b, 'red-red', now());

  -- ===== As user A =====
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;

  insert into public.meal_preferences (user_id, meal_slug, saved_at) values (a, 'jollof-rice-chicken', now());
  get diagnostics n = row_count;
  res := res || jsonb_build_object('01_a_saves_own_meal', n = 1);

  insert into public.meal_preferences (user_id, meal_slug, saved_at) values (a, 'jollof-rice-chicken', null)
  on conflict (user_id, meal_slug) do update set saved_at = excluded.saved_at;
  select count(*) into n from public.meal_preferences where user_id = a and saved_at is null;
  res := res || jsonb_build_object('02_a_unsaves_via_upsert', n = 1);

  update public.meal_preferences set rejected_at = now(), reject_reason = 'too_long' where user_id = a and meal_slug = 'jollof-rice-chicken';
  get diagnostics n = row_count;
  res := res || jsonb_build_object('03_a_marks_not_for_me', n = 1);

  select count(*) into n from public.meal_preferences;
  res := res || jsonb_build_object('04_a_sees_only_own_rows', n = 1);

  update public.meal_preferences set saved_at = null where user_id = b;
  get diagnostics n = row_count;
  res := res || jsonb_build_object('05_a_cannot_change_b', n = 0);

  begin
    insert into public.meal_preferences (user_id, meal_slug, saved_at) values (b, 'okpa', now());
    ok := false;
  exception when insufficient_privilege then ok := true;
  end;
  res := res || jsonb_build_object('06_a_cannot_write_rows_for_b', ok);

  begin
    update public.meal_preferences set user_id = b where user_id = a;
    ok := false;
  exception when insufficient_privilege then ok := true;
  end;
  res := res || jsonb_build_object('07_a_cannot_hand_rows_to_b', ok);

  begin
    insert into public.meal_preferences (user_id, meal_slug) values (a, 'Bad Slug!');
    ok := false;
  exception when check_violation then ok := true;
  end;
  res := res || jsonb_build_object('08_bad_slug_rejected', ok);

  begin
    insert into public.meal_preferences (user_id, meal_slug, reject_reason) values (a, 'okpa', 'too_long');
    ok := false;
  exception when check_violation then ok := true;
  end;
  res := res || jsonb_build_object('09_reason_needs_rejected_at', ok);

  begin
    insert into public.meal_preferences (user_id, meal_slug, rejected_at, reject_reason) values (a, 'okpa', now(), 'hate_it');
    ok := false;
  exception when check_violation then ok := true;
  end;
  res := res || jsonb_build_object('10_unknown_reason_rejected', ok);

  -- ===== Anonymous =====
  reset role;
  perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
  set local role anon;
  begin
    select count(*) into n from public.meal_preferences;
    ok := false;
  exception when insufficient_privilege then ok := true;
  end;
  res := res || jsonb_build_object('11_anon_cannot_read', ok);

  -- ===== Checks as test runner =====
  reset role;
  select saved_at is not null into ok from public.meal_preferences where user_id = b and meal_slug = 'red-red';
  res := res || jsonb_build_object('12_b_row_unchanged', ok);

  select relrowsecurity into ok from pg_class where oid = 'public.meal_preferences'::regclass;
  res := res || jsonb_build_object('13_rls_enabled', ok);

  select count(*) = 3 and count(*) filter (where cmd in ('SELECT', 'INSERT', 'UPDATE')) = 3 into ok
  from pg_policies where schemaname = 'public' and tablename = 'meal_preferences';
  res := res || jsonb_build_object('14_only_read_add_change_policies', ok);

  -- Rows go when the account goes: the foreign key to profiles cascades (confdeltype 'c').
  select count(*) = 1 into ok from pg_constraint
  where conrelid = 'public.meal_preferences'::regclass and contype = 'f' and confdeltype = 'c';
  res := res || jsonb_build_object('15_rows_cascade_with_account', ok);

  raise exception 'RLS_TEST_RESULTS %', res;
end $$;
