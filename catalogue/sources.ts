import type { NutritionSource, PriceSource } from "./types";

export const NUTRITION_SOURCES: NutritionSource[] = [
  {
    id: "wafct",
    shortName: "FAO/INFOODS West Africa 2019",
    citation:
      "Vincent, A., Grande, F., Compaoré, E., et al. 2020. FAO/INFOODS Food Composition Table for Western Africa (2019) User Guide & Condensed Food Composition Table. Rome, FAO.",
    url: "https://www.fao.org/infoods/infoods/tables-and-databases/faoinfoods-databases/en/",
    licence:
      "© FAO 2020. May be used in non-commercial products or services with acknowledgement of FAO as source and copyright holder. Commercial use requires a licence from FAO (www.fao.org/contact-us/licence-request).",
    licenceStatus: "non-commercial",
  },
  {
    id: "usda",
    shortName: "USDA FoodData Central (SR Legacy)",
    citation: "U.S. Department of Agriculture, Agricultural Research Service. FoodData Central, SR Legacy, 2018.",
    url: "https://fdc.nal.usda.gov/",
    licence: "Public domain (CC0 1.0).",
    licenceStatus: "open",
  },
];

export const PRICE_SOURCES: PriceSource[] = [
  {
    id: "nbs",
    name: "National Bureau of Statistics, Selected Food Prices Watch",
    url: "https://nigerianstat.gov.ng/elibrary",
    note: "National average retail prices across all states. Lagos prices are often higher.",
  },
  {
    id: "owner",
    name: "Mealwise price check (product owner)",
    url: "",
    note: "Market or supermarket prices recorded by the Mealwise team; see catalogue/prices.ts for dates.",
  },
];
