#!/usr/bin/env python3
"""
Quarterly price update for the product owner (DECISION_LOG 034).

  1. export:  python3 scripts/catalogue/price_sheet.py export
     Writes docs/PRICE_SHEET.csv: one row per ingredient that matters for cost, with a buying
     unit and its edible weight in grams. Existing prices are kept so you only change what moved.
  2. Fill in low_naira, high_naira, observed_on (YYYY-MM-DD) and source ("nbs" or "owner").
     Leave a row blank if you don't have a price; meals using it will say "Price not yet estimated".
  3. import:  python3 scripts/catalogue/price_sheet.py import
     Validates the sheet and rewrites catalogue/prices.ts. Then commit and push; Vercel redeploys.
"""
import csv
import json
import os
import re
import sys
from datetime import date

ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", ".."))
SHEET = os.path.join(ROOT, "docs", "PRICE_SHEET.csv")
PRICES_TS = os.path.join(ROOT, "catalogue", "prices.ts")

# Buying unit and edible grams per unit. Weights for "pieces" are typical Lagos market sizes.
UNITS = {
    "rice-white": ("1 kg", 1000), "rice-ofada": ("1 kg", 1000), "spaghetti": ("1 pack (500 g)", 500),
    "bread-white": ("1 loaf (sliced, about 500 g)", 500), "oats": ("1 tin/pack (500 g)", 500),
    "pap": ("1 wrap ogi paste (makes about 600 g cooked pap)", 600), "kenkey": ("1 ball (about 250 g)", 250),
    "gari": ("1 kg", 1000), "yam-flour": ("1 kg", 1000), "yam": ("1 medium tuber (about 2 kg edible)", 2000),
    "plantain-ripe": ("1 finger (about 200 g edible)", 200), "plantain-unripe": ("1 finger (about 250 g edible)", 250),
    "plantain-fried": ("1 finger, before frying (about 160 g fried)", 160), "sweet-potato": ("1 kg", 900),
    "potato": ("1 kg", 900), "maize-fresh": ("1 cob (about 150 g kernels)", 150),
    "beans-brown": ("1 kg", 1000), "beans-peeled": ("1 kg (black-eyed beans)", 1000), "bambara": ("1 kg okpa flour", 1000),
    "iru": ("1 wrap (about 50 g)", 50), "peas": ("1 tin (about 250 g drained)", 250),
    "egg": ("1 crate (30 eggs, about 1.5 kg edible)", 1500), "chicken": ("1 kg (bone-in, about 750 g edible)", 750),
    "chicken-breast": ("1 kg", 1000), "beef": ("1 kg", 1000), "beef-minced": ("1 kg", 1000), "goat": ("1 kg", 1000),
    "mackerel": ("1 kg titus (about 650 g edible)", 650), "catfish": ("1 kg (about 600 g edible)", 600),
    "tilapia": ("1 kg (about 500 g edible)", 500), "fish-dried": ("1 small piece (about 50 g)", 50),
    "crayfish": ("1 small cup ground (about 100 g)", 100),
    "tomato": ("1 kg", 1000), "tomato-paste": ("1 sachet (70 g)", 70), "onion": ("1 kg", 900),
    "tatashe": ("1 kg", 900), "green-pepper": ("1 kg", 900), "scotch-bonnet": ("1 small paint-bucket rodo (about 250 g)", 250),
    "garlic": ("1 bulb (about 40 g)", 40), "ginger": ("1 kg", 900), "amaranth": ("1 bunch efo (about 300 g)", 300),
    "ewedu": ("1 bunch (about 200 g leaves)", 200), "okra": ("1 kg", 900), "garden-egg": ("1 kg", 950),
    "cabbage": ("1 head (about 1 kg)", 900), "carrot": ("1 kg", 900), "green-beans": ("1 kg", 950),
    "lettuce": ("1 head (about 300 g)", 270), "cucumber": ("1 kg", 950),
    "avocado": ("1 large pear (about 200 g flesh)", 200), "banana": ("1 bunch, 10 fingers (about 1 kg flesh)", 1000),
    "pawpaw": ("1 medium (about 1 kg flesh)", 1000), "pineapple": ("1 medium (about 900 g flesh)", 900),
    "watermelon": ("1 medium (about 3 kg flesh)", 3000), "lemon-juice": ("1 lemon (about 40 g juice)", 40),
    "groundnuts": ("1 kg", 1000), "coconut": ("1 coconut (about 300 g flesh)", 300), "egusi": ("1 kg ground egusi", 1000),
    "ogbono": ("1 kg ground ogbono", 1000), "palm-oil": ("1 litre (about 900 g)", 900),
    "vegetable-oil": ("1 litre (about 920 g)", 920), "evaporated-milk": ("1 tin (160 g)", 160),
    "yoghurt": ("1 tub (500 g)", 500), "soy-sauce": ("1 bottle (about 150 g)", 150),
}

