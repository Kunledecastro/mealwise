"""
Hand-maintained facts about each catalogue ingredient: the name users see, food group (drives
diet labels), allergens, and WHICH source entry supplies the nutrition. The numbers themselves
are pulled from the source by build_ingredients.py.

source: "wafct" = FAO/INFOODS West Africa 2019 (code like "06_013")
        "usda"  = USDA FoodData Central SR Legacy (FDC id)

Allergen policy (conservative; see DECISION_LOG 035):
  - "contains": the ingredient is or includes the allergen.
  - "mayContain": varies by brand or is often cross-contaminated; allergic users never see it.
  - Coconut, dika nut (ogbono): botanically debated as tree nuts, so marked "may contain tree nuts".
  - Refined soya and palm oils are not treated as allergens (refined soybean oil is exempt from
    allergen labelling in the EU and US). Groundnut oil is not used anywhere.
"""

SPEC = [
    # ---- Grains, starches, flours ----
    dict(id="rice-white", name="White rice", aliases=["rice"], group="plant", source="wafct", ref="01_036",
         substitute="Parboiled long-grain rice (most common in Nigeria) is not listed separately; polished white rice is used."),
    dict(id="rice-ofada", name="Ofada rice", aliases=["rice", "ofada"], group="plant", source="wafct", ref="01_034",
         substitute="Ofada rice is not listed; brown (unpolished) rice is the closest match."),
    dict(id="spaghetti", name="Spaghetti", aliases=["pasta"], group="plant", source="usda", ref=168927,
         contains=["wheat"], mayContain=["egg"]),
    dict(id="bread-white", name="White bread", aliases=["bread", "agege bread"], group="plant", source="wafct", ref="01_046",
         contains=["wheat"], mayContain=["milk", "soy"]),
    dict(id="oats", name="Rolled oats", aliases=["oats", "oatmeal"], group="plant", source="wafct", ref="01_101",
         mayContain=["wheat"]),
    dict(id="pap", name="Pap (ogi), cooked", aliases=["ogi", "akamu", "pap"], group="plant", source="wafct", ref="01_100"),
    dict(id="kenkey", name="Kenkey", aliases=["kenkey", "dokon"], group="plant", source="wafct", ref="01_099"),
    dict(id="gari", name="Gari (for eba)", aliases=["gari", "garri", "eba"], group="plant", source="wafct", ref="02_039"),
    dict(id="yam-flour", name="Yam flour (for amala)", aliases=["elubo", "amala"], group="plant", source="wafct", ref="02_036"),
    dict(id="yam", name="Yam", aliases=["yam", "pounded yam", "iyan"], group="plant", source="wafct", ref="02_034"),
    dict(id="plantain-ripe", name="Ripe plantain", aliases=["plantain", "dodo"], group="plant", source="wafct", ref="02_042"),
    dict(id="plantain-unripe", name="Unripe plantain", aliases=["plantain"], group="plant", source="wafct", ref="02_045"),
    dict(id="plantain-fried", name="Fried ripe plantain (dodo)", aliases=["plantain", "dodo"], group="plant", source="wafct", ref="02_084"),
    dict(id="sweet-potato", name="Sweet potato", aliases=["potato"], group="plant", source="wafct", ref="02_011",
         substitute="Values for deep-yellow sweet potato; pale varieties are similar in energy."),
    dict(id="potato", name="Irish potato", aliases=["potato", "potatoes"], group="plant", source="wafct", ref="02_009"),
    dict(id="maize-fresh", name="Fresh maize (corn)", aliases=["corn", "maize"], group="plant", source="wafct", ref="04_076"),

    # ---- Legumes ----
    dict(id="beans-brown", name="Brown beans", aliases=["beans", "honey beans", "oloyin", "cowpea"], group="plant", source="wafct", ref="03_027"),
    dict(id="beans-peeled", name="Peeled black-eyed beans", aliases=["beans", "cowpea"], group="plant", source="wafct", ref="03_045"),
    dict(id="bambara", name="Bambara nut flour", aliases=["okpa", "bambara", "okpa flour"], group="plant", source="wafct", ref="03_001"),
    dict(id="iru", name="Locust beans (iru)", aliases=["iru", "dawadawa", "ogiri"], group="plant", source="wafct", ref="03_042"),
    dict(id="peas", name="Green peas", aliases=["peas"], group="plant", source="usda", ref=170419),

    # ---- Eggs, meat, fish ----
    dict(id="egg", name="Eggs", aliases=["egg"], group="egg", source="wafct", ref="08_001", contains=["egg"]),
    dict(id="chicken", name="Chicken (with skin)", aliases=["chicken"], group="poultry", source="wafct", ref="07_030"),
    dict(id="chicken-breast", name="Chicken breast (skinless)", aliases=["chicken"], group="poultry", source="wafct", ref="07_033"),
    dict(id="beef", name="Beef (lean)", aliases=["beef", "meat"], group="beef_goat", source="wafct", ref="07_009"),
    dict(id="beef-minced", name="Minced beef", aliases=["beef", "meat", "mince"], group="beef_goat", source="wafct", ref="07_023"),
    dict(id="goat", name="Goat meat", aliases=["goat", "goat meat", "meat"], group="beef_goat", source="wafct", ref="07_069"),
    dict(id="mackerel", name="Mackerel (titus)", aliases=["fish", "titus", "mackerel"], group="fish", source="wafct", ref="09_003", contains=["fish"]),
    dict(id="catfish", name="Catfish", aliases=["fish", "catfish", "point and kill"], group="fish", source="wafct", ref="09_018", contains=["fish"]),
    dict(id="tilapia", name="Tilapia", aliases=["fish", "tilapia"], group="fish", source="wafct", ref="09_041", contains=["fish"]),
    dict(id="fish-dried", name="Dried fish", aliases=["fish", "smoked fish", "stockfish"], group="fish", source="wafct", ref="09_053", contains=["fish"]),
    dict(id="crayfish", name="Ground crayfish", aliases=["crayfish"], group="shellfish", source="wafct", ref="09_057", contains=["shellfish"]),

    # ---- Vegetables ----
    dict(id="tomato", name="Tomatoes", aliases=["tomato"], group="plant", source="wafct", ref="04_021"),
    dict(id="tomato-paste", name="Tomato paste", aliases=["tomato"], group="plant", source="wafct", ref="04_066"),
    dict(id="onion", name="Onion", aliases=["onions"], group="plant", source="wafct", ref="04_018"),
    dict(id="tatashe", name="Red bell pepper (tatashe)", aliases=["pepper", "tatashe", "bell pepper"], group="plant", source="wafct", ref="04_047"),
    dict(id="green-pepper", name="Green bell pepper", aliases=["pepper", "bell pepper"], group="plant", source="wafct", ref="04_049"),
    dict(id="scotch-bonnet", name="Scotch bonnet pepper (ata rodo)", aliases=["pepper", "chilli", "ata rodo"], group="plant", source="wafct", ref="04_046"),
    dict(id="garlic", name="Garlic", group="plant", source="wafct", ref="04_015"),
    dict(id="ginger", name="Ginger", group="plant", source="wafct", ref="04_082"),
    dict(id="amaranth", name="Spinach (efo tete)", aliases=["efo", "efo tete", "spinach", "amaranth", "greens"], group="plant", source="wafct", ref="04_023",
         substitute="Amaranth (efo tete) values; also used where recipes take ugu, which the table doesn't list."),
    dict(id="ewedu", name="Jute leaves (ewedu)", aliases=["ewedu", "jute"], group="plant", source="wafct", ref="04_038"),
    dict(id="okra", name="Okra", aliases=["okro", "okra"], group="plant", source="wafct", ref="04_017"),
    dict(id="garden-egg", name="Garden egg", aliases=["garden egg", "eggplant", "aubergine"], group="plant", source="wafct", ref="04_074",
         substitute="Values for native eggplant (Solanum macrocarpon); Nigerian garden egg is a close relative."),
    dict(id="cabbage", name="Cabbage", group="plant", source="wafct", ref="04_005"),
    dict(id="carrot", name="Carrot", aliases=["carrots"], group="plant", source="wafct", ref="04_006"),
    dict(id="green-beans", name="Green beans", aliases=["green beans"], group="plant", source="wafct", ref="04_003"),
    dict(id="lettuce", name="Lettuce", group="plant", source="wafct", ref="04_040"),
    dict(id="cucumber", name="Cucumber", group="plant", source="wafct", ref="04_032"),

    # ---- Fruit ----
    dict(id="avocado", name="Avocado", aliases=["avocado pear"], group="plant", source="wafct", ref="05_002"),
    dict(id="banana", name="Banana", group="plant", source="wafct", ref="05_028"),
    dict(id="pawpaw", name="Pawpaw", aliases=["papaya"], group="plant", source="wafct", ref="05_017"),
    dict(id="pineapple", name="Pineapple", group="plant", source="wafct", ref="05_018"),
    dict(id="watermelon", name="Watermelon", group="plant", source="wafct", ref="05_022"),
    dict(id="lemon-juice", name="Lemon juice", aliases=["lemon"], group="plant", source="wafct", ref="12_010"),

    # ---- Nuts and seeds ----
    dict(id="groundnuts", name="Groundnuts (peanuts)", aliases=["groundnut", "peanut", "peanuts"], group="plant", source="wafct", ref="06_010",
         contains=["peanut"]),
    dict(id="coconut", name="Coconut", group="plant", source="wafct", ref="06_002", mayContain=["tree_nut"]),
    dict(id="egusi", name="Ground melon seeds (egusi)", aliases=["egusi", "melon"], group="plant", source="wafct", ref="06_013"),
    dict(id="ogbono", name="Ground ogbono (dika nut)", aliases=["ogbono", "dika"], group="plant", source="wafct", ref="06_008",
         mayContain=["tree_nut"]),

    # ---- Fats, dairy ----
    dict(id="palm-oil", name="Palm oil", aliases=["red oil"], group="plant", source="wafct", ref="11_004"),
    dict(id="vegetable-oil", name="Vegetable oil (soya)", aliases=["oil"], group="plant", source="wafct", ref="11_009"),
    dict(id="evaporated-milk", name="Evaporated milk", aliases=["milk", "peak milk"], group="dairy", source="wafct", ref="10_016",
         contains=["milk"]),
    dict(id="yoghurt", name="Plain yoghurt", aliases=["yogurt", "yoghurt"], group="dairy", source="wafct", ref="10_005", contains=["milk"]),

    # ---- Seasonings ----
    dict(id="stock-cube", name="Seasoning cube (beef)", aliases=["maggi", "knorr", "stock cube"], group="beef_goat", source="wafct", ref="13_008",
         mayContain=["wheat", "soy", "milk"]),
    dict(id="curry", name="Curry powder", group="plant", source="wafct", ref="13_022", mayContain=["wheat", "milk", "sesame"],
         fibreZeroIfMissing=True),
    dict(id="thyme", name="Dried thyme", group="plant", source="usda", ref=170938),
    dict(id="ehuru", name="Calabash nutmeg (ehuru)", aliases=["ehuru", "pepper soup spice"], group="plant", source="wafct", ref="13_020",
         fibreZeroIfMissing=True),
    dict(id="soy-sauce", name="Soy sauce", group="plant", source="usda", ref=174277, contains=["soy", "wheat"]),
    dict(id="sugar", name="Sugar", group="plant", source="wafct", ref="13_002"),
    dict(id="salt", name="Salt", group="plant", source="wafct", ref="13_015", fibreZeroIfMissing=True),
]
