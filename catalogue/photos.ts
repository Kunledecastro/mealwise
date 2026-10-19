import type { MealPhoto } from "@/lib/types";

/**
 * Verified photos (Pexels / Unsplash licences: free to use, no permission needed; credited in-app).
 * Each was matched to the dish from the source description and checked visually (first ten in Phase 1, the rest on 2026-10-19).
 * Some show a close version of the dish (e.g. without the side); the alt text describes what is actually in the photo.
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
  "bread-and-boiled-eggs": {
    src: "https://images.unsplash.com/photo-1614775888408-a46dfe477eb6?auto=format&fit=crop&w=1600&q=75",
    alt: "Soft-boiled egg in an egg cup with bread",
    credit: "Nik", source: "Unsplash",
    page: "https://unsplash.com/photos/bread-with-egg-on-white-ceramic-plate-pXDPYIBSYS0",
  },
  "oats-banana-groundnuts": {
    src: "https://images.unsplash.com/photo-1548807371-30dc1bbe6cb5?auto=format&fit=crop&w=1600&q=75",
    alt: "Oat porridge topped with nuts and banana",
    credit: "Alexandru Acea", source: "Unsplash",
    page: "https://unsplash.com/photos/oatmeal-in-white-bowl-Vk044I3w1gI",
  },
  "white-rice-fish-stew": {
    src: "https://images.unsplash.com/photo-1664288377740-1bec924cd622?auto=format&fit=crop&w=1600&q=75",
    alt: "Fried fish with white rice and tomato stew",
    credit: "Elena Leya", source: "Unsplash",
    page: "https://unsplash.com/photos/a-plate-of-food-7WBbsJqhTtQ",
  },
  "fried-rice-chicken": {
    src: "https://images.unsplash.com/photo-1638436684761-7e59f8a9072f?auto=format&fit=crop&w=1600&q=75",
    alt: "Fried rice with peas and carrots, chicken and boiled egg",
    credit: "Chibuzo Nwaneri", source: "Unsplash",
    page: "https://unsplash.com/photos/a-table-topped-with-plates-of-food-and-a-bowl-of-rice-icciS_O3Gkk",
  },
  "beans-and-plantain": {
    src: "https://images.unsplash.com/photo-1704125805665-ebdfb1936f27?auto=format&fit=crop&w=1600&q=75",
    alt: "Bowl of Nigerian brown beans with crayfish",
    credit: "David Kristianto", source: "Unsplash",
    page: "https://unsplash.com/photos/a-bowl-filled-with-lots-of-food-on-top-of-a-table-yIPQMmSSmcU",
  },
  "edikang-ikong-eba": {
    src: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?auto=format&fit=crop&w=1600&q=75",
    alt: "Green vegetable soup served with a white swallow",
    credit: "Femoree", source: "Unsplash",
    page: "https://unsplash.com/photos/white-ceramic-bowl-with-green-vegetable-dish-kn_ANxnwCQ0",
  },
  "fish-pepper-soup": {
    src: "https://images.unsplash.com/photo-1730112696140-19e61bb43d36?auto=format&fit=crop&w=1600&q=75",
    alt: "Fish pepper soup in a metal pot",
    credit: "Jon Handley", source: "Unsplash",
    page: "https://unsplash.com/photos/a-metal-bowl-filled-with-meat-and-vegetables-P8MXephSELc",
  },
  "grilled-chicken-potatoes": {
    src: "https://images.unsplash.com/photo-1703219342277-1a78d6b4a27f?auto=format&fit=crop&w=1600&q=75",
    alt: "Grilled chicken breast with roast potatoes",
    credit: "Hybrid Storytellers", source: "Unsplash",
    page: "https://unsplash.com/photos/a-white-plate-topped-with-meat-and-potatoes-Xm7VDGuvwqg",
  },
  "chicken-stir-fry-rice": {
    src: "https://images.unsplash.com/photo-1783196736260-dd788dff4132?auto=format&fit=crop&w=1600&q=75",
    alt: "Stir-fried chicken and vegetables with rice",
    credit: "Alexandra Dobrin", source: "Unsplash",
    page: "https://unsplash.com/photos/delicious-stir-fried-chicken-and-vegetables-with-rice-HU64ydv7xhA",
  },
  "spaghetti-bolognese": {
    src: "https://images.unsplash.com/photo-1622973536968-3ead9e780960?auto=format&fit=crop&w=1600&q=75",
    alt: "Spaghetti with meat sauce",
    credit: "Homescreenify", source: "Unsplash",
    page: "https://unsplash.com/photos/spaghetti-on-white-ceramic-plate-sA3wymYqyaI",
  },
  "fruit-smoothie": {
    src: "https://images.unsplash.com/photo-1707219811295-0f283760668b?auto=format&fit=crop&w=1600&q=75",
    alt: "A fruit smoothie with banana",
    credit: "Elena Leya", source: "Unsplash",
    page: "https://unsplash.com/photos/a-banana-and-a-glass-of-smoothie-on-a-table-dj0Np1jooWk",
  },
  "boiled-eggs": {
    src: "https://images.unsplash.com/photo-1577111064880-4601019411fe?auto=format&fit=crop&w=1600&q=75",
    alt: "Four halves of boiled egg",
    credit: "Faris Mohammed", source: "Unsplash",
    page: "https://unsplash.com/photos/two-sliced-boiled-eggs-pVO700FnVH8",
  },
  "herbed-cucumber-salad": {
    src: "https://images.unsplash.com/photo-1541696432-7a70d69e0309?auto=format&fit=crop&w=1600&q=75",
    alt: "Cucumber salad with herbs in a white bowl",
    credit: "Charles Deluvio", source: "Unsplash",
    page: "https://unsplash.com/photos/sliced-vegetable-salad-in-bowl-bwITUOcNrRM",
  },
  "cabbage-carrot-slaw": {
    src: "https://images.unsplash.com/photo-1537784969314-05a37106f68e?auto=format&fit=crop&w=1600&q=75",
    alt: "Shredded cabbage and carrot slaw in a bowl",
    credit: "Jonathan Farber", source: "Unsplash",
    page: "https://unsplash.com/photos/vegetable-salad-on-white-and-black-ceramic-bowl-J3bbba1mkH8",
  },
  "shakshuka-bread": {
    src: "https://images.unsplash.com/photo-1590412200988-a436970781fa?auto=format&fit=crop&w=1600&q=75",
    alt: "Eggs cooked in tomato and pepper sauce in a pan",
    credit: "Yoav Aziz", source: "Unsplash",
    page: "https://unsplash.com/photos/stainless-steel-fork-on-brown-ceramic-plate-422N7Nwq5XY",
  },
  "chicken-vegetable-soup": {
    src: "https://images.unsplash.com/photo-1665593998976-d957f2827fe7?auto=format&fit=crop&w=1600&q=75",
    alt: "Chicken and vegetable soup with corn and carrot",
    credit: "Keesha's Kitchen", source: "Unsplash",
    page: "https://unsplash.com/photos/a-bowl-of-soup-with-a-spoon-7ax3l4quF-M",
  },
  "egg-fried-rice": {
    src: "https://images.unsplash.com/photo-1609570324378-ec0c4c9b6ba8?auto=format&fit=crop&w=1600&q=75",
    alt: "Egg fried rice on a plate",
    credit: "Jay Nlper", source: "Unsplash",
    page: "https://unsplash.com/photos/white-ceramic-plate-with-rice-and-stainless-steel-fork-XciY4hwqnNk",
  },
  "veg-sticks-yoghurt-dip": {
    src: "https://images.unsplash.com/photo-1539785213997-5dd19c94d632?auto=format&fit=crop&w=1600&q=75",
    alt: "Carrot and cucumber sticks with a bowl of dip",
    credit: "Peter", source: "Unsplash",
    page: "https://unsplash.com/photos/sliced-vegetables-on-round-table-3X4gbEJDl3A",
  },
  "egg-avocado-toast": {
    src: "https://images.unsplash.com/photo-1772717737730-85eff61606c8?auto=format&fit=crop&w=1600&q=75",
    alt: "Avocado toast topped with fried eggs",
    credit: "Natallia Strok", source: "Unsplash",
    page: "https://unsplash.com/photos/avocado-toast-with-two-fried-eggs-and-microgreens-Gem-Yi6p1BU",
  },
  "grilled-tilapia-boli": {
    src: "https://images.unsplash.com/photo-1718942899999-b3da4177ee2a?auto=format&fit=crop&w=1600&q=75",
    alt: "Whole grilled tilapia on a banana leaf",
    credit: "Michael Lock", source: "Unsplash",
    page: "https://unsplash.com/photos/a-grilled-fish-sitting-on-top-of-a-banana-leaf-hVnClpnYUUk",
  },
  "lentils-and-rice": {
    src: "https://images.unsplash.com/photo-1788603092417-a01e665e0ab2?auto=format&fit=crop&w=1600&q=75",
    alt: "Basmati rice with a bowl of lentils",
    credit: "Zoshua Colah", source: "Unsplash",
    page: "https://unsplash.com/photos/basmati-rice-and-dal-dinner-t-OO1RUgvt4",
  },
};
