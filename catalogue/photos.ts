import type { MealPhoto } from "@/lib/types";

/**
 * Verified photos (Pexels / Unsplash licences: free to use, no permission needed; credited in-app).
 * Each was matched to the dish from the source description and checked by the product owner in Phase 1.
 * Dishes without an entry show the plate illustration, captioned "Illustration".
 */
export const PHOTOS: Record<string, MealPhoto> = {
  "jollof-rice-chicken": {
    src: "https://images.pexels.com/photos/40262791/pexels-photo-40262791.jpeg?auto=compress&cs=tinysrgb&w=1600",
    alt: "Grilled chicken with jollof rice and sautéed vegetables on a white plate",
    credit: "Mohammad Fahim", source: "Pexels",
    page: "https://www.pexels.com/photo/grilled-chicken-with-jollof-rice-and-vegetables-40262791/",
  },
  "akara-and-pap": {
    src: "https://images.pexels.com/photos/37624176/pexels-photo-37624176.jpeg?auto=compress&cs=tinysrgb&w=1600",
    alt: "Akara, pap, bread and egg in a takeaway box",
    credit: "Tochukwu Ekeh", source: "Pexels",
    page: "https://www.pexels.com/photo/delicious-nigerian-breakfast-with-akara-and-pap-37624176/",
  },
  "yam-and-egg-sauce": {
    src: "https://images.pexels.com/photos/32634871/pexels-photo-32634871.jpeg?auto=compress&cs=tinysrgb&w=1600",
    alt: "Nigerian breakfast of yam with egg sauce",
    credit: "mk_photoz", source: "Pexels",
    page: "https://www.pexels.com/photo/nigerian-breakfast-with-yam-and-egg-dish-32634871/",
  },
  "egusi-pounded-yam": {
    src: "https://images.pexels.com/photos/35490114/pexels-photo-35490114.jpeg?auto=compress&cs=tinysrgb&w=1600",
    alt: "Egusi soup with red peppers and herbs in a red bowl",
    credit: "Tim Yisa", source: "Pexels",
    page: "https://www.pexels.com/photo/spicy-nigerian-egusi-soup-in-red-bowl-35490114/",
  },
  "efo-riro-eba": {
    src: "https://images.pexels.com/photos/37648017/pexels-photo-37648017.jpeg?auto=compress&cs=tinysrgb&w=1600",
    alt: "Spinach stew with meat in a red pepper sauce, served in a white bowl",
    credit: "Tochukwu Ekeh", source: "Pexels",
    page: "https://www.pexels.com/photo/authentic-african-stew-with-spinach-and-meat-37648017/",
  },
  "roasted-corn-coconut": {
    src: "https://images.pexels.com/photos/11572454/pexels-photo-11572454.jpeg?auto=compress&cs=tinysrgb&w=1600",
    alt: "Charred corn being roasted by a street vendor in Lagos",
    credit: "Kayode Balogun", source: "Pexels",
    page: "https://www.pexels.com/photo/a-person-holding-a-corn-11572454/",
  },
  "rice-beans-plantain": {
    src: "https://images.pexels.com/photos/27556972/pexels-photo-27556972.jpeg?auto=compress&cs=tinysrgb&w=1600",
    alt: "Rice and beans with fried plantain on a white plate",
    credit: "Snappr", source: "Pexels",
    page: "https://www.pexels.com/photo/traditional-caribbean-cuisine-27556972/",
  },
  "plantain-groundnuts": {
    src: "https://images.pexels.com/photos/35136066/pexels-photo-35136066.jpeg?auto=compress&cs=tinysrgb&w=1600",
    alt: "Fried plantain cubes with peanuts in a white bowl",
    credit: "ghanawithophelia", source: "Pexels",
    page: "https://www.pexels.com/photo/fried-plantains-with-peanuts-in-a-bowl-35136066/",
  },
  "fruit-bowl": {
    src: "https://images.unsplash.com/photo-1564093497595-593b96d80180?auto=format&fit=crop&w=1600&q=75",
    alt: "Fresh fruit salad on a white plate",
    credit: "Rebecca Hansen", source: "Unsplash",
    page: "https://unsplash.com/photos/fruit-salad-on-white-plate-_WpB9l8_Kn4",
  },
  "chicken-salad": {
    src: "https://images.unsplash.com/photo-1761315600943-d8a5bb0c499f?auto=format&fit=crop&w=1600&q=75",
    alt: "Grilled chicken salad with avocado and tomatoes",
    credit: "Ani Augustine", source: "Unsplash",
    page: "https://unsplash.com/photos/grilled-chicken-salad-with-avocado-and-tomatoes-9TogNg01qzI",
  },
};
