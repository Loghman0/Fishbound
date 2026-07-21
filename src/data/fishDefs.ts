/**
 * data/fishDefs.ts — Stage 3: 35 fish + junk catalog.
 * New fields: biomeTags, baitPreference, lore, bestiaryHint (all optional).
 */

export type Rarity = "common" | "uncommon" | "rare" | "legendary" | "junk";

export type FishBehavior =
  | "puffer" | "jerker" | "runner" | "diver" | "legendary" | "glow" | "shy";

export interface FightStats {
  pullStrength: number;
  directionChangeFrequency: number;
  escapeChance: number;
  jerkChance: number;
  hookWindowMs: number;
  stages?: number;
}

export interface FishDef {
  id: string;
  name: string;
  price: number;
  rarity: Rarity;
  icon: string;
  minRodTier?: number;
  weightKg?: [number, number];
  activeWindows?: Array<"dawn" | "day" | "dusk" | "night">;
  weatherBias?: Partial<Record<"clear" | "cloudy" | "rain" | "storm", number>>;
  fightStats?: FightStats;
  behaviors?: FishBehavior[];
  /** Biome tags this fish appears in (drives Bestiary filter + hints). */
  biomeTags?: string[];
  /** Preferred bait ids. */
  baitPreference?: string[];
  /** Flavor text shown once discovered. */
  lore?: string;
  /** Short hint shown for undiscovered fish. */
  bestiaryHint?: string;
}

export interface JunkDef extends FishDef { junk: true }

const DEFAULT_FIGHT: FightStats = {
  pullStrength: 1, directionChangeFrequency: 0.6, escapeChance: 0.05,
  jerkChance: 0.1, hookWindowMs: 700,
};

