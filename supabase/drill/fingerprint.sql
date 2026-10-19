-- One line per table: row count and an md5 of all rows in a fixed order. Equal before and after = identical data.
-- Sign-in users are compared by id, email and created_at only (the rest of auth.users is Supabase's own).
select 'auth.users' t, count(*) n, md5(coalesce(string_agg(concat_ws(',', id, email, created_at), '|' order by id), '')) h from auth.users
union all select 'profiles', count(*), md5(coalesce(string_agg(p::text, '|' order by id), '')) from public.profiles p
union all select 'meal_preferences', count(*), md5(coalesce(string_agg(x::text, '|' order by user_id, meal_slug), '')) from public.meal_preferences x
union all select 'weight_entries', count(*), md5(coalesce(string_agg(x::text, '|' order by id), '')) from public.weight_entries x
union all select 'meal_logs', count(*), md5(coalesce(string_agg(x::text, '|' order by id), '')) from public.meal_logs x
union all select 'meal_plans', count(*), md5(coalesce(string_agg(x::text, '|' order by user_id), '')) from public.meal_plans x
order by 1;
