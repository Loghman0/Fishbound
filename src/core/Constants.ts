/**
 * Constants.ts — Central tuning + identifiers.
 * Ported from original constants.js, all numbers tweakable here.
 * NO magic numbers in systems; everything that matters lives here or in /data.
 */

// ── Canvas & Tile Grid ─────────────────────────────────────────
export const TILE = 32;
export const CANVAS_W = 640;
export const CANVAS_H = 480;
export const MAP_W = 20;
export const MAP_H = 15;

// ── Gameplay Tuning ────────────────────────────────────────────
export const BASE_STAMINA = 100;
export const FISHING_STAMINA_COST = 10;
export const FISHING_BAR_MAX = 500;

export const ROD_ZONE_BASE = 62;
export const ROD_ZONE_PER_LEVEL = 22;
export const BAIT_ZONE_BONUS = 14;
export const FISHING_SPEED_BASE = 230;
export const FISHING_SPEED_RANDOM = 80;

export const BAIT_PACK_COST = 12;
export const BAIT_PACK_AMOUNT = 10;

// ── Save & Versioning ──────────────────────────────────────────
export const SAVE_VERSION = 2;
export const SAVE_KEY_PREFIX = "fishbound2.save";
export const SAVE_SLOTS = 3;

// ── Audio / UI ─────────────────────────────────────────────────
export const AUDIO_MASTER_GAIN = 0.5;
export const TOAST_DURATION_MS = 2200;
export const INTERACT_DIST = 28;

// ── Rod tiers ──────────────────────────────────────────────────
export const ROD_MAX = 7;
export const ROD_NAMES: Record<number, string> = {
  1: "Wooden Rod",
  2: "Bamboo Rod",
  3: "Fiberglass Rod",
  4: "Carbon Rod",
  5: "Abyss Rod",
  6: "Magma Rod",
  7: "Golden Rod",
};

// Upgrade cost INTO tier N (from N-1)
export const ROD_COSTS: Record<number, number> = {
  2: 60, 3: 160, 4: 380, 5: 900, 6: 2100, 7: 5000,
};

// ── Boat tiers ─────────────────────────────────────────────────
export const BOAT_NONE = 0;
export const BOAT_MAX = 7;
export const BOAT_NAMES: Record<number, string> = {
  0: "On Foot", 1: "Rowboat", 2: "Dinghy", 3: "Skiff",
  4: "Cutter", 5: "Sailboat", 6: "Trawler", 7: "Frigate",
};
export const BOAT_COSTS: Record<number, number> = {
  1: 150, 2: 380, 3: 800, 4: 1700, 5: 3500, 6: 7000, 7: 14000,
};

// ── Scene keys ─────────────────────────────────────────────────
export const SCENE = {
  Boot: "BootScene",
  Preload: "PreloadScene",
  MainMenu: "MainMenuScene",
  Overworld: "OverworldScene",
  Fishing: "FishingScene",
  Shop: "ShopScene",
  Inventory: "InventoryScene",
  Bestiary: "BestiaryScene",
  QuestLog: "QuestLogScene",
  Settings: "SettingsScene",
  SaveSlots: "SaveSlotsScene",
  Wardrobe: "WardrobeScene",
  PauseMenu: "PauseMenuScene",
} as const;

// ── Time / Weather ─────────────────────────────────────────────
export const DAY_LENGTH_SECONDS = 480; // 8 in-game minutes = 1 real minute? configurable
export const TIME_PHASES = ["dawn", "day", "dusk", "night"] as const;
export type TimePhase = (typeof TIME_PHASES)[number];

// ── Input keys (string for documentation) ──────────────────────
export const KEYS = {
  MoveUp: ["W", "UP"],
  MoveDown: ["S", "DOWN"],
  MoveLeft: ["A", "LEFT"],
  MoveRight: ["D", "RIGHT"],
  Interact: ["SPACE", "E"],
  Inventory: ["I"],
  QuestLog: ["Q"],
  Shop: ["B"],
  QuickSave: ["F5"],
  QuickLoad: ["F9"],
  Back: ["ESC"],
} as const;
