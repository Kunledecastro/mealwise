-- Backup/restore drill only: minimal stand-ins for the parts of Supabase the migrations rely on,
-- so the schema can be rebuilt in a plain PostgreSQL database. Never run this on Supabase.
do $$ begin create role anon nologin; exception when duplicate_object then null; end $$;
do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;
grant usage on schema public to anon, authenticated;
alter default privileges in schema public grant select, insert, update, delete on tables to anon, authenticated;

create schema auth;
grant usage on schema auth to anon, authenticated;

create table auth.users (
  id uuid primary key,
  email text,
  aud text,
  role text,
  raw_user_meta_data jsonb,
  created_at timestamptz,
  updated_at timestamptz
);

-- Same contract as Supabase: the user id from the request's JWT claims, or null.
create function auth.uid() returns uuid
language sql stable
as $$ select nullif(current_setting('request.jwt.claims', true)::json ->> 'sub', '')::uuid $$;
grant execute on function auth.uid() to anon, authenticated;
