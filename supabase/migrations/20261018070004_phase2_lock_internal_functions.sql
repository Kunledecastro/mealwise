-- Trigger functions are internal; nobody calls them directly.
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.profiles_before_write() from public, anon, authenticated;
