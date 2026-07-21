/**
 * data/mapDefs.ts — Stage 3: 9 biome/maps with ambient audio, music,
 * pollution flag (SteamMan story), flavor lines, biome tag filtering.
 */

export interface PortalDef {
  x: number; y: number; w: number; h: number;
  to: string;
  needBoat: number;
  label: string;
  hidden?: boolean;
}

export interface RectDef { x: number; y: number; w: number; h: number; label?: string }

export interface BiomeModifiers {
  rarity?: Partial<Record<"common" | "uncommon" | "rare" | "legendary", number>>;
  tensionMult?: number;
  reelMult?: number;
}

export type BiomeId =
  | "pond" | "river" | "rainforest" | "cove" | "sea" | "abyss" | "frozen" | "outflow";

export interface MapDef {
  id: string;
  name: string;
  bg: string;
  tilemapKey?: string;
  depth: number;
  water: RectDef[];
  sand: RectDef[];
  shop?: RectDef | null;
  workbench?: RectDef | null;
  home?: RectDef | null;
  portals: PortalDef[];
  fish: string[];
  rare: string[];
  legendary?: string[];
  npcs: string[];
  modifiers?: BiomeModifiers;
  biome?: BiomeId;
  ambientKey?: string;
  musicKey?: string;
  /** 0 = clean, 1 = polluted (debuffs rare odds until cleared via narrative quest). */
  pollution?: number;
  flavor?: string;
}

export const MAP_DEFS: Record<string, MapDef> = {
  xerite: {
    id: "xerite", name: "Driftwood Harbor", bg: "#1a2d3a", tilemapKey: "map.xerite",
    depth: 0,
    water: [],
    sand: [],
    portals: [],
    fish: ["Minnow", "Bluegill", "Pinkperch", "Sandwhiting", "Crystaltrout", "Rockfish", "Emeraldfish"],
    rare: ["Goldfish", "Emeraldfish", "Rubybream", "Angelfish"],
    legendary: ["Moonfish", "Tideking"],
    npcs: [],
    modifiers: {},
    biome: "cove", ambientKey: "amb.wind", musicKey: "mus.village",
    flavor: "A weathered harbor where sea legends drift in with the tide.",
  }
};

export function getMap(id: string): MapDef {
  return MAP_DEFS[id] ?? MAP_DEFS.xerite!;
}

export const BIOMES: BiomeId[] = ["cove"];