export const FISH_DEFS: Record<string, FishDef> = {
  // ── COMMON ────────────────────────────────────────────────────
  Minnow:      { id: "Minnow", name: "Minnow", price: 5, rarity: "common", icon: "assets/images/fish/minnow.png", weightKg: [0.05, 0.2],
                 activeWindows: ["day", "dusk"], weatherBias: { clear: 1.2, rain: 0.7 },
                 fightStats: { pullStrength: 0.4, directionChangeFrequency: 0.8, escapeChance: 0.08, jerkChance: 0.05, hookWindowMs: 800 },
                 biomeTags: ["pond", "river", "cove"], lore: "Schools by the dozens in still water. Most anglers cut their teeth on these.", bestiaryHint: "Anywhere shallow during the day." },
  Bluegill:    { id: "Bluegill", name: "Bluegill", price: 15, rarity: "common", icon: "assets/images/fish/bluegill.png", weightKg: [0.2, 0.7],
                 activeWindows: ["dawn", "day"],
                 fightStats: { pullStrength: 0.55, directionChangeFrequency: 0.7, escapeChance: 0.07, jerkChance: 0.08, hookWindowMs: 760 },
                 biomeTags: ["pond", "river"], lore: "Stubborn little sunfish with attitude that outweighs them.", bestiaryHint: "Dawn bites best." },
  Pinkperch:   { id: "Pinkperch", name: "Pink Perch", price: 18, rarity: "common", icon: "assets/images/fish/pinkperch.png", weightKg: [0.3, 1.0],
                 fightStats: { pullStrength: 0.6, directionChangeFrequency: 0.65, escapeChance: 0.07, jerkChance: 0.1, hookWindowMs: 720 },
                 biomeTags: ["pond", "river", "cove"], lore: "Coppery-pink scales turn molten in dusk light.", bestiaryHint: "Common everywhere shallow." },
  Greencarp:   { id: "Greencarp", name: "Green Carp", price: 20, rarity: "common", icon: "assets/images/fish/greencarp.png", weightKg: [0.5, 2.0],
                 weatherBias: { rain: 1.4, storm: 1.2 },
                 fightStats: { pullStrength: 0.85, directionChangeFrequency: 0.45, escapeChance: 0.05, jerkChance: 0.18, hookWindowMs: 700 },
                 behaviors: ["diver"], biomeTags: ["pond", "river"], lore: "Carp love a downpour — they rise to bite when it rains.", bestiaryHint: "Rainy days, calm water." },
  Leaffish:    { id: "Leaffish", name: "Leaffish", price: 22, rarity: "common", icon: "assets/images/fish/leaffish.png", weightKg: [0.3, 0.9],
                 activeWindows: ["day"], fightStats: { ...DEFAULT_FIGHT, pullStrength: 0.55 },
                 biomeTags: ["rainforest", "river"], lore: "Drifts among fallen foliage, hiding in plain sight.", bestiaryHint: "Hides under canopy in the rainforest." },
  Sandwhiting: { id: "Sandwhiting", name: "Sand Whiting", price: 25, rarity: "common", icon: "assets/images/fish/sandwhiting.png", weightKg: [0.4, 1.2],
                 fightStats: { ...DEFAULT_FIGHT, pullStrength: 0.7 },
                 biomeTags: ["cove", "sea"], lore: "Skates the sandy shelves of the cove all summer.", bestiaryHint: "Coastal sand banks." },
  Mudbarb:     { id: "Mudbarb", name: "Mudbarb", price: 8, rarity: "common", icon: "assets/images/fish/greencarp.png", weightKg: [0.1, 0.4],
                 fightStats: { ...DEFAULT_FIGHT, pullStrength: 0.4 },
                 biomeTags: ["pond", "outflow"], lore: "Thrives in cloudy water others avoid.", bestiaryHint: "Murky shallows. Loves outflow runoff." },
  Reedbass:    { id: "Reedbass", name: "Reed Bass", price: 28, rarity: "common", icon: "assets/images/fish/bluegill.png", weightKg: [0.6, 1.8],
                 activeWindows: ["dawn", "dusk"],
                 fightStats: { pullStrength: 0.9, directionChangeFrequency: 0.5, escapeChance: 0.06, jerkChance: 0.12, hookWindowMs: 700 },
                 biomeTags: ["pond", "river"], lore: "Lurks beneath reed mats, ambushing insects.", bestiaryHint: "Reed beds at twilight." },

  // ── UNCOMMON ─────────────────────────────────────────────────
  Goldfish:    { id: "Goldfish", name: "Goldfish", price: 35, rarity: "uncommon", icon: "assets/images/fish/goldfish.png", minRodTier: 2, weightKg: [0.2, 0.6],
                 activeWindows: ["dawn", "dusk"],
                 fightStats: { pullStrength: 0.55, directionChangeFrequency: 0.85, escapeChance: 0.1, jerkChance: 0.08, hookWindowMs: 600 },
                 behaviors: ["runner"], biomeTags: ["pond"], lore: "Ornamental escapees that turned feral and clever.", bestiaryHint: "Loves dawn light in calm ponds." },
  Dartfish:    { id: "Dartfish", name: "Dartfish", price: 40, rarity: "uncommon", icon: "assets/images/fish/dartfish.png", minRodTier: 2, weightKg: [0.3, 0.8],
                 fightStats: { pullStrength: 0.7, directionChangeFrequency: 0.95, escapeChance: 0.12, jerkChance: 0.18, hookWindowMs: 520 },
                 behaviors: ["runner", "shy"], biomeTags: ["river", "cove"], lore: "Bolts at the slightest shadow. Patience required.", bestiaryHint: "Spooky — needs a calm approach." },
  Rockfish:    { id: "Rockfish", name: "Rockfish", price: 45, rarity: "uncommon", icon: "assets/images/fish/rockfish.png", minRodTier: 2, weightKg: [0.6, 2.4],
                 weatherBias: { storm: 1.4, rain: 1.2 },
                 fightStats: { pullStrength: 1.1, directionChangeFrequency: 0.4, escapeChance: 0.04, jerkChance: 0.22, hookWindowMs: 680 },
                 behaviors: ["diver", "jerker"], biomeTags: ["cove", "sea"], lore: "Wedges against stone and refuses to budge.", bestiaryHint: "Stormy reefs reward boldness." },
  Pufferfish:  { id: "Pufferfish", name: "Pufferfish", price: 55, rarity: "uncommon", icon: "assets/images/fish/pufferfish.png", minRodTier: 3, weightKg: [0.4, 1.6],
                 fightStats: { pullStrength: 0.75, directionChangeFrequency: 0.5, escapeChance: 0.05, jerkChance: 0.15, hookWindowMs: 700 },
                 behaviors: ["puffer"], biomeTags: ["cove", "sea"], lore: "Inflates mid-fight and pulls twice as hard.", bestiaryHint: "Expect a second wind." },
  Neonfish:    { id: "Neonfish", name: "Neonfish", price: 60, rarity: "uncommon", icon: "assets/images/fish/neonfish.png", minRodTier: 3, weightKg: [0.2, 0.7],
                 activeWindows: ["night"],
                 fightStats: { pullStrength: 0.6, directionChangeFrequency: 0.9, escapeChance: 0.12, jerkChance: 0.1, hookWindowMs: 540 },
                 behaviors: ["glow", "shy"], baitPreference: ["bait_glow"], biomeTags: ["river", "cove"], lore: "Bio-luminescent stripes that flicker like Morse code.", bestiaryHint: "Glow bait, after dusk." },
  Clownfish:   { id: "Clownfish", name: "Clownfish", price: 70, rarity: "uncommon", icon: "assets/images/fish/clownfish.png", minRodTier: 3, weightKg: [0.15, 0.5],
                 activeWindows: ["day", "dusk"],
                 fightStats: { ...DEFAULT_FIGHT, pullStrength: 0.6, hookWindowMs: 620 },
                 biomeTags: ["cove", "sea"], lore: "Bold little stripes, fearless of bigger predators.", bestiaryHint: "Warm coves in daylight." },
  Frostperch:  { id: "Frostperch", name: "Frost Perch", price: 85, rarity: "uncommon", icon: "assets/images/fish/pinkperch.png", minRodTier: 3, weightKg: [0.4, 1.4],
                 weatherBias: { clear: 1.3 },
                 fightStats: { pullStrength: 0.7, directionChangeFrequency: 0.6, escapeChance: 0.08, jerkChance: 0.14, hookWindowMs: 640 },
                 biomeTags: ["frozen"], lore: "Sluggish in the cold — but heavy when hooked.", bestiaryHint: "Ice-thick lakes." },
  Tinker:      { id: "Tinker", name: "Tinker Mackerel", price: 78, rarity: "uncommon", icon: "assets/images/fish/dartfish.png", minRodTier: 2, weightKg: [0.5, 1.5],
                 fightStats: { pullStrength: 0.9, directionChangeFrequency: 0.8, escapeChance: 0.1, jerkChance: 0.15, hookWindowMs: 560 },
                 behaviors: ["runner"], biomeTags: ["sea", "cove"], lore: "Fast, oily, and great fried.", bestiaryHint: "Open sea, schooling at midday." },
  Slimecarp:   { id: "Slimecarp", name: "Slime Carp", price: 48, rarity: "uncommon", icon: "assets/images/fish/greencarp.png", minRodTier: 2, weightKg: [0.8, 2.6],
                 weatherBias: { rain: 1.6 },
                 fightStats: { pullStrength: 0.95, directionChangeFrequency: 0.4, escapeChance: 0.05, jerkChance: 0.2, hookWindowMs: 720 },
                 behaviors: ["diver"], biomeTags: ["outflow", "pond"], lore: "Thrives where others can't — coated in protective slime.", bestiaryHint: "Polluted runoff doesn't faze it." },

  // ── RARE ────────────────────────────────────────────────────
  Emeraldfish: { id: "Emeraldfish", name: "Emerald Fish", price: 150, rarity: "rare", icon: "assets/images/fish/emeraldfish.png", minRodTier: 4, weightKg: [0.6, 2.0],
                 weatherBias: { rain: 1.5 },
                 fightStats: { pullStrength: 1.2, directionChangeFrequency: 0.55, escapeChance: 0.1, jerkChance: 0.22, hookWindowMs: 520 },
                 behaviors: ["jerker"], biomeTags: ["river", "rainforest"], lore: "Iridescent green scales prized by jewellers.", bestiaryHint: "Rainforest river, in the rain." },
  Angelfish:   { id: "Angelfish", name: "Angelfish", price: 180, rarity: "rare", icon: "assets/images/fish/angelfish.png", minRodTier: 4, weightKg: [0.4, 1.5],
                 activeWindows: ["dawn", "day"],
                 fightStats: { pullStrength: 1.0, directionChangeFrequency: 0.7, escapeChance: 0.12, jerkChance: 0.16, hookWindowMs: 500 },
                 behaviors: ["runner"], biomeTags: ["sea", "cove"], lore: "Long fins drift like brushstrokes through clear water.", bestiaryHint: "Sunny mornings on the sea." },
  Rubybream:   { id: "Rubybream", name: "Ruby Bream", price: 200, rarity: "rare", icon: "assets/images/fish/rubybream.png", minRodTier: 5, weightKg: [0.7, 2.5],
                 fightStats: { pullStrength: 1.35, directionChangeFrequency: 0.5, escapeChance: 0.08, jerkChance: 0.25, hookWindowMs: 480 },
                 behaviors: ["diver", "jerker"], biomeTags: ["sea", "abyss"], lore: "A fighter that dives the moment it feels the hook.", bestiaryHint: "Deep water, tier 5 rod minimum." },
  Stormbass:   { id: "Stormbass", name: "Stormbass", price: 230, rarity: "rare", icon: "assets/images/fish/rockfish.png", minRodTier: 4, weightKg: [1.0, 3.5],
                 weatherBias: { storm: 1.9, rain: 1.3 },
                 fightStats: { pullStrength: 1.3, directionChangeFrequency: 0.55, escapeChance: 0.1, jerkChance: 0.28, hookWindowMs: 500 },
                 behaviors: ["jerker", "diver"], biomeTags: ["sea", "cove"], lore: "Drawn from the depths by thunder.", bestiaryHint: "Only bites in a storm." },
  Goldbarb:    { id: "Goldbarb", name: "Gold Barb", price: 260, rarity: "rare", icon: "assets/images/fish/goldfish.png", minRodTier: 4, weightKg: [0.5, 1.5],
                 activeWindows: ["dusk"],
                 fightStats: { pullStrength: 0.9, directionChangeFrequency: 0.9, escapeChance: 0.12, jerkChance: 0.18, hookWindowMs: 460 },
                 behaviors: ["runner", "shy"], biomeTags: ["rainforest"], lore: "Slicked in gold, slips through the fingers of unworthy anglers.", bestiaryHint: "Rainforest dusk." },
  Crystaltrout:{ id: "Crystaltrout", name: "Crystal Trout", price: 320, rarity: "rare", icon: "assets/images/fish/emeraldfish.png", minRodTier: 5, weightKg: [1.5, 4.0],
                 weatherBias: { clear: 1.3 },
                 fightStats: { pullStrength: 1.25, directionChangeFrequency: 0.5, escapeChance: 0.06, jerkChance: 0.2, hookWindowMs: 520 },
                 biomeTags: ["frozen"], lore: "Almost transparent; only the eyes give it away.", bestiaryHint: "Clear-water frozen lake." },
  Ironback:    { id: "Ironback", name: "Ironback", price: 350, rarity: "rare", icon: "assets/images/fish/rockfish.png", minRodTier: 5, weightKg: [2.0, 5.5],
                 fightStats: { pullStrength: 1.55, directionChangeFrequency: 0.3, escapeChance: 0.05, jerkChance: 0.3, hookWindowMs: 500 },
                 behaviors: ["diver"], biomeTags: ["outflow", "abyss"], lore: "Scales hardened by years in polluted runoff.", bestiaryHint: "Steamworks outflow. Bring a strong rod." },

  // ── LEGENDARY ───────────────────────────────────────────────
  Moonfish:    { id: "Moonfish", name: "Moonfish", price: 600, rarity: "legendary", icon: "assets/images/fish/moonfish.png", minRodTier: 5, weightKg: [3.0, 8.5],
                 activeWindows: ["night"], weatherBias: { clear: 1.3, storm: 1.5 },
                 fightStats: { pullStrength: 1.7, directionChangeFrequency: 0.65, escapeChance: 0.08, jerkChance: 0.32, hookWindowMs: 420, stages: 3 },
                 behaviors: ["legendary", "glow", "jerker"], baitPreference: ["bait_legendary", "bait_glow"],
                 biomeTags: ["sea", "cove", "abyss"], lore: "When the moon is full, fishermen swear they hear it sing.", bestiaryHint: "Clear night, deep water." },
  Tideking:    { id: "Tideking", name: "Tide King", price: 950, rarity: "legendary", icon: "assets/images/fish/rubybream.png", minRodTier: 6, weightKg: [6.0, 14.0],
                 weatherBias: { storm: 1.8 },
                 fightStats: { pullStrength: 2.0, directionChangeFrequency: 0.55, escapeChance: 0.08, jerkChance: 0.4, hookWindowMs: 380, stages: 3 },
                 behaviors: ["legendary", "diver", "jerker"], baitPreference: ["bait_legendary"],
                 biomeTags: ["abyss", "sea"], lore: "A crowned predator of the deep abyss. Saltwater royalty.", bestiaryHint: "Abyss in a storm." },
  Glacierjaw:  { id: "Glacierjaw", name: "Glacierjaw", price: 880, rarity: "legendary", icon: "assets/images/fish/pufferfish.png", minRodTier: 6, weightKg: [5.0, 12.0],
                 weatherBias: { clear: 1.4 },
                 fightStats: { pullStrength: 1.85, directionChangeFrequency: 0.45, escapeChance: 0.07, jerkChance: 0.3, hookWindowMs: 420, stages: 2 },
                 behaviors: ["legendary", "diver"], biomeTags: ["frozen"], lore: "An ancient predator the frozen lake feeds in its silence.", bestiaryHint: "Sunny day on the frozen lake." },
  Slagsire:    { id: "Slagsire", name: "Slag Sire", price: 1100, rarity: "legendary", icon: "assets/images/fish/emeraldfish.png", minRodTier: 6, weightKg: [4.0, 10.0],
                 fightStats: { pullStrength: 1.9, directionChangeFrequency: 0.6, escapeChance: 0.1, jerkChance: 0.42, hookWindowMs: 400, stages: 3 },
                 behaviors: ["legendary", "jerker"], biomeTags: ["outflow"], lore: "Spawned from the runoff itself, scarred by what fed it.", bestiaryHint: "Only after the Outflow is cleared." },
  Rainshaper:  { id: "Rainshaper", name: "Rainshaper", price: 780, rarity: "legendary", icon: "assets/images/fish/leaffish.png", minRodTier: 5, weightKg: [3.5, 9.0],
                 weatherBias: { rain: 1.7, storm: 1.5 },
                 fightStats: { pullStrength: 1.7, directionChangeFrequency: 0.7, escapeChance: 0.1, jerkChance: 0.35, hookWindowMs: 420, stages: 2 },
                 behaviors: ["legendary", "runner"], biomeTags: ["rainforest"], lore: "Said to summon the storms that grow it.", bestiaryHint: "Rainforest river in a downpour." },
};

