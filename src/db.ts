import { Database } from 'bun:sqlite'

const db = new Database(process.env.DB_PATH ?? 'grocery.db', { create: true })

db.exec('PRAGMA journal_mode=WAL')
db.exec('PRAGMA foreign_keys=ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS lists (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL DEFAULT 'Grocery List',
    owner_email TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    list_id TEXT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    store_area TEXT NOT NULL,
    area_overridden INTEGER NOT NULL DEFAULT 0,
    checked INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS item_history (
    list_id TEXT NOT NULL,
    name TEXT NOT NULL,
    store_area TEXT NOT NULL,
    last_used DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (list_id, name)
  )
`)

const { user_version } = db.query('PRAGMA user_version').get() as { user_version: number }

if (user_version < 1) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS store_types (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      areas TEXT NOT NULL
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS stores (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      store_type_id TEXT NOT NULL REFERENCES store_types(id)
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS store_type_dictionary (
      store_type_id TEXT NOT NULL,
      item_name TEXT NOT NULL,
      area TEXT NOT NULL,
      PRIMARY KEY (store_type_id, item_name),
      FOREIGN KEY (store_type_id) REFERENCES store_types(id)
    )
  `)

  try {
    db.exec('ALTER TABLE lists ADD COLUMN store_id TEXT REFERENCES stores(id)')
  } catch {
    // Column already exists
  }

  const GROCERY_AREAS = [
    'Produce', 'Dairy', 'Bakery', 'Meat & Seafood', 'Frozen',
    'Pantry', 'Beverages', 'Snacks', 'Household', 'Personal Care', 'Other',
  ]

  const HOME_DEPOT_AREAS = [
    'Lumber & Building', 'Paint & Supplies', 'Plumbing', 'Electrical',
    'Hardware & Fasteners', 'Tools', 'Garden & Outdoor', 'Flooring',
    'Kitchen & Bath', 'Other',
  ]

  const COSTCO_AREAS = [
    'Produce', 'Dairy & Eggs', 'Bakery', 'Meat & Seafood', 'Frozen',
    'Pantry', 'Beverages', 'Snacks', 'Household', 'Personal Care',
    'Electronics', 'Other',
  ]

  const GROCERY_DICT: Record<string, string> = {
    // Produce
    apple: 'Produce', avocado: 'Produce', banana: 'Produce', basil: 'Produce',
    beet: 'Produce', 'bell pepper': 'Produce', blackberry: 'Produce', blueberry: 'Produce',
    'bok choy': 'Produce', broccoli: 'Produce', 'brussels sprout': 'Produce',
    'butternut squash': 'Produce', cabbage: 'Produce', cantaloupe: 'Produce',
    carrot: 'Produce', cauliflower: 'Produce', celery: 'Produce', cherry: 'Produce',
    chive: 'Produce', cilantro: 'Produce', arugula: 'Produce', corn: 'Produce',
    cucumber: 'Produce', date: 'Produce', dill: 'Produce', eggplant: 'Produce',
    fig: 'Produce', garlic: 'Produce', ginger: 'Produce', grape: 'Produce',
    grapefruit: 'Produce', 'green bean': 'Produce', honeydew: 'Produce',
    'jalapeño': 'Produce', jalapeno: 'Produce', kale: 'Produce', kiwi: 'Produce',
    leek: 'Produce', lemon: 'Produce', lettuce: 'Produce', lime: 'Produce',
    mango: 'Produce', mint: 'Produce', mushroom: 'Produce', nectarine: 'Produce',
    onion: 'Produce', orange: 'Produce', papaya: 'Produce', parsley: 'Produce',
    parsnip: 'Produce', peach: 'Produce', pear: 'Produce', pea: 'Produce',
    pineapple: 'Produce', plum: 'Produce', pomegranate: 'Produce', potato: 'Produce',
    radish: 'Produce', raspberry: 'Produce', romaine: 'Produce', rosemary: 'Produce',
    scallion: 'Produce', shallot: 'Produce', spinach: 'Produce', strawberry: 'Produce',
    'sweet potato': 'Produce', thyme: 'Produce', tomato: 'Produce', turnip: 'Produce',
    watermelon: 'Produce', zucchini: 'Produce', 'acorn squash': 'Produce',
    'spaghetti squash': 'Produce', artichoke: 'Produce', asparagus: 'Produce',
    lemongrass: 'Produce', microgreen: 'Produce', sprout: 'Produce', plantain: 'Produce',
    tomatillo: 'Produce', 'collard green': 'Produce', 'swiss chard': 'Produce',
    // Dairy
    'american cheese': 'Dairy', brie: 'Dairy', butter: 'Dairy', cheddar: 'Dairy',
    'coconut milk': 'Dairy', 'colby jack': 'Dairy', 'cottage cheese': 'Dairy',
    cream: 'Dairy', 'cream cheese': 'Dairy', egg: 'Dairy', feta: 'Dairy',
    gouda: 'Dairy', 'greek yogurt': 'Dairy', 'half and half': 'Dairy',
    'heavy cream': 'Dairy', milk: 'Dairy', 'monterey jack': 'Dairy',
    mozzarella: 'Dairy', 'oat milk': 'Dairy', parmesan: 'Dairy', provolone: 'Dairy',
    ricotta: 'Dairy', 'skim milk': 'Dairy', 'sour cream': 'Dairy', 'soy milk': 'Dairy',
    'string cheese': 'Dairy', swiss: 'Dairy', 'whipped cream': 'Dairy',
    'whole milk': 'Dairy', yogurt: 'Dairy', kefir: 'Dairy', 'queso fresco': 'Dairy',
    pepperjack: 'Dairy',
    // Bakery
    bagel: 'Bakery', baguette: 'Bakery', bread: 'Bakery', brioche: 'Bakery',
    brownie: 'Bakery', cake: 'Bakery', challah: 'Bakery', ciabatta: 'Bakery',
    cookie: 'Bakery', croissant: 'Bakery', 'dinner roll': 'Bakery', donut: 'Bakery',
    'english muffin': 'Bakery', focaccia: 'Bakery', 'hamburger bun': 'Bakery',
    'hot dog bun': 'Bakery', muffin: 'Bakery', naan: 'Bakery', pie: 'Bakery',
    pita: 'Bakery', 'pretzel roll': 'Bakery', roll: 'Bakery', 'rye bread': 'Bakery',
    sourdough: 'Bakery', tortilla: 'Bakery', 'white bread': 'Bakery',
    'whole wheat bread': 'Bakery', 'flour tortilla': 'Bakery', 'corn tortilla': 'Bakery',
    // Meat & Seafood
    anchovy: 'Meat & Seafood', bacon: 'Meat & Seafood', beef: 'Meat & Seafood',
    bison: 'Meat & Seafood', chicken: 'Meat & Seafood', 'chicken breast': 'Meat & Seafood',
    'chicken thigh': 'Meat & Seafood', 'chicken wing': 'Meat & Seafood',
    clam: 'Meat & Seafood', cod: 'Meat & Seafood', crab: 'Meat & Seafood',
    duck: 'Meat & Seafood', 'ground beef': 'Meat & Seafood', 'ground pork': 'Meat & Seafood',
    'ground turkey': 'Meat & Seafood', halibut: 'Meat & Seafood', ham: 'Meat & Seafood',
    'hot dog': 'Meat & Seafood', lamb: 'Meat & Seafood', lobster: 'Meat & Seafood',
    mussel: 'Meat & Seafood', pepperoni: 'Meat & Seafood', pork: 'Meat & Seafood',
    'pork chop': 'Meat & Seafood', prosciutto: 'Meat & Seafood', ribeye: 'Meat & Seafood',
    salmon: 'Meat & Seafood', sardine: 'Meat & Seafood', sausage: 'Meat & Seafood',
    scallop: 'Meat & Seafood', shrimp: 'Meat & Seafood', sirloin: 'Meat & Seafood',
    steak: 'Meat & Seafood', tilapia: 'Meat & Seafood', tuna: 'Meat & Seafood',
    turkey: 'Meat & Seafood', veal: 'Meat & Seafood', venison: 'Meat & Seafood',
    bratwurst: 'Meat & Seafood', salami: 'Meat & Seafood',
    // Frozen
    'chicken nugget': 'Frozen', edamame: 'Frozen', 'fish stick': 'Frozen',
    'french fry': 'Frozen', 'frozen broccoli': 'Frozen', 'frozen burrito': 'Frozen',
    'frozen corn': 'Frozen', 'frozen dinner': 'Frozen', 'frozen fruit': 'Frozen',
    'frozen lasagna': 'Frozen', 'frozen meal': 'Frozen', 'frozen pancake': 'Frozen',
    'frozen pea': 'Frozen', 'frozen pizza': 'Frozen', 'frozen shrimp': 'Frozen',
    'frozen spinach': 'Frozen', 'frozen vegetable': 'Frozen', 'frozen waffle': 'Frozen',
    gelato: 'Frozen', 'ice cream': 'Frozen', 'pot pie': 'Frozen', sorbet: 'Frozen',
    'tater tot': 'Frozen', 'frozen berry': 'Frozen', 'frozen mango': 'Frozen',
    ice: 'Frozen', 'frozen breakfast': 'Frozen',
    // Pantry
    almond: 'Pantry', 'almond butter': 'Pantry', 'apple cider vinegar': 'Pantry',
    'baking powder': 'Pantry', 'baking soda': 'Pantry', 'balsamic vinegar': 'Pantry',
    'black bean': 'Pantry', 'bread crumb': 'Pantry', 'brown rice': 'Pantry',
    'brown sugar': 'Pantry', 'canola oil': 'Pantry', 'chicken broth': 'Pantry',
    'beef broth': 'Pantry', 'vegetable broth': 'Pantry', 'chocolate chip': 'Pantry',
    'cocoa powder': 'Pantry', 'coconut oil': 'Pantry', cornstarch: 'Pantry',
    couscous: 'Pantry', 'dried cranberry': 'Pantry', farro: 'Pantry',
    'fish sauce': 'Pantry', flour: 'Pantry', granola: 'Pantry', honey: 'Pantry',
    'hot sauce': 'Pantry', jam: 'Pantry', jelly: 'Pantry', ketchup: 'Pantry',
    'kidney bean': 'Pantry', lentil: 'Pantry', 'maple syrup': 'Pantry',
    mayonnaise: 'Pantry', mustard: 'Pantry', nutella: 'Pantry',
    'nutritional yeast': 'Pantry', oat: 'Pantry', oatmeal: 'Pantry',
    'olive oil': 'Pantry', 'oyster sauce': 'Pantry', panko: 'Pantry',
    pasta: 'Pantry', 'pasta sauce': 'Pantry', peanut: 'Pantry',
    'peanut butter': 'Pantry', pecan: 'Pantry', penne: 'Pantry', pepper: 'Pantry',
    'pine nut': 'Pantry', 'pinto bean': 'Pantry', 'powdered sugar': 'Pantry',
    'protein powder': 'Pantry', 'pumpkin seed': 'Pantry', quinoa: 'Pantry',
    raisin: 'Pantry', 'ranch dressing': 'Pantry', rice: 'Pantry',
    rigatoni: 'Pantry', 'salad dressing': 'Pantry', salt: 'Pantry',
    'sesame oil': 'Pantry', 'soy sauce': 'Pantry', spaghetti: 'Pantry',
    sriracha: 'Pantry', sugar: 'Pantry', 'sunflower seed': 'Pantry',
    tahini: 'Pantry', 'teriyaki sauce': 'Pantry', 'tomato paste': 'Pantry',
    'tomato sauce': 'Pantry', 'canned tomato': 'Pantry', 'canned tuna': 'Pantry',
    'canned corn': 'Pantry', 'canned bean': 'Pantry', 'vanilla extract': 'Pantry',
    'vegetable oil': 'Pantry', vinegar: 'Pantry', walnut: 'Pantry',
    'white rice': 'Pantry', 'worcestershire sauce': 'Pantry', 'trail mix': 'Pantry',
    orzo: 'Pantry', 'lasagna noodle': 'Pantry', 'coconut flake': 'Pantry',
    breadcrumb: 'Pantry',
    // Beverages
    'almond milk': 'Beverages', 'apple juice': 'Beverages', beer: 'Beverages',
    champagne: 'Beverages', 'club soda': 'Beverages', 'cocktail mixer': 'Beverages',
    coffee: 'Beverages', cola: 'Beverages', 'diet soda': 'Beverages',
    'energy drink': 'Beverages', espresso: 'Beverages', gin: 'Beverages',
    'ginger ale': 'Beverages', 'grape juice': 'Beverages', 'green tea': 'Beverages',
    'ground coffee': 'Beverages', 'herbal tea': 'Beverages', 'instant coffee': 'Beverages',
    juice: 'Beverages', kombucha: 'Beverages', lemonade: 'Beverages',
    'orange juice': 'Beverages', 'red wine': 'Beverages', 'rosé': 'Beverages',
    rum: 'Beverages', soda: 'Beverages', 'sparkling water': 'Beverages',
    'sports drink': 'Beverages', tea: 'Beverages', 'tonic water': 'Beverages',
    vodka: 'Beverages', water: 'Beverages', whiskey: 'Beverages',
    'white wine': 'Beverages', wine: 'Beverages', 'black tea': 'Beverages',
    'cold brew': 'Beverages', 'iced tea': 'Beverages', 'hot cocoa': 'Beverages',
    // Snacks
    'beef jerky': 'Snacks', candy: 'Snacks', cashew: 'Snacks',
    'cheese cracker': 'Snacks', chip: 'Snacks', chocolate: 'Snacks',
    'dark chocolate': 'Snacks', dip: 'Snacks', 'dried fruit': 'Snacks',
    'fruit leather': 'Snacks', 'fruit snack': 'Snacks', 'granola bar': 'Snacks',
    guacamole: 'Snacks', gummy: 'Snacks', hummus: 'Snacks', jerky: 'Snacks',
    'milk chocolate': 'Snacks', nut: 'Snacks', popcorn: 'Snacks',
    'pork rind': 'Snacks', 'potato chip': 'Snacks', pretzel: 'Snacks',
    'protein bar': 'Snacks', 'rice cake': 'Snacks', salsa: 'Snacks',
    'snack bar': 'Snacks', 'tortilla chip': 'Snacks', cracker: 'Snacks',
    'peanut butter cup': 'Snacks', 'mixed nut': 'Snacks', 'veggie straw': 'Snacks',
    // Household
    'aluminum foil': 'Household', battery: 'Household', bleach: 'Household',
    broom: 'Household', candle: 'Household', 'cleaning wipe': 'Household',
    'dish soap': 'Household', 'dish towel': 'Household', 'dryer sheet': 'Household',
    'fabric softener': 'Household', 'garbage bag': 'Household', 'hand soap': 'Household',
    'laundry detergent': 'Household', 'light bulb': 'Household', match: 'Household',
    mop: 'Household', napkin: 'Household', 'paper towel': 'Household',
    'parchment paper': 'Household', 'plastic wrap': 'Household',
    'rubber band': 'Household', sponge: 'Household', 'storage bag': 'Household',
    tape: 'Household', tissue: 'Household', 'toilet paper': 'Household',
    'trash bag': 'Household', 'all-purpose cleaner': 'Household',
    'ziplock bag': 'Household', 'air freshener': 'Household',
    'dish glove': 'Household', 'scrub brush': 'Household', 'window cleaner': 'Household',
    // Personal Care
    advil: 'Personal Care', antacid: 'Personal Care', aspirin: 'Personal Care',
    'band-aid': 'Personal Care', 'body wash': 'Personal Care', chapstick: 'Personal Care',
    conditioner: 'Personal Care', 'cotton ball': 'Personal Care',
    deodorant: 'Personal Care', 'dental floss': 'Personal Care',
    'face wash': 'Personal Care', 'fish oil': 'Personal Care', 'hair gel': 'Personal Care',
    'hair spray': 'Personal Care', ibuprofen: 'Personal Care', 'lip balm': 'Personal Care',
    lotion: 'Personal Care', melatonin: 'Personal Care', moisturizer: 'Personal Care',
    mouthwash: 'Personal Care', multivitamin: 'Personal Care', pad: 'Personal Care',
    'q-tip': 'Personal Care', razor: 'Personal Care', shampoo: 'Personal Care',
    'shaving cream': 'Personal Care', soap: 'Personal Care', sunscreen: 'Personal Care',
    tampon: 'Personal Care', toothbrush: 'Personal Care', toothpaste: 'Personal Care',
    tylenol: 'Personal Care', vitamin: 'Personal Care', 'vitamin c': 'Personal Care',
    'vitamin d': 'Personal Care', toner: 'Personal Care', 'eye drop': 'Personal Care',
    'contact solution': 'Personal Care', 'nail clipper': 'Personal Care',
  }

  const HOME_DEPOT_DICT: Record<string, string> = {
    // Lumber & Building
    '2x4': 'Lumber & Building', '2x6': 'Lumber & Building', '2x8': 'Lumber & Building',
    '4x4 post': 'Lumber & Building', plywood: 'Lumber & Building',
    'osb board': 'Lumber & Building', drywall: 'Lumber & Building',
    'cement board': 'Lumber & Building', 'concrete block': 'Lumber & Building',
    brick: 'Lumber & Building', 'mortar mix': 'Lumber & Building',
    'concrete mix': 'Lumber & Building', gravel: 'Lumber & Building',
    sand: 'Lumber & Building', 'landscape fabric': 'Lumber & Building',
    'house wrap': 'Lumber & Building', 'vapor barrier': 'Lumber & Building',
    insulation: 'Lumber & Building', 'batt insulation': 'Lumber & Building',
    'rigid foam': 'Lumber & Building', 'spray foam': 'Lumber & Building',
    'roofing shingle': 'Lumber & Building', flashing: 'Lumber & Building',
    lumber: 'Lumber & Building', stud: 'Lumber & Building',
    // Paint & Supplies
    paint: 'Paint & Supplies', 'interior paint': 'Paint & Supplies',
    'exterior paint': 'Paint & Supplies', primer: 'Paint & Supplies',
    'spray paint': 'Paint & Supplies', 'chalk paint': 'Paint & Supplies',
    'paint roller': 'Paint & Supplies', 'paint brush': 'Paint & Supplies',
    'foam brush': 'Paint & Supplies', 'paint tray': 'Paint & Supplies',
    'roller cover': 'Paint & Supplies', 'drop cloth': 'Paint & Supplies',
    'painter tape': 'Paint & Supplies', 'masking tape': 'Paint & Supplies',
    caulk: 'Paint & Supplies', 'silicone caulk': 'Paint & Supplies',
    'acrylic caulk': 'Paint & Supplies', sealant: 'Paint & Supplies',
    'wood stain': 'Paint & Supplies', 'deck stain': 'Paint & Supplies',
    varnish: 'Paint & Supplies', polyurethane: 'Paint & Supplies',
    'wood filler': 'Paint & Supplies', spackle: 'Paint & Supplies',
    'joint compound': 'Paint & Supplies', 'drywall tape': 'Paint & Supplies',
    'corner bead': 'Paint & Supplies',
    // Plumbing
    'pvc pipe': 'Plumbing', 'abs pipe': 'Plumbing', 'copper pipe': 'Plumbing',
    'pex pipe': 'Plumbing', 'pipe fitting': 'Plumbing', 'elbow fitting': 'Plumbing',
    'tee fitting': 'Plumbing', coupling: 'Plumbing', 'pipe cement': 'Plumbing',
    'plumbers putty': 'Plumbing', 'teflon tape': 'Plumbing',
    'pipe thread tape': 'Plumbing', faucet: 'Plumbing', 'bathroom faucet': 'Plumbing',
    'kitchen faucet': 'Plumbing', showerhead: 'Plumbing', toilet: 'Plumbing',
    'toilet flapper': 'Plumbing', 'wax ring': 'Plumbing', 'supply line': 'Plumbing',
    'shut-off valve': 'Plumbing', 'ball valve': 'Plumbing', drain: 'Plumbing',
    'p-trap': 'Plumbing', 'drain snake': 'Plumbing', plunger: 'Plumbing',
    'toilet auger': 'Plumbing', 'pipe wrench': 'Plumbing', 'pipe cutter': 'Plumbing',
    // Electrical
    wire: 'Electrical', 'romex wire': 'Electrical', 'electrical wire': 'Electrical',
    outlet: 'Electrical', 'gfci outlet': 'Electrical', switch: 'Electrical',
    'light switch': 'Electrical', 'dimmer switch': 'Electrical',
    '3-way switch': 'Electrical', 'circuit breaker': 'Electrical',
    'electrical tape': 'Electrical', 'wire nut': 'Electrical',
    'wire connector': 'Electrical', conduit: 'Electrical', 'emt conduit': 'Electrical',
    'junction box': 'Electrical', 'outlet box': 'Electrical', 'switch box': 'Electrical',
    'led driver': 'Electrical',
    // Hardware & Fasteners
    screw: 'Hardware & Fasteners', 'wood screw': 'Hardware & Fasteners',
    'drywall screw': 'Hardware & Fasteners', 'deck screw': 'Hardware & Fasteners',
    bolt: 'Hardware & Fasteners', 'hex bolt': 'Hardware & Fasteners',
    'lag bolt': 'Hardware & Fasteners', 'carriage bolt': 'Hardware & Fasteners',
    nut: 'Hardware & Fasteners', 'hex nut': 'Hardware & Fasteners',
    washer: 'Hardware & Fasteners', 'flat washer': 'Hardware & Fasteners',
    'lock washer': 'Hardware & Fasteners', nail: 'Hardware & Fasteners',
    'framing nail': 'Hardware & Fasteners', 'finishing nail': 'Hardware & Fasteners',
    'brad nail': 'Hardware & Fasteners', 'roofing nail': 'Hardware & Fasteners',
    anchor: 'Hardware & Fasteners', 'wall anchor': 'Hardware & Fasteners',
    'concrete anchor': 'Hardware & Fasteners', 'toggle bolt': 'Hardware & Fasteners',
    'l-bracket': 'Hardware & Fasteners', 'corner bracket': 'Hardware & Fasteners',
    'shelf bracket': 'Hardware & Fasteners', 'joist hanger': 'Hardware & Fasteners',
    'post cap': 'Hardware & Fasteners', 'post base': 'Hardware & Fasteners',
    hinge: 'Hardware & Fasteners', 'cabinet hinge': 'Hardware & Fasteners',
    'door hinge': 'Hardware & Fasteners', 'door knob': 'Hardware & Fasteners',
    'door handle': 'Hardware & Fasteners', 'lever handle': 'Hardware & Fasteners',
    deadbolt: 'Hardware & Fasteners', latch: 'Hardware & Fasteners',
    hook: 'Hardware & Fasteners', 'eye bolt': 'Hardware & Fasteners',
    'screw hook': 'Hardware & Fasteners',
    // Tools
    'drill bit': 'Tools', 'spade bit': 'Tools', 'hole saw': 'Tools',
    'masonry bit': 'Tools', 'saw blade': 'Tools', 'circular saw blade': 'Tools',
    'jigsaw blade': 'Tools', 'reciprocating blade': 'Tools', sandpaper: 'Tools',
    'sanding disc': 'Tools', 'sanding block': 'Tools', 'steel wool': 'Tools',
    'wire brush': 'Tools', 'putty knife': 'Tools', 'caulk gun': 'Tools',
    'heat gun': 'Tools', 'utility knife': 'Tools', 'box cutter': 'Tools',
    'angle grinder disc': 'Tools', 'grinding wheel': 'Tools', 'flap disc': 'Tools',
    // Garden & Outdoor
    mulch: 'Garden & Outdoor', 'wood chip mulch': 'Garden & Outdoor',
    topsoil: 'Garden & Outdoor', 'garden soil': 'Garden & Outdoor',
    'potting soil': 'Garden & Outdoor', 'raised bed mix': 'Garden & Outdoor',
    compost: 'Garden & Outdoor', 'peat moss': 'Garden & Outdoor',
    perlite: 'Garden & Outdoor', fertilizer: 'Garden & Outdoor',
    'plant food': 'Garden & Outdoor', 'weed killer': 'Garden & Outdoor',
    herbicide: 'Garden & Outdoor', pesticide: 'Garden & Outdoor',
    insecticide: 'Garden & Outdoor', 'grass seed': 'Garden & Outdoor',
    'lawn fertilizer': 'Garden & Outdoor', 'garden hose': 'Garden & Outdoor',
    'soaker hose': 'Garden & Outdoor', 'drip irrigation': 'Garden & Outdoor',
    'hose nozzle': 'Garden & Outdoor', sprinkler: 'Garden & Outdoor',
    'garden glove': 'Garden & Outdoor', trowel: 'Garden & Outdoor',
    'hand pruner': 'Garden & Outdoor', 'pruning shear': 'Garden & Outdoor',
    loppers: 'Garden & Outdoor', rake: 'Garden & Outdoor', 'leaf blower': 'Garden & Outdoor',
    'trimmer line': 'Garden & Outdoor', 'garden fork': 'Garden & Outdoor',
    hoe: 'Garden & Outdoor', shovel: 'Garden & Outdoor', spade: 'Garden & Outdoor',
    wheelbarrow: 'Garden & Outdoor', planter: 'Garden & Outdoor',
    pot: 'Garden & Outdoor', 'raised bed kit': 'Garden & Outdoor',
    'bird seed': 'Garden & Outdoor', 'bird feeder': 'Garden & Outdoor',
    'stepping stone': 'Garden & Outdoor', 'landscape rock': 'Garden & Outdoor',
    paver: 'Garden & Outdoor', 'retaining wall block': 'Garden & Outdoor',
    'garden edging': 'Garden & Outdoor', 'deer repellent': 'Garden & Outdoor',
    // Flooring
    'ceramic tile': 'Flooring', 'porcelain tile': 'Flooring', 'floor tile': 'Flooring',
    'wall tile': 'Flooring', 'backsplash tile': 'Flooring', 'tile grout': 'Flooring',
    'sanded grout': 'Flooring', 'tile adhesive': 'Flooring', thinset: 'Flooring',
    'floor leveler': 'Flooring', 'floor adhesive': 'Flooring',
    'laminate flooring': 'Flooring', 'vinyl flooring': 'Flooring',
    'luxury vinyl plank': 'Flooring', 'lvp flooring': 'Flooring',
    'hardwood flooring': 'Flooring', 'engineered hardwood': 'Flooring',
    'bamboo flooring': 'Flooring', carpet: 'Flooring', 'carpet padding': 'Flooring',
    underlayment: 'Flooring', 'transition strip': 'Flooring', 't-molding': 'Flooring',
    'floor molding': 'Flooring', 'quarter round': 'Flooring', baseboard: 'Flooring',
    // Kitchen & Bath
    'kitchen cabinet': 'Kitchen & Bath', 'base cabinet': 'Kitchen & Bath',
    'wall cabinet': 'Kitchen & Bath', 'bathroom vanity': 'Kitchen & Bath',
    'medicine cabinet': 'Kitchen & Bath', 'bathroom mirror': 'Kitchen & Bath',
    'kitchen sink': 'Kitchen & Bath', 'bathroom sink': 'Kitchen & Bath',
    mirror: 'Kitchen & Bath', 'towel bar': 'Kitchen & Bath',
    'towel ring': 'Kitchen & Bath', 'toilet paper holder': 'Kitchen & Bath',
    'robe hook': 'Kitchen & Bath', 'grab bar': 'Kitchen & Bath',
    'shower curtain rod': 'Kitchen & Bath', 'shower door': 'Kitchen & Bath',
    'light fixture': 'Kitchen & Bath', 'vanity light': 'Kitchen & Bath',
    'ceiling fan': 'Kitchen & Bath', 'exhaust fan': 'Kitchen & Bath',
    'vent hood': 'Kitchen & Bath', 'range hood': 'Kitchen & Bath',
    'cabinet handle': 'Kitchen & Bath', 'cabinet knob': 'Kitchen & Bath',
    'cabinet pull': 'Kitchen & Bath',
    // Other
    ladder: 'Other', 'step stool': 'Other', 'step ladder': 'Other',
    'extension ladder': 'Other', 'safety glasses': 'Other', 'work gloves': 'Other',
    'dust mask': 'Other', 'n95 mask': 'Other', respirator: 'Other',
    'knee pad': 'Other', 'ear protection': 'Other', 'tool belt': 'Other',
    'tool pouch': 'Other', 'storage bin': 'Other', 'shelving unit': 'Other',
    'wire shelving': 'Other', 'metal shelving': 'Other', 'garage shelving': 'Other',
    workbench: 'Other', 'saw horse': 'Other', 'weather stripping': 'Other',
    'door sweep': 'Other', 'door threshold': 'Other', 'extension cord': 'Other',
    'power strip': 'Other', 'work light': 'Other', 'duct tape': 'Other',
  }

  const COSTCO_DICT: Record<string, string> = {
    // Produce (same as grocery)
    apple: 'Produce', avocado: 'Produce', banana: 'Produce', blueberry: 'Produce',
    broccoli: 'Produce', carrot: 'Produce', celery: 'Produce', cherry: 'Produce',
    corn: 'Produce', cucumber: 'Produce', garlic: 'Produce', grape: 'Produce',
    kale: 'Produce', lemon: 'Produce', lettuce: 'Produce', lime: 'Produce',
    mango: 'Produce', mushroom: 'Produce', onion: 'Produce', orange: 'Produce',
    peach: 'Produce', pear: 'Produce', pineapple: 'Produce', potato: 'Produce',
    raspberry: 'Produce', romaine: 'Produce', spinach: 'Produce',
    strawberry: 'Produce', 'sweet potato': 'Produce', tomato: 'Produce',
    watermelon: 'Produce', 'salad kit': 'Produce', 'fruit basket': 'Produce',
    'berry mix': 'Produce', 'spring mix': 'Produce',
    // Dairy & Eggs
    butter: 'Dairy & Eggs', cheddar: 'Dairy & Eggs', 'cream cheese': 'Dairy & Eggs',
    egg: 'Dairy & Eggs', 'greek yogurt': 'Dairy & Eggs', 'heavy cream': 'Dairy & Eggs',
    milk: 'Dairy & Eggs', mozzarella: 'Dairy & Eggs', 'oat milk': 'Dairy & Eggs',
    parmesan: 'Dairy & Eggs', 'sour cream': 'Dairy & Eggs', 'string cheese': 'Dairy & Eggs',
    yogurt: 'Dairy & Eggs', 'almond milk': 'Dairy & Eggs', 'egg pack': 'Dairy & Eggs',
    'cage free egg': 'Dairy & Eggs',
    // Bakery
    bagel: 'Bakery', bread: 'Bakery', brownie: 'Bakery', cake: 'Bakery',
    cookie: 'Bakery', croissant: 'Bakery', 'dinner roll': 'Bakery', donut: 'Bakery',
    muffin: 'Bakery', 'costco muffin': 'Bakery', 'muffin pack': 'Bakery',
    'mini croissant': 'Bakery', 'croissant pack': 'Bakery', 'bakery cake': 'Bakery',
    pie: 'Bakery', 'pumpkin pie': 'Bakery', cheesecake: 'Bakery',
    // Meat & Seafood
    bacon: 'Meat & Seafood', beef: 'Meat & Seafood', chicken: 'Meat & Seafood',
    'chicken breast': 'Meat & Seafood', 'chicken thigh': 'Meat & Seafood',
    'ground beef': 'Meat & Seafood', 'ground turkey': 'Meat & Seafood',
    ham: 'Meat & Seafood', 'hot dog': 'Meat & Seafood', lamb: 'Meat & Seafood',
    pepperoni: 'Meat & Seafood', pork: 'Meat & Seafood', 'pork chop': 'Meat & Seafood',
    salmon: 'Meat & Seafood', sausage: 'Meat & Seafood', shrimp: 'Meat & Seafood',
    steak: 'Meat & Seafood', tilapia: 'Meat & Seafood', tuna: 'Meat & Seafood',
    turkey: 'Meat & Seafood', bratwurst: 'Meat & Seafood', salami: 'Meat & Seafood',
    'rotisserie chicken': 'Meat & Seafood', brisket: 'Meat & Seafood',
    // Frozen
    'chicken nugget': 'Frozen', edamame: 'Frozen', 'fish stick': 'Frozen',
    'french fry': 'Frozen', 'frozen broccoli': 'Frozen', 'frozen burrito': 'Frozen',
    'frozen dinner': 'Frozen', 'frozen fruit': 'Frozen', 'frozen lasagna': 'Frozen',
    'frozen meal': 'Frozen', 'frozen pizza': 'Frozen', 'frozen shrimp': 'Frozen',
    'frozen vegetable': 'Frozen', 'frozen waffle': 'Frozen', gelato: 'Frozen',
    'ice cream': 'Frozen', 'pot pie': 'Frozen', 'tater tot': 'Frozen',
    'frozen berry': 'Frozen', ice: 'Frozen', 'frozen breakfast': 'Frozen',
    // Pantry
    almond: 'Pantry', 'almond butter': 'Pantry', 'baking powder': 'Pantry',
    'baking soda': 'Pantry', 'black bean': 'Pantry', 'brown rice': 'Pantry',
    'brown sugar': 'Pantry', 'canola oil': 'Pantry', 'chicken broth': 'Pantry',
    'chocolate chip': 'Pantry', 'cocoa powder': 'Pantry', 'coconut oil': 'Pantry',
    flour: 'Pantry', granola: 'Pantry', honey: 'Pantry', 'hot sauce': 'Pantry',
    jam: 'Pantry', ketchup: 'Pantry', lentil: 'Pantry', 'maple syrup': 'Pantry',
    mayonnaise: 'Pantry', mustard: 'Pantry', oat: 'Pantry', oatmeal: 'Pantry',
    'olive oil': 'Pantry', pasta: 'Pantry', 'pasta sauce': 'Pantry',
    'peanut butter': 'Pantry', pecan: 'Pantry', quinoa: 'Pantry', rice: 'Pantry',
    salt: 'Pantry', 'soy sauce': 'Pantry', sugar: 'Pantry',
    'tomato paste': 'Pantry', 'tomato sauce': 'Pantry', walnut: 'Pantry',
    'white rice': 'Pantry', 'kirkland olive oil': 'Pantry',
    'kirkland peanut butter': 'Pantry', 'almond flour': 'Pantry',
    'coconut flour': 'Pantry', 'protein shake': 'Pantry', 'whey protein': 'Pantry',
    'collagen powder': 'Pantry',
    // Beverages
    beer: 'Beverages', coffee: 'Beverages', 'energy drink': 'Beverages',
    juice: 'Beverages', kombucha: 'Beverages', 'orange juice': 'Beverages',
    'red wine': 'Beverages', rum: 'Beverages', soda: 'Beverages',
    'sparkling water': 'Beverages', tea: 'Beverages', vodka: 'Beverages',
    water: 'Beverages', whiskey: 'Beverages', 'white wine': 'Beverages',
    wine: 'Beverages', 'cold brew': 'Beverages', 'sports drink': 'Beverages',
    'topo chico': 'Beverages', 'liquid iv': 'Beverages', 'premier protein': 'Beverages',
    'sparkling water pack': 'Beverages',
    // Snacks
    'beef jerky': 'Snacks', candy: 'Snacks', cashew: 'Snacks',
    'cheese cracker': 'Snacks', chip: 'Snacks', chocolate: 'Snacks',
    'dark chocolate': 'Snacks', 'dried fruit': 'Snacks', 'granola bar': 'Snacks',
    guacamole: 'Snacks', hummus: 'Snacks', jerky: 'Snacks', 'mixed nut': 'Snacks',
    nut: 'Snacks', popcorn: 'Snacks', pretzel: 'Snacks', 'protein bar': 'Snacks',
    'rice cake': 'Snacks', salsa: 'Snacks', 'tortilla chip': 'Snacks',
    'trail mix': 'Snacks', cracker: 'Snacks', 'kirkland trail mix': 'Snacks',
    'peanut butter cracker': 'Snacks', 'clif bar': 'Snacks', 'rx bar': 'Snacks',
    'beef stick': 'Snacks', 'pita chip': 'Snacks', 'seaweed snack': 'Snacks',
    'macadamia nut': 'Snacks',
    // Household
    'aluminum foil': 'Household', battery: 'Household', bleach: 'Household',
    'cleaning wipe': 'Household', 'dish soap': 'Household', 'dryer sheet': 'Household',
    'fabric softener': 'Household', 'garbage bag': 'Household', 'hand soap': 'Household',
    'laundry detergent': 'Household', napkin: 'Household', 'paper towel': 'Household',
    'plastic wrap': 'Household', sponge: 'Household', 'storage bag': 'Household',
    tissue: 'Household', 'toilet paper': 'Household', 'trash bag': 'Household',
    'all-purpose cleaner': 'Household', 'ziplock bag': 'Household',
    'paper towel pack': 'Household', 'toilet paper pack': 'Household',
    'kirkland toilet paper': 'Household', 'napkin pack': 'Household',
    'paper plate': 'Household', 'plastic cup': 'Household',
    'dish pod': 'Household', 'laundry pod': 'Household',
    'disinfectant wipe': 'Household', 'microfiber cloth': 'Household',
    'trash bag pack': 'Household',
    // Personal Care
    conditioner: 'Personal Care', deodorant: 'Personal Care',
    'dental floss': 'Personal Care', 'fish oil': 'Personal Care',
    ibuprofen: 'Personal Care', lotion: 'Personal Care', melatonin: 'Personal Care',
    moisturizer: 'Personal Care', mouthwash: 'Personal Care',
    multivitamin: 'Personal Care', razor: 'Personal Care', shampoo: 'Personal Care',
    sunscreen: 'Personal Care', toothbrush: 'Personal Care',
    toothpaste: 'Personal Care', vitamin: 'Personal Care',
    'vitamin c': 'Personal Care', 'vitamin d': 'Personal Care',
    'multivitamin pack': 'Personal Care', 'omega 3': 'Personal Care',
    'probiotics': 'Personal Care', collagen: 'Personal Care',
    'shampoo pack': 'Personal Care', 'body wash pack': 'Personal Care',
    'sunscreen pack': 'Personal Care', 'floss pack': 'Personal Care',
    // Electronics
    laptop: 'Electronics', tablet: 'Electronics', ipad: 'Electronics',
    television: 'Electronics', tv: 'Electronics', monitor: 'Electronics',
    printer: 'Electronics', camera: 'Electronics', headphones: 'Electronics',
    earbuds: 'Electronics', speaker: 'Electronics', 'bluetooth speaker': 'Electronics',
    soundbar: 'Electronics', 'smart watch': 'Electronics',
    'fitness tracker': 'Electronics', 'phone case': 'Electronics',
    'phone charger': 'Electronics', 'usb cable': 'Electronics',
    'usb-c cable': 'Electronics', 'hdmi cable': 'Electronics',
    'surge protector': 'Electronics', 'power bank': 'Electronics',
    'smart plug': 'Electronics', 'smart bulb': 'Electronics',
    'robot vacuum': 'Electronics', 'air purifier': 'Electronics',
    humidifier: 'Electronics', dehumidifier: 'Electronics', 'air fryer': 'Electronics',
    'instant pot': 'Electronics', 'coffee maker': 'Electronics',
    'espresso machine': 'Electronics', blender: 'Electronics',
    'stand mixer': 'Electronics', 'food processor': 'Electronics',
    toaster: 'Electronics', 'toaster oven': 'Electronics', microwave: 'Electronics',
    'electric kettle': 'Electronics', 'shop vac': 'Electronics',
  }

  const migrate = db.transaction(() => {
    db.prepare('INSERT OR REPLACE INTO store_types (id, name, areas) VALUES (?, ?, ?)').run(
      'grocery', 'Grocery', JSON.stringify(GROCERY_AREAS)
    )
    db.prepare('INSERT OR REPLACE INTO store_types (id, name, areas) VALUES (?, ?, ?)').run(
      'home-depot', 'Home Depot', JSON.stringify(HOME_DEPOT_AREAS)
    )
    db.prepare('INSERT OR REPLACE INTO store_types (id, name, areas) VALUES (?, ?, ?)').run(
      'costco', 'Costco', JSON.stringify(COSTCO_AREAS)
    )

    db.prepare('INSERT OR REPLACE INTO stores (id, name, store_type_id) VALUES (?, ?, ?)').run(
      'store-grocery', 'Grocery Store', 'grocery'
    )
    db.prepare('INSERT OR REPLACE INTO stores (id, name, store_type_id) VALUES (?, ?, ?)').run(
      'store-home-depot', 'Home Depot', 'home-depot'
    )
    db.prepare('INSERT OR REPLACE INTO stores (id, name, store_type_id) VALUES (?, ?, ?)').run(
      'store-costco', 'Costco', 'costco'
    )

    const insertDict = db.prepare(
      'INSERT OR REPLACE INTO store_type_dictionary (store_type_id, item_name, area) VALUES (?, ?, ?)'
    )
    for (const [item, area] of Object.entries(GROCERY_DICT)) {
      insertDict.run('grocery', item, area)
    }
    for (const [item, area] of Object.entries(HOME_DEPOT_DICT)) {
      insertDict.run('home-depot', item, area)
    }
    for (const [item, area] of Object.entries(COSTCO_DICT)) {
      insertDict.run('costco', item, area)
    }

    db.prepare("UPDATE lists SET store_id = 'store-grocery' WHERE store_id IS NULL").run()
  })

  migrate()
  db.exec('PRAGMA user_version = 1')
}

if (user_version < 2) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS otp_codes (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at DATETIME NOT NULL,
      used INTEGER NOT NULL DEFAULT 0,
      attempts INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS list_members (
      list_id TEXT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'member',
      PRIMARY KEY (list_id, user_id)
    )
  `)

  db.exec('PRAGMA user_version = 2')
}

export function adoptLegacyLists(userId: string, email: string) {
  db.prepare(`
    INSERT OR IGNORE INTO list_members (list_id, user_id, role)
    SELECT id, ?, 'owner' FROM lists WHERE owner_email = ?
  `).run(userId, email)
}

export function getMemberRole(listId: string, userId: string): string | null {
  const row = db.prepare(
    'SELECT role FROM list_members WHERE list_id = ? AND user_id = ?'
  ).get(listId, userId) as { role: string } | null
  return row?.role ?? null
}

export default db