FIELDS = ["ingredient_id", "ingredient", "unit", "grams_per_unit", "low_naira", "high_naira", "observed_on", "source", "note"]


def ingredient_names():
    text = open(os.path.join(ROOT, "catalogue", "ingredients.generated.ts"), encoding="utf-8").read()
    return {m.group(1): m.group(2) for m in re.finditer(r'"id": "([^"]+)", "name": "([^"]+)"', text)}


def current_prices():
    text = open(PRICES_TS, encoding="utf-8").read()
    m = re.search(r"/\* PRICES_JSON (.*?) \*/", text, re.S)
    return json.loads(m.group(1)) if m else {}


def export():
    names = ingredient_names()
    prices = current_prices()
    with open(SHEET, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=FIELDS)
        w.writeheader()
        for iid, (unit, grams) in UNITS.items():
            p = prices.get(iid, {})
            w.writerow({
                "ingredient_id": iid, "ingredient": names.get(iid, iid),
                "unit": p.get("unit", unit), "grams_per_unit": p.get("gramsPerUnit", grams),
                "low_naira": p.get("low", ""), "high_naira": p.get("high", ""),
                "observed_on": p.get("observedOn", ""), "source": p.get("sourceId", ""), "note": p.get("note", ""),
            })
    print(f"Wrote {SHEET} ({len(UNITS)} ingredients). Seasonings under 5 g per serving are not costed.")


def do_import():
    names = ingredient_names()
    out, errors = {}, []
    with open(SHEET, newline="", encoding="utf-8") as f:
        for n, row in enumerate(csv.DictReader(f), start=2):
            iid = row["ingredient_id"].strip()
            if iid not in names:
                errors.append(f"row {n}: unknown ingredient_id {iid!r}")
                continue
            if not row["low_naira"].strip() and not row["high_naira"].strip():
                continue  # no price yet
            try:
                low, high = float(row["low_naira"]), float(row["high_naira"])
                grams = float(row["grams_per_unit"])
                d = date.fromisoformat(row["observed_on"].strip())
            except ValueError as e:
                errors.append(f"row {n} ({iid}): {e}")
                continue
            if not (0 < low <= high):
                errors.append(f"row {n} ({iid}): need 0 < low <= high")
            if high > low * 3:
                errors.append(f"row {n} ({iid}): high is more than 3× low; please check")
            if grams <= 0:
                errors.append(f"row {n} ({iid}): grams_per_unit must be positive")
            if d > date.today():
                errors.append(f"row {n} ({iid}): date is in the future")
            src = row["source"].strip() or "owner"
            if src not in ("nbs", "owner"):
                errors.append(f"row {n} ({iid}): source must be nbs or owner")
            entry = {"unit": row["unit"].strip(), "gramsPerUnit": grams, "low": low, "high": high, "observedOn": d.isoformat(), "sourceId": src}
            if row["note"].strip():
                entry["note"] = row["note"].strip()
            out[iid] = entry
    if errors:
        sys.exit("Price sheet has problems, nothing changed:\n  " + "\n  ".join(errors))
    body = json.dumps(out, indent=2, ensure_ascii=False)
    ts = (
        'import type { IngredientPrice } from "./types";\n\n'
        "/**\n * ₦ price ranges per ingredient (DECISION_LOG 034). GENERATED from docs/PRICE_SHEET.csv by\n"
        " * scripts/catalogue/price_sheet.py — edit the sheet, not this file.\n"
        " * Until an ingredient has a price, meals using it show \"Price not yet estimated\".\n */\n"
        f"/* PRICES_JSON {body} */\n"
        f"export const PRICES: Record<string, IngredientPrice> = {body};\n"
    )
    open(PRICES_TS, "w", encoding="utf-8").write(ts)
    print(f"Imported {len(out)} prices into {PRICES_TS}")


if __name__ == "__main__":
    {"export": export, "import": do_import}.get(sys.argv[1] if len(sys.argv) > 1 else "", lambda: sys.exit(__doc__))()
