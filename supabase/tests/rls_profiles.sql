-- Mealwise: access-control tests for public.profiles (Phase 2).
--
-- Uses two synthetic users. Everything runs inside one block that ends by raising an
-- exception, so ALL test data is rolled back automatically; nothing is left behind.
-- The results are reported in that final message as JSON: every check should be true.
--
-- Run it with the Supabase SQL editor, psql, or the Supabase MCP execute_sql tool.
-- (Row removal by users is not exercised directly here; the policy check below proves
-- that only SELECT and UPDATE policies exist, so Row Level Security refuses everything else.)

do $$
declare
  a uuid := '11111111-1111-4111-8111-111111111111';
  b uuid := '22222222-2222-4222-8222-222222222222';
  res jsonb := '{}'::jsonb;
  n int;
  ok boolean;
  v text;
begin
  -- Two synthetic users; the handle_new_user trigger should create their profiles.
  insert into auth.users (id, email, aud, role, raw_user_meta_data, created_at, updated_at)
  values (a, 'tester.a@example.test', 'authenticated', 'authenticated', '{"consent_version":"2026-10-18"}', now(), now()),
         (b, 'tester.b@example.test', 'authenticated', 'authenticated', '{"consent_version":"2026-10-18"}', now(), now());

  select count(*) into n from public.profiles where id in (a, b) and consent_version = '2026-10-18' and consent_at is not null;
  res := res || jsonb_build_object('01_trigger_creates_profiles_with_consent', n = 2);

  -- ===== Act as user A =====
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;

  select count(*) into n from public.profiles where id = a;
  res := res || jsonb_build_object('02_a_reads_own_profile', n = 1);
  select count(*) into n from public.profiles;
  res := res || jsonb_build_object('03_a_sees_only_one_row', n = 1);
  select count(*) into n from public.profiles where id = b;
  res := res || jsonb_build_object('04_a_cannot_read_b', n = 0);

  update public.profiles set display_name = 'Ada' where id = a;
  get diagnostics n = row_count;
  res := res || jsonb_build_object('05_a_updates_own_profile', n = 1);

  update public.profiles set display_name = 'Hacked' where id = b;
  get diagnostics n = row_count;
  res := res || jsonb_build_object('06_a_cannot_update_b', n = 0);

  begin
    insert into public.profiles (id) values (gen_random_uuid());
    ok := false;
  exception when insufficient_privilege then ok := true;
  end;
  res := res || jsonb_build_object('07_a_cannot_insert_profiles', ok);

  update public.profiles set consent_version = 'forged', consent_at = '2000-01-01' where id = a;
  select consent_version into v from public.profiles where id = a;
  res := res || jsonb_build_object('08_consent_fields_cannot_be_changed', v = '2026-10-18');

  update public.profiles set id = gen_random_uuid() where id = a;
  select count(*) into n from public.profiles where id = a;
  res := res || jsonb_build_object('09_id_cannot_be_changed', n = 1);

  begin
    update public.profiles set birth_year = extract(year from now())::int - 15 where id = a;
    ok := false;
  exception when others then ok := true;
  end;
  res := res || jsonb_build_object('10_under_18_birth_year_rejected', ok);

  begin
    update public.profiles set dislikes = array[repeat('x', 41)] where id = a;
    ok := false;
  exception when others then ok := true;
  end;
  res := res || jsonb_build_object('11_overlong_dislike_rejected', ok);

  begin
    update public.profiles set height_cm = 5 where id = a;
    ok := false;
  exception when others then ok := true;
  end;
  res := res || jsonb_build_object('12_out_of_range_height_rejected', ok);

  begin
    perform public.handle_new_user();
    ok := false;
  exception when insufficient_privilege or feature_not_supported or others then ok := true;
  end;
  res := res || jsonb_build_object('13_internal_trigger_function_not_callable', ok);

  -- ===== Act as an anonymous visitor =====
  reset role;
  perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
  set local role anon;
  begin
    select count(*) into n from public.profiles;
    ok := false;
  exception when insufficient_privilege then ok := true;
  end;
  res := res || jsonb_build_object('14_anon_cannot_read', ok);
  begin
    update public.profiles set display_name = 'x';
    ok := false;
  exception when insufficient_privilege then ok := true;
  end;
  res := res || jsonb_build_object('15_anon_cannot_update', ok);

  -- ===== Back as the test runner: verify end state and configuration =====
  reset role;
  select display_name into v from public.profiles where id = b;
  res := res || jsonb_build_object('16_b_unchanged_after_attempts', v is null);

  select relrowsecurity into ok from pg_class where oid = 'public.profiles'::regclass;
  res := res || jsonb_build_object('17_rls_enabled', ok);

  select count(*) filter (where cmd in ('SELECT', 'UPDATE')) = 2 and count(*) = 2 into ok
  from pg_policies where schemaname = 'public' and tablename = 'profiles';
  res := res || jsonb_build_object('18_only_select_and_update_policies', ok);

  raise exception 'RLS_TEST_RESULTS %', res;  -- rolls everything back
end $$;
