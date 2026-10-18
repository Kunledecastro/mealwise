-- Validation that needs the current date, and housekeeping.
create or replace function public.profiles_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.birth_year is not null and new.birth_year > extract(year from current_date)::int - 18 then
    raise exception 'Mealwise is for adults aged 18 and over' using errcode = 'check_violation';
  end if;
  if exists (select 1 from unnest(new.dislikes) d where char_length(d) > 40) then
    raise exception 'Each disliked food must be 40 characters or fewer' using errcode = 'check_violation';
  end if;
  new.updated_at := now();
  if tg_op = 'UPDATE' then
    -- These are set by the system, never by the user.
    new.id := old.id;
    new.created_at := old.created_at;
    new.consent_version := old.consent_version;
    new.consent_at := old.consent_at;
  end if;
  return new;
end;
$$;

create trigger profiles_before_write
before insert or update on public.profiles
for each row execute function public.profiles_before_write();

-- Create the profile when an account is created, copying the consent given at sign-up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, consent_version, consent_at)
  values (
    new.id,
    new.raw_user_meta_data ->> 'consent_version',
    case when new.raw_user_meta_data ? 'consent_version' then now() end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

