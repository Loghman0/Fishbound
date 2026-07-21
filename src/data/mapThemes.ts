/**
 * data/mapThemes.ts — per-map visual identity. Gives every map a distinct
 * palette, scattered decoration set (existing object art) and an ambient
 * particle effect, so no two locations feel the same. Purely presentational;
 * nothing here touches the save format.
 */
import type { BiomeId } from "./mapDefs";

export type DecorFx = "none" | "leaves" | "snow" | "embers" | "fireflies" | "pollen" | "mist" | "bubbles";

export interface MapTheme {
  /** Base land color. */
  grass: number;
  /** Secondary land speckle color for texture. */
  grassAlt: number;
  sand: number;
  /** Surface water color. */
  water: number;
  /** Deep water (fishing screen + speckle). */
  waterDeep: number;
  /** Ambient particle FX. */
  fx: DecorFx;
  /** Decoration asset keys (see DECOR_IMAGES) scattered on land tiles. */
  decor: string[];
  /** 0..1 chance a land tile receives a decoration. */
  decorDensity: number;
  /** Short ambience caption shown briefly on entry. */
  caption: string;
}

const BIOME_THEMES: Record<BiomeId, MapTheme> = {
  pond: {
    grass: 0x86c06f, grassAlt: 0x7bb564, sand: 0xe8c98a, water: 0x4f93b8, waterDeep: 0x244a63,
    fx: "fireflies", decor: ["decor.bush1", "decor.flower1", "decor.grass1", "decor.tree2"],
    decorDensity: 0.1, caption: "Frogs, dragonflies, the smell of mud.",
  },
  river: {
    grass: 0x6fb56e, grassAlt: 0x63a662, sand: 0xd8c486, water: 0x3f86c1, waterDeep: 0x1d4364,
    fx: "leaves", decor: ["decor.tree1", "decor.rock1", "decor.log", "decor.bush2"],
    decorDensity: 0.12, caption: "Cold water, mossy stones, ancient flow.",
  },
  rainforest: {
    grass: 0x3f6b3b, grassAlt: 0x355c32, sand: 0x9c8c5a, water: 0x2f6b54, waterDeep: 0x123a2c,
    fx: "pollen", decor: ["decor.tree1", "decor.tree3", "decor.bush3", "decor.mushroom1", "decor.log"],
    decorDensity: 0.2, caption: "Wet leaves. Distant howler calls.",
  },
  cove: {
    grass: 0x86c06f, grassAlt: 0x9ccf86, sand: 0xe8c98a, water: 0x2f8fa6, waterDeep: 0x134653,
    fx: "mist", decor: ["decor.grass2", "decor.flower2", "decor.rock2", "decor.bush1"],
    decorDensity: 0.09, caption: "Gulls and lapping water.",
  },
  sea: {
    grass: 0xd8b66f, grassAlt: 0xe6c987, sand: 0xe8d29a, water: 0x2b6fb0, waterDeep: 0x0f3a66,
    fx: "mist", decor: ["decor.rock1", "decor.rock3", "decor.stick"],
    decorDensity: 0.05, caption: "The horizon refuses to stay still.",
  },
  abyss: {
    grass: 0x1c2a55, grassAlt: 0x222f5e, sand: 0x2a2f48, water: 0x122a52, waterDeep: 0x060f2c,
    fx: "bubbles", decor: ["decor.rock3", "decor.rock2"],
    decorDensity: 0.05, caption: "Cold. Quiet. Watching.",
  },
  frozen: {
    grass: 0xcfe6f0, grassAlt: 0xdff0f7, sand: 0xbcd6e0, water: 0x6fb0d6, waterDeep: 0x356d96,
    fx: "snow", decor: ["decor.rock2", "decor.stick", "decor.rock1"],
    decorDensity: 0.07, caption: "The wind is the only thing that moves.",
  },
  outflow: {
    grass: 0x3a3030, grassAlt: 0x463837, sand: 0x6a5238, water: 0xa6622f, waterDeep: 0x5e3318,
    fx: "embers", decor: ["decor.rock3", "decor.stick", "decor.log"],
    decorDensity: 0.08, caption: "Rust-orange water, hissing pipes.",
  },
};

/** Per-map overrides so maps in the same biome still feel different. */
const MAP_OVERRIDES: Record<string, Partial<MapTheme>> = {
  sample_cove: { fx: "none", caption: "A quiet cove where every angler begins." },
  hidden_cove: {
    water: 0x2f7aa6, waterDeep: 0x123a55, fx: "fireflies",
    caption: "A cove no map knows. The water hums after dark.",
  },
  pond: { fx: "fireflies" },
  deep_abyss: { fx: "bubbles", decorDensity: 0.04 },
};

export function getTheme(mapId: string, biome?: BiomeId): MapTheme {
  const base = BIOME_THEMES[(biome ?? "cove")] ?? BIOME_THEMES.cove;
  const ov = MAP_OVERRIDES[mapId];
  return ov ? { ...base, ...ov } : base;
}
