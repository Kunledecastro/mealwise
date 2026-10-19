import type { IngredientPrice } from "./types";

/**
 * ₦ price ranges per ingredient (DECISION_LOG 034). GENERATED from docs/PRICE_SHEET.csv by
 * scripts/catalogue/price_sheet.py — edit the sheet, not this file.
 * Until an ingredient has a price, meals using it show "Price not yet estimated".
 */
/* PRICES_JSON {
  "rice-white": {
    "unit": "1 kg",
    "gramsPerUnit": 1000.0,
    "low": 2220.0,
    "high": 2580.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦2,246, South West ₦2,225; high end +15% for Lagos/small-quantity retail."
  },
  "rice-ofada": {
    "unit": "1 kg",
    "gramsPerUnit": 1000.0,
    "low": 1910.0,
    "high": 2280.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦1,905, South West ₦1,983; high end +15% for Lagos/small-quantity retail. NBS local short-grain rice used for ofada."
  },
  "bread-white": {
    "unit": "1 sliced loaf (450 g)",
    "gramsPerUnit": 450.0,
    "low": 1690.0,
    "high": 2010.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦1,687, South West ₦1,745; high end +15% for Lagos/small-quantity retail."
  },
  "gari": {
    "unit": "1 kg",
    "gramsPerUnit": 1000.0,
    "low": 810.0,
    "high": 950.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦813, South West ₦823; high end +15% for Lagos/small-quantity retail."
  },
  "yam": {
    "unit": "1 kg",
    "gramsPerUnit": 850.0,
    "low": 2350.0,
    "high": 2840.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦2,347, South West ₦2,472; high end +15% for Lagos/small-quantity retail. NBS yam price taken as per kg (as its other staples); about 15% lost in peeling."
  },
  "plantain-ripe": {
    "unit": "1 kg",
    "gramsPerUnit": 650.0,
    "low": 2210.0,
    "high": 2660.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦2,210, South West ₦2,314; high end +15% for Lagos/small-quantity retail. About 35% of weight is peel."
  },
  "plantain-unripe": {
    "unit": "1 kg",
    "gramsPerUnit": 650.0,
    "low": 2260.0,
    "high": 2680.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦2,257, South West ₦2,328; high end +15% for Lagos/small-quantity retail. About 35% of weight is peel."
  },
  "plantain-fried": {
    "unit": "1 kg raw (makes about 520 g fried)",
    "gramsPerUnit": 520.0,
    "low": 2210.0,
    "high": 2660.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦2,210, South West ₦2,314; high end +15% for Lagos/small-quantity retail. Raw ripe plantain price; frying oil not included."
  },
  "sweet-potato": {
    "unit": "1 kg",
    "gramsPerUnit": 900.0,
    "low": 740.0,
    "high": 990.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦862, South West ₦739; high end +15% for Lagos/small-quantity retail."
  },
  "potato": {
    "unit": "1 kg",
    "gramsPerUnit": 900.0,
    "low": 2100.0,
    "high": 2940.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦2,104, South West ₦2,553; high end +15% for Lagos/small-quantity retail."
  },
  "beans-brown": {
    "unit": "1 kg",
    "gramsPerUnit": 1000.0,
    "low": 1340.0,
    "high": 2060.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦1,345, South West ₦1,791; high end +15% for Lagos/small-quantity retail."
  },
  "beans-peeled": {
    "unit": "1 kg (before peeling)",
    "gramsPerUnit": 900.0,
    "low": 1300.0,
    "high": 1860.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦1,297, South West ₦1,621; high end +15% for Lagos/small-quantity retail. About 10% lost in peeling."
  },
  "egg": {
    "unit": "1 crate (30 eggs)",
    "gramsPerUnit": 1500.0,
    "low": 6040.0,
    "high": 7070.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦6,149, South West ₦6,041; high end +15% for Lagos/small-quantity retail."
  },
  "chicken": {
    "unit": "1 kg (bone-in)",
    "gramsPerUnit": 750.0,
    "low": 5800.0,
    "high": 6910.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦6,013, South West ₦5,796; high end +15% for Lagos/small-quantity retail. About 25% bone."
  },
  "beef": {
    "unit": "1 kg",
    "gramsPerUnit": 1000.0,
    "low": 6550.0,
    "high": 8250.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦7,171, South West ₦6,551; high end +15% for Lagos/small-quantity retail."
  },
  "beef-minced": {
    "unit": "1 kg",
    "gramsPerUnit": 1000.0,
    "low": 6550.0,
    "high": 8250.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦7,171, South West ₦6,551; high end +15% for Lagos/small-quantity retail. Boneless beef price; minced beef is similar."
  },
  "goat": {
    "unit": "1 kg (bone-in)",
    "gramsPerUnit": 750.0,
    "low": 6920.0,
    "high": 8310.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦6,924, South West ₦7,229; high end +15% for Lagos/small-quantity retail. About 25% bone."
  },
  "mackerel": {
    "unit": "1 kg",
    "gramsPerUnit": 650.0,
    "low": 7420.0,
    "high": 8900.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦7,739, South West ₦7,416; high end +15% for Lagos/small-quantity retail. Edible part after head and bones."
  },
  "catfish": {
    "unit": "1 kg",
    "gramsPerUnit": 600.0,
    "low": 5780.0,
    "high": 7040.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦6,119, South West ₦5,778; high end +15% for Lagos/small-quantity retail. Edible part after head and bones."
  },
  "tilapia": {
    "unit": "1 kg",
    "gramsPerUnit": 500.0,
    "low": 5890.0,
    "high": 6980.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦5,895, South West ₦6,074; high end +15% for Lagos/small-quantity retail. Edible part after head and bones."
  },
  "fish-dried": {
    "unit": "1 kg",
    "gramsPerUnit": 1000.0,
    "low": 6900.0,
    "high": 8470.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦7,369, South West ₦6,902; high end +15% for Lagos/small-quantity retail."
  },
  "crayfish": {
    "unit": "1 kg",
    "gramsPerUnit": 1000.0,
    "low": 8970.0,
    "high": 11260.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦8,972, South West ₦9,787; high end +15% for Lagos/small-quantity retail."
  },
  "tomato": {
    "unit": "1 kg",
    "gramsPerUnit": 1000.0,
    "low": 1560.0,
    "high": 2010.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦1,561, South West ₦1,747; high end +15% for Lagos/small-quantity retail."
  },
  "onion": {
    "unit": "1 kg",
    "gramsPerUnit": 900.0,
    "low": 1140.0,
    "high": 1360.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦1,180, South West ₦1,144; high end +15% for Lagos/small-quantity retail."
  },
  "ginger": {
    "unit": "1 kg",
    "gramsPerUnit": 900.0,
    "low": 5910.0,
    "high": 8020.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦5,907, South West ₦6,970; high end +15% for Lagos/small-quantity retail."
  },
  "carrot": {
    "unit": "1 kg",
    "gramsPerUnit": 900.0,
    "low": 2080.0,
    "high": 2730.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦2,080, South West ₦2,377; high end +15% for Lagos/small-quantity retail."
  },
  "watermelon": {
    "unit": "1 medium (about 3 kg flesh)",
    "gramsPerUnit": 3000.0,
    "low": 2090.0,
    "high": 2820.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦2,086, South West ₦2,449; high end +15% for Lagos/small-quantity retail."
  },
  "groundnuts": {
    "unit": "1 x 75 cl bottle (about 450 g)",
    "gramsPerUnit": 450.0,
    "low": 2600.0,
    "high": 3110.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦2,600, South West ₦2,707; high end +15% for Lagos/small-quantity retail. Bottle weight is our estimate."
  },
  "palm-oil": {
    "unit": "1 x 75 cl bottle (about 690 g)",
    "gramsPerUnit": 690.0,
    "low": 2400.0,
    "high": 2960.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦2,397, South West ₦2,572; high end +15% for Lagos/small-quantity retail."
  },
  "vegetable-oil": {
    "unit": "1 x 75 cl bottle (about 690 g)",
    "gramsPerUnit": 690.0,
    "low": 3030.0,
    "high": 3750.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦3,263, South West ₦3,030; high end +15% for Lagos/small-quantity retail."
  },
  "evaporated-milk": {
    "unit": "1 tin (150 g)",
    "gramsPerUnit": 150.0,
    "low": 1060.0,
    "high": 1230.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦1,058, South West ₦1,067; high end +15% for Lagos/small-quantity retail."
  },
  "maize-grits": {
    "unit": "1 kg",
    "gramsPerUnit": 1000.0,
    "low": 800.0,
    "high": 940.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦816, South West ₦805; high end +15% for Lagos/small-quantity retail. Price of whole dry maize grains."
  }
} */
export const PRICES: Record<string, IngredientPrice> = {
  "rice-white": {
    "unit": "1 kg",
    "gramsPerUnit": 1000.0,
    "low": 2220.0,
    "high": 2580.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦2,246, South West ₦2,225; high end +15% for Lagos/small-quantity retail."
  },
  "rice-ofada": {
    "unit": "1 kg",
    "gramsPerUnit": 1000.0,
    "low": 1910.0,
    "high": 2280.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦1,905, South West ₦1,983; high end +15% for Lagos/small-quantity retail. NBS local short-grain rice used for ofada."
  },
  "bread-white": {
    "unit": "1 sliced loaf (450 g)",
    "gramsPerUnit": 450.0,
    "low": 1690.0,
    "high": 2010.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦1,687, South West ₦1,745; high end +15% for Lagos/small-quantity retail."
  },
  "gari": {
    "unit": "1 kg",
    "gramsPerUnit": 1000.0,
    "low": 810.0,
    "high": 950.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦813, South West ₦823; high end +15% for Lagos/small-quantity retail."
  },
  "yam": {
    "unit": "1 kg",
    "gramsPerUnit": 850.0,
    "low": 2350.0,
    "high": 2840.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦2,347, South West ₦2,472; high end +15% for Lagos/small-quantity retail. NBS yam price taken as per kg (as its other staples); about 15% lost in peeling."
  },
  "plantain-ripe": {
    "unit": "1 kg",
    "gramsPerUnit": 650.0,
    "low": 2210.0,
    "high": 2660.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦2,210, South West ₦2,314; high end +15% for Lagos/small-quantity retail. About 35% of weight is peel."
  },
  "plantain-unripe": {
    "unit": "1 kg",
    "gramsPerUnit": 650.0,
    "low": 2260.0,
    "high": 2680.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦2,257, South West ₦2,328; high end +15% for Lagos/small-quantity retail. About 35% of weight is peel."
  },
  "plantain-fried": {
    "unit": "1 kg raw (makes about 520 g fried)",
    "gramsPerUnit": 520.0,
    "low": 2210.0,
    "high": 2660.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦2,210, South West ₦2,314; high end +15% for Lagos/small-quantity retail. Raw ripe plantain price; frying oil not included."
  },
  "sweet-potato": {
    "unit": "1 kg",
    "gramsPerUnit": 900.0,
    "low": 740.0,
    "high": 990.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦862, South West ₦739; high end +15% for Lagos/small-quantity retail."
  },
  "potato": {
    "unit": "1 kg",
    "gramsPerUnit": 900.0,
    "low": 2100.0,
    "high": 2940.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦2,104, South West ₦2,553; high end +15% for Lagos/small-quantity retail."
  },
  "beans-brown": {
    "unit": "1 kg",
    "gramsPerUnit": 1000.0,
    "low": 1340.0,
    "high": 2060.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦1,345, South West ₦1,791; high end +15% for Lagos/small-quantity retail."
  },
  "beans-peeled": {
    "unit": "1 kg (before peeling)",
    "gramsPerUnit": 900.0,
    "low": 1300.0,
    "high": 1860.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦1,297, South West ₦1,621; high end +15% for Lagos/small-quantity retail. About 10% lost in peeling."
  },
  "egg": {
    "unit": "1 crate (30 eggs)",
    "gramsPerUnit": 1500.0,
    "low": 6040.0,
    "high": 7070.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦6,149, South West ₦6,041; high end +15% for Lagos/small-quantity retail."
  },
  "chicken": {
    "unit": "1 kg (bone-in)",
    "gramsPerUnit": 750.0,
    "low": 5800.0,
    "high": 6910.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦6,013, South West ₦5,796; high end +15% for Lagos/small-quantity retail. About 25% bone."
  },
  "beef": {
    "unit": "1 kg",
    "gramsPerUnit": 1000.0,
    "low": 6550.0,
    "high": 8250.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦7,171, South West ₦6,551; high end +15% for Lagos/small-quantity retail."
  },
  "beef-minced": {
    "unit": "1 kg",
    "gramsPerUnit": 1000.0,
    "low": 6550.0,
    "high": 8250.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦7,171, South West ₦6,551; high end +15% for Lagos/small-quantity retail. Boneless beef price; minced beef is similar."
  },
  "goat": {
    "unit": "1 kg (bone-in)",
    "gramsPerUnit": 750.0,
    "low": 6920.0,
    "high": 8310.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦6,924, South West ₦7,229; high end +15% for Lagos/small-quantity retail. About 25% bone."
  },
  "mackerel": {
    "unit": "1 kg",
    "gramsPerUnit": 650.0,
    "low": 7420.0,
    "high": 8900.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦7,739, South West ₦7,416; high end +15% for Lagos/small-quantity retail. Edible part after head and bones."
  },
  "catfish": {
    "unit": "1 kg",
    "gramsPerUnit": 600.0,
    "low": 5780.0,
    "high": 7040.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦6,119, South West ₦5,778; high end +15% for Lagos/small-quantity retail. Edible part after head and bones."
  },
  "tilapia": {
    "unit": "1 kg",
    "gramsPerUnit": 500.0,
    "low": 5890.0,
    "high": 6980.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦5,895, South West ₦6,074; high end +15% for Lagos/small-quantity retail. Edible part after head and bones."
  },
  "fish-dried": {
    "unit": "1 kg",
    "gramsPerUnit": 1000.0,
    "low": 6900.0,
    "high": 8470.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦7,369, South West ₦6,902; high end +15% for Lagos/small-quantity retail."
  },
  "crayfish": {
    "unit": "1 kg",
    "gramsPerUnit": 1000.0,
    "low": 8970.0,
    "high": 11260.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦8,972, South West ₦9,787; high end +15% for Lagos/small-quantity retail."
  },
  "tomato": {
    "unit": "1 kg",
    "gramsPerUnit": 1000.0,
    "low": 1560.0,
    "high": 2010.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦1,561, South West ₦1,747; high end +15% for Lagos/small-quantity retail."
  },
  "onion": {
    "unit": "1 kg",
    "gramsPerUnit": 900.0,
    "low": 1140.0,
    "high": 1360.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦1,180, South West ₦1,144; high end +15% for Lagos/small-quantity retail."
  },
  "ginger": {
    "unit": "1 kg",
    "gramsPerUnit": 900.0,
    "low": 5910.0,
    "high": 8020.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦5,907, South West ₦6,970; high end +15% for Lagos/small-quantity retail."
  },
  "carrot": {
    "unit": "1 kg",
    "gramsPerUnit": 900.0,
    "low": 2080.0,
    "high": 2730.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦2,080, South West ₦2,377; high end +15% for Lagos/small-quantity retail."
  },
  "watermelon": {
    "unit": "1 medium (about 3 kg flesh)",
    "gramsPerUnit": 3000.0,
    "low": 2090.0,
    "high": 2820.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦2,086, South West ₦2,449; high end +15% for Lagos/small-quantity retail."
  },
  "groundnuts": {
    "unit": "1 x 75 cl bottle (about 450 g)",
    "gramsPerUnit": 450.0,
    "low": 2600.0,
    "high": 3110.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦2,600, South West ₦2,707; high end +15% for Lagos/small-quantity retail. Bottle weight is our estimate."
  },
  "palm-oil": {
    "unit": "1 x 75 cl bottle (about 690 g)",
    "gramsPerUnit": 690.0,
    "low": 2400.0,
    "high": 2960.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦2,397, South West ₦2,572; high end +15% for Lagos/small-quantity retail."
  },
  "vegetable-oil": {
    "unit": "1 x 75 cl bottle (about 690 g)",
    "gramsPerUnit": 690.0,
    "low": 3030.0,
    "high": 3750.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦3,263, South West ₦3,030; high end +15% for Lagos/small-quantity retail."
  },
  "evaporated-milk": {
    "unit": "1 tin (150 g)",
    "gramsPerUnit": 150.0,
    "low": 1060.0,
    "high": 1230.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦1,058, South West ₦1,067; high end +15% for Lagos/small-quantity retail."
  },
  "maize-grits": {
    "unit": "1 kg",
    "gramsPerUnit": 1000.0,
    "low": 800.0,
    "high": 940.0,
    "observedOn": "2026-05-31",
    "sourceId": "nbs",
    "note": "NBS Selected Food Prices, May 2026: national ₦816, South West ₦805; high end +15% for Lagos/small-quantity retail. Price of whole dry maize grains."
  }
};
