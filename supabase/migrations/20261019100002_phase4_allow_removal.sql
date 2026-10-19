-- Mealwise Phase 4: let users remove their own weight entries and meal-log entries.
-- Owner-only, like every other rule. Nothing else can be removed by users.

create policy "Users can remove their own weights" on public.weight_entries for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can remove their own meal log entries" on public.meal_logs for delete to authenticated
  using ((select auth.uid()) = user_id);
