/**
 * assetKeys.ts — single registry for every asset key + URL used by Phaser.
 * Adding a new asset = one line here, then it's available everywhere.
 */

export const IMG = {
  // Characters (48x48 frames)
  FishermanIdle:   "char.fisherman.idle",
  FishermanWalk:   "char.fisherman.walk",
  FishermanFish:   "char.fisherman.fish",
  FishermanHook:   "char.fisherman.hook",
  FishermanRow:    "char.fisherman.row",
  FishermanAttack: "char.fisherman.attack",
  FishermanHurt:   "char.fisherman.hurt",
  FishermanDeath:  "char.fisherman.death",

  // UI
  Coin: "ui.coin",
} as const;

export interface SpriteSheetSpec {
  key: string;
  url: string;
  frameW: number;
  frameH: number;
  frames: number; // total frames
}

/** Fisherman animation sheets — 48x48 frames horizontally. */
export const FISHERMAN_SHEETS: SpriteSheetSpec[] = [
  { key: IMG.FishermanIdle,   url: "assets/images/characters/Fisherman_idle.png",   frameW: 48, frameH: 48, frames: 4 },
  { key: IMG.FishermanWalk,   url: "assets/images/characters/Fisherman_walk.png",   frameW: 48, frameH: 48, frames: 6 },
  { key: IMG.FishermanFish,   url: "assets/images/characters/Fisherman_fish.png",   frameW: 48, frameH: 48, frames: 4 },
  { key: IMG.FishermanHook,   url: "assets/images/characters/Fisherman_hook.png",   frameW: 48, frameH: 48, frames: 6 },
  { key: IMG.FishermanRow,    url: "assets/images/characters/Fisherman_row.png",    frameW: 48, frameH: 48, frames: 4 },
  { key: IMG.FishermanAttack, url: "assets/images/characters/Fisherman_attack.png", frameW: 48, frameH: 48, frames: 6 },
  { key: IMG.FishermanHurt,   url: "assets/images/characters/Fisherman_hurt.png",   frameW: 48, frameH: 48, frames: 2 },
  { key: IMG.FishermanDeath,  url: "assets/images/characters/Fisherman_death.png",  frameW: 48, frameH: 48, frames: 6 },
];

/** Mapping animation name -> sheet key + frame range. */
export interface AnimSpec {
  key: string;     // unique anim name registered to AnimationManager
  sheet: string;   // asset key
  frameRate: number;
  repeat: number;  // -1 for loop
  start?: number;
  end?: number;
}

export const FISHERMAN_ANIMS: AnimSpec[] = [
  { key: "fisherman.idle",   sheet: IMG.FishermanIdle,   frameRate: 4,  repeat: -1 },
  { key: "fisherman.walk",   sheet: IMG.FishermanWalk,   frameRate: 10, repeat: -1 },
  { key: "fisherman.fish",   sheet: IMG.FishermanFish,   frameRate: 6,  repeat: -1 },
  { key: "fisherman.hook",   sheet: IMG.FishermanHook,   frameRate: 10, repeat: 0 },
  { key: "fisherman.row",    sheet: IMG.FishermanRow,    frameRate: 8,  repeat: -1 },
  { key: "fisherman.attack", sheet: IMG.FishermanAttack, frameRate: 12, repeat: 0 },
  { key: "fisherman.hurt",   sheet: IMG.FishermanHurt,   frameRate: 6,  repeat: 0 },
  { key: "fisherman.death",  sheet: IMG.FishermanDeath,  frameRate: 8,  repeat: 0 },
];

/**
 * Decoration images (existing object art) scattered across the overworld to
 * give each map a distinct look. key -> url. Loaded by AssetManager.
 */
export const DECOR_IMAGES: Array<[string, string]> = [
  ["decor.tree1",     "assets/images/objects/Tree1.png"],
  ["decor.tree2",     "assets/images/objects/Tree2.png"],
  ["decor.tree3",     "assets/images/objects/Tree3.png"],
  ["decor.rock1",     "assets/images/objects/Rock1.1.png"],
  ["decor.rock2",     "assets/images/objects/Rock2.1.png"],
  ["decor.rock3",     "assets/images/objects/Rock3.1.png"],
  ["decor.bush1",     "assets/images/objects/Bush1.1.png"],
  ["decor.bush2",     "assets/images/objects/Bush2.1.png"],
  ["decor.bush3",     "assets/images/objects/Bush3.1.png"],
  ["decor.flower1",   "assets/images/objects/Flower_patch1.png"],
  ["decor.flower2",   "assets/images/objects/Flower_patch3.png"],
  ["decor.mushroom1", "assets/images/objects/Mushroom1.1.png"],
  ["decor.grass1",    "assets/images/objects/Grass1.png"],
  ["decor.grass2",    "assets/images/objects/Grass3.png"],
  ["decor.log",       "assets/images/objects/Log_horizontal.png"],
  ["decor.stick",     "assets/images/objects/Stick1.1.png"],
];
