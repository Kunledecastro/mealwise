import type { ReadyMadePrice } from "@/lib/types";

/**
 * Typical price to buy one plate ready-made (DECISION_LOG 043). GENERATED from
 * docs/READY_MADE_PRICE_SHEET.csv by scripts/catalogue/price_sheet.py — edit the sheet.
 */
/* READY_JSON {
  "jollof-rice-chicken": {
    "portion": "1 plate with stew or soup and a small piece of meat or fish",
    "low": 1500.0,
    "high": 4500.0,
    "where": "Buka or local eatery, Lagos (lower on the mainland, higher in Lekki/VI)",
    "observedOn": "2026-10-19",
    "note": "Lagos.Cool buka price guide (lagos.cool/restaurants/local-buka), updated 19 Oct 2026. Extra meat or fish costs more; premium 'modern bukas' charge ₦5,000–10,000."
  },
  "rice-beans-plantain": {
    "portion": "1 plate with stew or soup and a small piece of meat or fish",
    "low": 1500.0,
    "high": 4500.0,
    "where": "Buka or local eatery, Lagos (lower on the mainland, higher in Lekki/VI)",
    "observedOn": "2026-10-19",
    "note": "Lagos.Cool buka price guide (lagos.cool/restaurants/local-buka), updated 19 Oct 2026. Extra meat or fish costs more; premium 'modern bukas' charge ₦5,000–10,000."
  },
  "white-rice-fish-stew": {
    "portion": "1 plate with stew or soup and a small piece of meat or fish",
    "low": 1500.0,
    "high": 4500.0,
    "where": "Buka or local eatery, Lagos (lower on the mainland, higher in Lekki/VI)",
    "observedOn": "2026-10-19",
    "note": "Lagos.Cool buka price guide (lagos.cool/restaurants/local-buka), updated 19 Oct 2026. Extra meat or fish costs more; premium 'modern bukas' charge ₦5,000–10,000."
  },
  "fried-rice-chicken": {
    "portion": "1 plate with stew or soup and a small piece of meat or fish",
    "low": 1500.0,
    "high": 4500.0,
    "where": "Buka or local eatery, Lagos (lower on the mainland, higher in Lekki/VI)",
    "observedOn": "2026-10-19",
    "note": "Lagos.Cool buka price guide (lagos.cool/restaurants/local-buka), updated 19 Oct 2026. Extra meat or fish costs more; premium 'modern bukas' charge ₦5,000–10,000."
  },
  "egusi-pounded-yam": {
    "portion": "1 plate with stew or soup and a small piece of meat or fish",
    "low": 1500.0,
    "high": 4500.0,
    "where": "Buka or local eatery, Lagos (lower on the mainland, higher in Lekki/VI)",
    "observedOn": "2026-10-19",
    "note": "Lagos.Cool buka price guide (lagos.cool/restaurants/local-buka), updated 19 Oct 2026. Extra meat or fish costs more; premium 'modern bukas' charge ₦5,000–10,000."
  },
  "efo-riro-eba": {
    "portion": "1 plate with stew or soup and a small piece of meat or fish",
    "low": 1500.0,
    "high": 4500.0,
    "where": "Buka or local eatery, Lagos (lower on the mainland, higher in Lekki/VI)",
    "observedOn": "2026-10-19",
    "note": "Lagos.Cool buka price guide (lagos.cool/restaurants/local-buka), updated 19 Oct 2026. Extra meat or fish costs more; premium 'modern bukas' charge ₦5,000–10,000."
  },
  "okra-soup-eba": {
    "portion": "1 plate with stew or soup and a small piece of meat or fish",
    "low": 1500.0,
    "high": 4500.0,
    "where": "Buka or local eatery, Lagos (lower on the mainland, higher in Lekki/VI)",
    "observedOn": "2026-10-19",
    "note": "Lagos.Cool buka price guide (lagos.cool/restaurants/local-buka), updated 19 Oct 2026. Extra meat or fish costs more; premium 'modern bukas' charge ₦5,000–10,000."
  },
  "amala-ewedu-gbegiri": {
    "portion": "1 plate with stew or soup and a small piece of meat or fish",
    "low": 1500.0,
    "high": 4500.0,
    "where": "Buka or local eatery, Lagos (lower on the mainland, higher in Lekki/VI)",
    "observedOn": "2026-10-19",
    "note": "Lagos.Cool buka price guide (lagos.cool/restaurants/local-buka), updated 19 Oct 2026. Extra meat or fish costs more; premium 'modern bukas' charge ₦5,000–10,000."
  },
  "beans-and-plantain": {
    "portion": "1 plate with stew or soup and a small piece of meat or fish",
    "low": 1500.0,
    "high": 4500.0,
    "where": "Buka or local eatery, Lagos (lower on the mainland, higher in Lekki/VI)",
    "observedOn": "2026-10-19",
    "note": "Lagos.Cool buka price guide (lagos.cool/restaurants/local-buka), updated 19 Oct 2026. Extra meat or fish costs more; premium 'modern bukas' charge ₦5,000–10,000."
  },
  "yam-porridge": {
    "portion": "1 plate with stew or soup and a small piece of meat or fish",
    "low": 1500.0,
    "high": 4500.0,
    "where": "Buka or local eatery, Lagos (lower on the mainland, higher in Lekki/VI)",
    "observedOn": "2026-10-19",
    "note": "Lagos.Cool buka price guide (lagos.cool/restaurants/local-buka), updated 19 Oct 2026. Extra meat or fish costs more; premium 'modern bukas' charge ₦5,000–10,000."
  },
  "ofada-rice-stew": {
    "portion": "1 plate with stew or soup and a small piece of meat or fish",
    "low": 1500.0,
    "high": 4500.0,
    "where": "Buka or local eatery, Lagos (lower on the mainland, higher in Lekki/VI)",
    "observedOn": "2026-10-19",
    "note": "Lagos.Cool buka price guide (lagos.cool/restaurants/local-buka), updated 19 Oct 2026. Extra meat or fish costs more; premium 'modern bukas' charge ₦5,000–10,000."
  },
  "ogbono-soup-eba": {
    "portion": "1 plate with stew or soup and a small piece of meat or fish",
    "low": 1500.0,
    "high": 4500.0,
    "where": "Buka or local eatery, Lagos (lower on the mainland, higher in Lekki/VI)",
    "observedOn": "2026-10-19",
    "note": "Lagos.Cool buka price guide (lagos.cool/restaurants/local-buka), updated 19 Oct 2026. Extra meat or fish costs more; premium 'modern bukas' charge ₦5,000–10,000."
  },
  "unripe-plantain-porridge": {
    "portion": "1 plate with stew or soup and a small piece of meat or fish",
    "low": 1500.0,
    "high": 4500.0,
    "where": "Buka or local eatery, Lagos (lower on the mainland, higher in Lekki/VI)",
    "observedOn": "2026-10-19",
    "note": "Lagos.Cool buka price guide (lagos.cool/restaurants/local-buka), updated 19 Oct 2026. Extra meat or fish costs more; premium 'modern bukas' charge ₦5,000–10,000."
  },
  "yam-garden-egg-sauce": {
    "portion": "1 plate with stew or soup and a small piece of meat or fish",
    "low": 1500.0,
    "high": 4500.0,
    "where": "Buka or local eatery, Lagos (lower on the mainland, higher in Lekki/VI)",
    "observedOn": "2026-10-19",
    "note": "Lagos.Cool buka price guide (lagos.cool/restaurants/local-buka), updated 19 Oct 2026. Extra meat or fish costs more; premium 'modern bukas' charge ₦5,000–10,000."
  },
  "coconut-rice": {
    "portion": "1 plate with stew or soup and a small piece of meat or fish",
    "low": 1500.0,
    "high": 4500.0,
    "where": "Buka or local eatery, Lagos (lower on the mainland, higher in Lekki/VI)",
    "observedOn": "2026-10-19",
    "note": "Lagos.Cool buka price guide (lagos.cool/restaurants/local-buka), updated 19 Oct 2026. Extra meat or fish costs more; premium 'modern bukas' charge ₦5,000–10,000."
  },
  "ofe-onugbu-fufu": {
    "portion": "1 plate with stew or soup and a small piece of meat or fish",
    "low": 1500.0,
    "high": 4500.0,
    "where": "Buka or local eatery, Lagos (lower on the mainland, higher in Lekki/VI)",
    "observedOn": "2026-10-19",
    "note": "Lagos.Cool buka price guide (lagos.cool/restaurants/local-buka), updated 19 Oct 2026. Extra meat or fish costs more; premium 'modern bukas' charge ₦5,000–10,000."
  },
  "afang-soup-eba": {
    "portion": "1 plate with stew or soup and a small piece of meat or fish",
    "low": 1500.0,
    "high": 4500.0,
    "where": "Buka or local eatery, Lagos (lower on the mainland, higher in Lekki/VI)",
    "observedOn": "2026-10-19",
    "note": "Lagos.Cool buka price guide (lagos.cool/restaurants/local-buka), updated 19 Oct 2026. Extra meat or fish costs more; premium 'modern bukas' charge ₦5,000–10,000."
  },
  "tuwo-miyan-kuka": {
    "portion": "1 plate with stew or soup and a small piece of meat or fish",
    "low": 1500.0,
    "high": 4500.0,
    "where": "Buka or local eatery, Lagos (lower on the mainland, higher in Lekki/VI)",
    "observedOn": "2026-10-19",
    "note": "Lagos.Cool buka price guide (lagos.cool/restaurants/local-buka), updated 19 Oct 2026. Extra meat or fish costs more; premium 'modern bukas' charge ₦5,000–10,000."
  },
  "edikang-ikong-eba": {
    "portion": "1 plate with stew or soup and a small piece of meat or fish",
    "low": 1500.0,
    "high": 4500.0,
    "where": "Buka or local eatery, Lagos (lower on the mainland, higher in Lekki/VI)",
    "observedOn": "2026-10-19",
    "note": "Lagos.Cool buka price guide (lagos.cool/restaurants/local-buka), updated 19 Oct 2026. Extra meat or fish costs more; premium 'modern bukas' charge ₦5,000–10,000."
  },
  "banga-soup-eba": {
    "portion": "1 plate with stew or soup and a small piece of meat or fish",
    "low": 1500.0,
    "high": 4500.0,
    "where": "Buka or local eatery, Lagos (lower on the mainland, higher in Lekki/VI)",
    "observedOn": "2026-10-19",
    "note": "Lagos.Cool buka price guide (lagos.cool/restaurants/local-buka), updated 19 Oct 2026. Extra meat or fish costs more; premium 'modern bukas' charge ₦5,000–10,000."
  },
  "native-jollof-rice": {
    "portion": "1 plate with stew or soup and a small piece of meat or fish",
    "low": 1500.0,
    "high": 4500.0,
    "where": "Buka or local eatery, Lagos (lower on the mainland, higher in Lekki/VI)",
    "observedOn": "2026-10-19",
    "note": "Lagos.Cool buka price guide (lagos.cool/restaurants/local-buka), updated 19 Oct 2026. Extra meat or fish costs more; premium 'modern bukas' charge ₦5,000–10,000."
  }
} */
export const READY_MADE: Record<string, ReadyMadePrice> = {
  "jollof-rice-chicken": {
    "portion": "1 plate with stew or soup and a small piece of meat or fish",
    "low": 1500.0,
    "high": 4500.0,
    "where": "Buka or local eatery, Lagos (lower on the mainland, higher in Lekki/VI)",
    "observedOn": "2026-10-19",
    "note": "Lagos.Cool buka price guide (lagos.cool/restaurants/local-buka), updated 19 Oct 2026. Extra meat or fish costs more; premium 'modern bukas' charge ₦5,000–10,000."
  },
  "rice-beans-plantain": {
    "portion": "1 plate with stew or soup and a small piece of meat or fish",
    "low": 1500.0,
    "high": 4500.0,
    "where": "Buka or local eatery, Lagos (lower on the mainland, higher in Lekki/VI)",
    "observedOn": "2026-10-19",
    "note": "Lagos.Cool buka price guide (lagos.cool/restaurants/local-buka), updated 19 Oct 2026. Extra meat or fish costs more; premium 'modern bukas' charge ₦5,000–10,000."
  },
  "white-rice-fish-stew": {
    "portion": "1 plate with stew or soup and a small piece of meat or fish",
    "low": 1500.0,
    "high": 4500.0,
    "where": "Buka or local eatery, Lagos (lower on the mainland, higher in Lekki/VI)",
    "observedOn": "2026-10-19",
    "note": "Lagos.Cool buka price guide (lagos.cool/restaurants/local-buka), updated 19 Oct 2026. Extra meat or fish costs more; premium 'modern bukas' charge ₦5,000–10,000."
  },
  "fried-rice-chicken": {
    "portion": "1 plate with stew or soup and a small piece of meat or fish",
    "low": 1500.0,
    "high": 4500.0,
    "where": "Buka or local eatery, Lagos (lower on the mainland, higher in Lekki/VI)",
    "observedOn": "2026-10-19",
    "note": "Lagos.Cool buka price guide (lagos.cool/restaurants/local-buka), updated 19 Oct 2026. Extra meat or fish costs more; premium 'modern bukas' charge ₦5,000–10,000."
  },
  "egusi-pounded-yam": {
    "portion": "1 plate with stew or soup and a small piece of meat or fish",
    "low": 1500.0,
    "high": 4500.0,
    "where": "Buka or local eatery, Lagos (lower on the mainland, higher in Lekki/VI)",
    "observedOn": "2026-10-19",
    "note": "Lagos.Cool buka price guide (lagos.cool/restaurants/local-buka), updated 19 Oct 2026. Extra meat or fish costs more; premium 'modern bukas' charge ₦5,000–10,000."
  },
  "efo-riro-eba": {
    "portion": "1 plate with stew or soup and a small piece of meat or fish",
    "low": 1500.0,
    "high": 4500.0,
    "where": "Buka or local eatery, Lagos (lower on the mainland, higher in Lekki/VI)",
    "observedOn": "2026-10-19",
    "note": "Lagos.Cool buka price guide (lagos.cool/restaurants/local-buka), updated 19 Oct 2026. Extra meat or fish costs more; premium 'modern bukas' charge ₦5,000–10,000."
  },
  "okra-soup-eba": {
    "portion": "1 plate with stew or soup and a small piece of meat or fish",
    "low": 1500.0,
    "high": 4500.0,
    "where": "Buka or local eatery, Lagos (lower on the mainland, higher in Lekki/VI)",
    "observedOn": "2026-10-19",
    "note": "Lagos.Cool buka price guide (lagos.cool/restaurants/local-buka), updated 19 Oct 2026. Extra meat or fish costs more; premium 'modern bukas' charge ₦5,000–10,000."
  },
  "amala-ewedu-gbegiri": {
    "portion": "1 plate with stew or soup and a small piece of meat or fish",
    "low": 1500.0,
    "high": 4500.0,
    "where": "Buka or local eatery, Lagos (lower on the mainland, higher in Lekki/VI)",
    "observedOn": "2026-10-19",
    "note": "Lagos.Cool buka price guide (lagos.cool/restaurants/local-buka), updated 19 Oct 2026. Extra meat or fish costs more; premium 'modern bukas' charge ₦5,000–10,000."
  },
  "beans-and-plantain": {
    "portion": "1 plate with stew or soup and a small piece of meat or fish",
    "low": 1500.0,
    "high": 4500.0,
    "where": "Buka or local eatery, Lagos (lower on the mainland, higher in Lekki/VI)",
    "observedOn": "2026-10-19",
    "note": "Lagos.Cool buka price guide (lagos.cool/restaurants/local-buka), updated 19 Oct 2026. Extra meat or fish costs more; premium 'modern bukas' charge ₦5,000–10,000."
  },
  "yam-porridge": {
    "portion": "1 plate with stew or soup and a small piece of meat or fish",
    "low": 1500.0,
    "high": 4500.0,
    "where": "Buka or local eatery, Lagos (lower on the mainland, higher in Lekki/VI)",
    "observedOn": "2026-10-19",
    "note": "Lagos.Cool buka price guide (lagos.cool/restaurants/local-buka), updated 19 Oct 2026. Extra meat or fish costs more; premium 'modern bukas' charge ₦5,000–10,000."
  },
  "ofada-rice-stew": {
    "portion": "1 plate with stew or soup and a small piece of meat or fish",
    "low": 1500.0,
    "high": 4500.0,
    "where": "Buka or local eatery, Lagos (lower on the mainland, higher in Lekki/VI)",
    "observedOn": "2026-10-19",
    "note": "Lagos.Cool buka price guide (lagos.cool/restaurants/local-buka), updated 19 Oct 2026. Extra meat or fish costs more; premium 'modern bukas' charge ₦5,000–10,000."
  },
  "ogbono-soup-eba": {
    "portion": "1 plate with stew or soup and a small piece of meat or fish",
    "low": 1500.0,
    "high": 4500.0,
    "where": "Buka or local eatery, Lagos (lower on the mainland, higher in Lekki/VI)",
    "observedOn": "2026-10-19",
    "note": "Lagos.Cool buka price guide (lagos.cool/restaurants/local-buka), updated 19 Oct 2026. Extra meat or fish costs more; premium 'modern bukas' charge ₦5,000–10,000."
  },
  "unripe-plantain-porridge": {
    "portion": "1 plate with stew or soup and a small piece of meat or fish",
    "low": 1500.0,
    "high": 4500.0,
    "where": "Buka or local eatery, Lagos (lower on the mainland, higher in Lekki/VI)",
    "observedOn": "2026-10-19",
    "note": "Lagos.Cool buka price guide (lagos.cool/restaurants/local-buka), updated 19 Oct 2026. Extra meat or fish costs more; premium 'modern bukas' charge ₦5,000–10,000."
  },
  "yam-garden-egg-sauce": {
    "portion": "1 plate with stew or soup and a small piece of meat or fish",
    "low": 1500.0,
    "high": 4500.0,
    "where": "Buka or local eatery, Lagos (lower on the mainland, higher in Lekki/VI)",
    "observedOn": "2026-10-19",
    "note": "Lagos.Cool buka price guide (lagos.cool/restaurants/local-buka), updated 19 Oct 2026. Extra meat or fish costs more; premium 'modern bukas' charge ₦5,000–10,000."
  },
  "coconut-rice": {
    "portion": "1 plate with stew or soup and a small piece of meat or fish",
    "low": 1500.0,
    "high": 4500.0,
    "where": "Buka or local eatery, Lagos (lower on the mainland, higher in Lekki/VI)",
    "observedOn": "2026-10-19",
    "note": "Lagos.Cool buka price guide (lagos.cool/restaurants/local-buka), updated 19 Oct 2026. Extra meat or fish costs more; premium 'modern bukas' charge ₦5,000–10,000."
  },
  "ofe-onugbu-fufu": {
    "portion": "1 plate with stew or soup and a small piece of meat or fish",
    "low": 1500.0,
    "high": 4500.0,
    "where": "Buka or local eatery, Lagos (lower on the mainland, higher in Lekki/VI)",
    "observedOn": "2026-10-19",
    "note": "Lagos.Cool buka price guide (lagos.cool/restaurants/local-buka), updated 19 Oct 2026. Extra meat or fish costs more; premium 'modern bukas' charge ₦5,000–10,000."
  },
  "afang-soup-eba": {
    "portion": "1 plate with stew or soup and a small piece of meat or fish",
    "low": 1500.0,
    "high": 4500.0,
    "where": "Buka or local eatery, Lagos (lower on the mainland, higher in Lekki/VI)",
    "observedOn": "2026-10-19",
    "note": "Lagos.Cool buka price guide (lagos.cool/restaurants/local-buka), updated 19 Oct 2026. Extra meat or fish costs more; premium 'modern bukas' charge ₦5,000–10,000."
  },
  "tuwo-miyan-kuka": {
    "portion": "1 plate with stew or soup and a small piece of meat or fish",
    "low": 1500.0,
    "high": 4500.0,
    "where": "Buka or local eatery, Lagos (lower on the mainland, higher in Lekki/VI)",
    "observedOn": "2026-10-19",
    "note": "Lagos.Cool buka price guide (lagos.cool/restaurants/local-buka), updated 19 Oct 2026. Extra meat or fish costs more; premium 'modern bukas' charge ₦5,000–10,000."
  },
  "edikang-ikong-eba": {
    "portion": "1 plate with stew or soup and a small piece of meat or fish",
    "low": 1500.0,
    "high": 4500.0,
    "where": "Buka or local eatery, Lagos (lower on the mainland, higher in Lekki/VI)",
    "observedOn": "2026-10-19",
    "note": "Lagos.Cool buka price guide (lagos.cool/restaurants/local-buka), updated 19 Oct 2026. Extra meat or fish costs more; premium 'modern bukas' charge ₦5,000–10,000."
  },
  "banga-soup-eba": {
    "portion": "1 plate with stew or soup and a small piece of meat or fish",
    "low": 1500.0,
    "high": 4500.0,
    "where": "Buka or local eatery, Lagos (lower on the mainland, higher in Lekki/VI)",
    "observedOn": "2026-10-19",
    "note": "Lagos.Cool buka price guide (lagos.cool/restaurants/local-buka), updated 19 Oct 2026. Extra meat or fish costs more; premium 'modern bukas' charge ₦5,000–10,000."
  },
  "native-jollof-rice": {
    "portion": "1 plate with stew or soup and a small piece of meat or fish",
    "low": 1500.0,
    "high": 4500.0,
    "where": "Buka or local eatery, Lagos (lower on the mainland, higher in Lekki/VI)",
    "observedOn": "2026-10-19",
    "note": "Lagos.Cool buka price guide (lagos.cool/restaurants/local-buka), updated 19 Oct 2026. Extra meat or fish costs more; premium 'modern bukas' charge ₦5,000–10,000."
  }
};