export const JUNK_DEFS: Record<string, JunkDef> = {
  animalbone:    { id: "animalbone", name: "Animal Bone", price: 2, rarity: "junk", junk: true, icon: "assets/images/junk/animalbone.png" },
  animalbone2:   { id: "animalbone2", name: "Old Bone", price: 2, rarity: "junk", junk: true, icon: "assets/images/junk/animalbone2.png" },
  barnacle:      { id: "barnacle", name: "Barnacle", price: 3, rarity: "junk", junk: true, icon: "assets/images/junk/barnacle.png" },
  emptybottle:   { id: "emptybottle", name: "Empty Bottle", price: 1, rarity: "junk", junk: true, icon: "assets/images/junk/emptybottle.png" },
  emptycan:      { id: "emptycan", name: "Empty Can", price: 1, rarity: "junk", junk: true, icon: "assets/images/junk/emptycan.png" },
  fishbone:      { id: "fishbone", name: "Fish Bone", price: 2, rarity: "junk", junk: true, icon: "assets/images/junk/fishbone.png" },
  garbage:       { id: "garbage", name: "Garbage", price: 1, rarity: "junk", junk: true, icon: "assets/images/junk/garbage.png" },
  lifebuoy:      { id: "lifebuoy", name: "Old Lifebuoy", price: 3, rarity: "junk", junk: true, icon: "assets/images/junk/lifebuoy.png" },
  messagebottle: { id: "messagebottle", name: "Message Bottle", price: 5, rarity: "junk", junk: true, icon: "assets/images/junk/messagebottle.png" },
  seashell:      { id: "seashell", name: "Seashell", price: 3, rarity: "junk", junk: true, icon: "assets/images/junk/seashell.png" },
  stick:         { id: "stick", name: "Driftwood Stick", price: 1, rarity: "junk", junk: true, icon: "assets/images/junk/stick.png" },
  waterbottle:   { id: "waterbottle", name: "Water Bottle", price: 1, rarity: "junk", junk: true, icon: "assets/images/junk/waterbottle.png" },
};

export const ALL_CATCH_DEFS: Record<string, FishDef | JunkDef> = { ...FISH_DEFS, ...JUNK_DEFS };
export const JUNK_POOL: string[] = Object.keys(JUNK_DEFS);

export function getCatch(id: string): FishDef | JunkDef | undefined {
  return ALL_CATCH_DEFS[id];
}

export function defaultFightStats(): FightStats { return { ...DEFAULT_FIGHT }; }
