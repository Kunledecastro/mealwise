# Mealwise — Database Model (Phase 0 draft)

Status: DRAFT — logical model; SQL migrations will be written in Phase 2 (user tables) and Phase 3 (catalogue).
Engine: PostgreSQL (Supabase). All ids are UUID unless stated. All timestamps `timestamptz`.

## 1. Entity overview

```
auth.users (Supabase) 1──1 profiles
profiles 1──* user_exclusions ──* ingredients / allergens
profiles 1──* user_food_preferences (like/dislike) ──* ingredients | cuisines
profiles 1──* weight_entries
profiles 1──* meal_logs ──1 meals
profiles 1──* saved_meals ──1 meals
profiles 1──* meal_feedback ("not for me") ──1 meals
profiles 1──* meal_plans 1──* meal_plan_items ──1 meals          (Phase 5)
meal_plans 1──1 shopping_lists 1──* shopping_list_items          (Phase 5)

meals *──* ingredients  via meal_ingredients (grams per serving)
ingredients *──* allergens via ingredient_allergens
ingredients 1──* ingredient_prices (dated ranges)
meals *──* dietary_tags via meal_dietary_tags
nutrition_sources 1──* ingredients
```

## 2. Catalogue tables (read-only to app users)

**nutrition_sources** — id, name (e.g., "FAO/INFOODS WAFCT 2019", "USDA FDC"), version, url, licence, notes.

**ingredients** — id, name, local_names (text[]; e.g., "ugu", "fluted pumpkin leaves"), category, kcal_per_100g, protein_g, carbs_g, fat_g, fibre_g (nullable = unknown), source_id → nutrition_sources, source_ref (food code), state ('raw'|'cooked'|'as_purchased'), allergen_status ('known'|'unknown'), created_at.

**allergens** — id, code ('peanut','tree_nut','shellfish','fish','egg','milk','soy','wheat_gluten','sesame', …), name.

**ingredient_allergens** — ingredient_id, allergen_id (PK both).

**ingredient_prices** — id, ingredient_id, currency ('NGN'), unit ('kg'|'piece'|'derica'…, with grams_per_unit), price_low, price_high, region (nullable, e.g., 'Lagos'), observed_on (date), source.

**cuisines** — id, name ('Nigerian – Yoruba', 'Nigerian – Igbo', 'International', …).

**meals** — id, slug, name, description, meal_types (text[] of 'breakfast'|'lunch'|'dinner'|'snack'), cuisine_id, serving_description ("1 plate ≈ 350 g"), serving_grams, prep_minutes, cook_minutes, instructions (jsonb array of steps), image_path, image_credit, image_licence, assumptions (text — e.g., "2 tbsp oil per serving"), is_published, created_at, updated_at.

**meal_ingredients** — meal_id, ingredient_id, grams_per_serving, optional (bool), display_quantity ("1 cup"), PK(meal_id, ingredient_id).

**dietary_tags** — id, code ('vegetarian','vegan','pescatarian','no_pork','high_protein',…).
**meal_dietary_tags** — meal_id, tag_id.

**meal_nutrition (view)** — computed per meal from meal_ingredients × ingredients: kcal, protein, carbs, fat, completeness flag (false if any ingredient has null values); also allergen roll-up and allergen_completeness.

**meal_cost_estimate (view)** — per serving low/high from latest ingredient_prices, oldest observed_on (for staleness labelling).

## 3. User tables (RLS: owner-only)

**profiles** — id (= auth.users.id), display_name, birth_year (int), sex ('female'|'male'|'unspecified', nullable), height_cm (numeric), preferred_units ('metric'|'imperial'), goal ('lose'|'gain'|'maintain'), target_weight_kg (nullable), activity_level ('sedentary'|'light'|'moderate'|'very'), budget_band ('low'|'medium'|'high', nullable) + optional max_meal_cost_ngn, max_prep_minutes (nullable), meal_schedule (jsonb, nullable), cooking_facilities (text[], nullable), safety_flags (jsonb — e.g., {professional_guidance: true} which disables automatic targets; no condition details stored), onboarding_completed_at, consent_version, consent_at, created_at, updated_at.

**user_exclusions** — id, user_id, allergen_id (nullable), ingredient_id (nullable), kind ('allergy'|'intolerance'|'avoid'), CHECK one of allergen/ingredient set.

**user_food_preferences** — id, user_id, ingredient_id | cuisine_id, sentiment ('like'|'dislike').

**user_dietary_tags** — user_id, tag_id (e.g., vegetarian).

**weight_entries** — id, user_id, weight_kg (numeric(5,2), CHECK 20–400), entered_unit ('kg'|'lb'), entered_value, measured_on (date, CHECK not in future), note, created_at. Unique (user_id, measured_on) — decision: one per day, edits replace.

**meal_logs** — id, user_id, meal_id, logged_for (date), meal_type, portion_multiplier (numeric, CHECK 0.25–4), snapshot_kcal/protein/carbs/fat (values at time of logging so later catalogue corrections don't silently rewrite history; recalculation offered), created_at.

**saved_meals** — user_id, meal_id, created_at, PK(user_id, meal_id).

**meal_feedback** — id, user_id, meal_id, reason ('dislike'|'too_expensive'|'too_long'|'allergy'|'other'), created_at.

**meal_plans** (Phase 5) — id, user_id, start_date, end_date, created_at.
**meal_plan_items** — id, plan_id, date, meal_type, meal_id, servings.
**shopping_lists** — id, plan_id, user_id, generated_at.
**shopping_list_items** — id, list_id, ingredient_id, quantity_g, display_quantity, already_have (bool), checked (bool), est_cost_low/high.

## 4. RLS policy pattern

```sql
alter table weight_entries enable row level security;
create policy "own rows" on weight_entries
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
```
Catalogue tables: `select` allowed for `authenticated` (and `anon` for published meals if a public preview is wanted); no insert/update/delete from clients. Catalogue edits happen via migrations/seed scripts or a later admin role.

## 5. Deletion

All user tables `on delete cascade` from profiles → auth.users. Account deletion = delete auth user server-side (service role, server only).
