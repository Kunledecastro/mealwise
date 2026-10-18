-- Defence in depth on top of RLS: signed-out visitors get no table access at all,
-- and signed-in users cannot insert rows directly (profiles are created by the sign-up trigger).
-- Deleting is blocked by RLS (no delete policy); accounts are removed by the delete-account edge function.
revoke all on public.profiles from anon;
revoke insert, truncate, references, trigger on public.profiles from authenticated;
