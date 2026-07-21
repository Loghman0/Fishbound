/**
 * cosmeticDefs.ts — Wardrobe catalog. Each cosmetic swaps the player's
 * spritesheet for one of the existing character variants in
 * public/assets/images/characters/. Adding a new outfit = one line here.
 */
import { IMG } from "./assetKeys";

export interface CosmeticDef {
  id: string;
  name: string;
  description: string;
  /** Animation prefix that this cosmetic uses (e.g. "fisherman", "graverobber"). */
  animPrefix: string;
  /** Fallback texture key for static states if no anim exists. */
  fallbackTexture: string;
  unlockCost?: number;
}

export const COSMETIC_DEFS: Record<string, CosmeticDef> = {
  fisherman: {
    id: "fisherman",
    name: "Fisherman",
    description: "Your honest, weather-worn self.",
    animPrefix: "fisherman",
    fallbackTexture: IMG.FishermanIdle,
  },
};

export function getCosmetic(id?: string | null): CosmeticDef {
  return (id && COSMETIC_DEFS[id]) || COSMETIC_DEFS.fisherman!;
}
