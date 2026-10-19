-- Mealwise Phase 6 security review: least privilege.
-- These tables have no rule letting users remove rows, so RLS already blocks it; the table-level
-- permission is removed too, so it is blocked twice. Removing data happens only via account deletion.
revoke delete on public.profiles, public.meal_preferences, public.meal_plans from authenticated;

-- The plan validation functions are only needed by signed-in users (they run inside the table checks).
revoke all on function public.meal_plan_items_valid(jsonb, smallint) from public, anon;
revoke all on function public.meal_plan_shopping_valid(jsonb) from public, anon;
grant execute on function public.meal_plan_items_valid(jsonb, smallint) to authenticated;
grant execute on function public.meal_plan_shopping_valid(jsonb) to authenticated;
