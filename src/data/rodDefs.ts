/**
 * data/rodDefs.ts — 7-tier rod progression with Stage 2 stats.
 * Effects feed FishingSystem (power, luck, tension tolerance, specials).
 */

import { ROD_NAMES, ROD_COSTS, ROD_ZONE_BASE, ROD_ZONE_PER_LEVEL } from "../core/Constants";

export type RodSpecial = "glowAtNight" | "stormProof" | "luckyHook" | "ironLine" | "auto";

export interface RodDef {
  id: number;
  name: string;
  cost: number;
  catchZone: number;
  reelSpeedMult: number;
  rareBonus: number;
  /** Multiplier on player reel-progress per second. */
  power: number;
  /** Additive luck bias to rare picks. */
  luck: number;
  /** How much tension headroom before snap. 0..30. */
  tensionTolerance: number;
  /** Max durability hits before warning. */
  durability: number;
  specials: RodSpecial[];
  icon: string;
}

const ICONS: Record<number, string> = {
  1: "assets/images/rods/wooden_rod.png",
  2: "assets/images/rods/bamboo_rod.png",
  3: "assets/images/rods/fiberglass_rod.png",
  4: "assets/images/rods/carbon_rod.png",
  5: "assets/images/rods/abyss_rod.png",
  6: "assets/images/rods/magma_rod.png",
  7: "assets/images/rods/golden_rod.png",
};

const SPECIALS: Record<number, RodSpecial[]> = {
  1: [], 2: [], 3: ["luckyHook"],
  4: ["luckyHook", "ironLine"],
  5: ["glowAtNight", "ironLine"],
  6: ["glowAtNight", "stormProof", "ironLine"],
  7: ["glowAtNight", "stormProof", "luckyHook", "ironLine", "auto"],
};

export const ROD_DEFS: Record<number, RodDef> = Object.fromEntries(
  [1, 2, 3, 4, 5, 6, 7].map((tier) => [
    tier,
    {
      id: tier,
      name: ROD_NAMES[tier] ?? `Rod ${tier}`,
      cost: ROD_COSTS[tier] ?? 0,
      catchZone: ROD_ZONE_BASE + (tier - 1) * ROD_ZONE_PER_LEVEL,
      reelSpeedMult: 1 + (tier - 1) * 0.08,
      rareBonus: (tier - 1) * 0.02,
      power: 1 + (tier - 1) * 0.12,
      luck: (tier - 1) * 0.015,
      tensionTolerance: (tier - 1) * 4,
      durability: 30 + (tier - 1) * 12,
      specials: SPECIALS[tier] ?? [],
      icon: ICONS[tier] ?? "",
    },
  ]),
) as Record<number, RodDef>;

export function getRod(tier: number): RodDef {
  return ROD_DEFS[tier] ?? ROD_DEFS[1]!;
}
