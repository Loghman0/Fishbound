/**
 * data/itemDefs.ts — bait variants + craft components + consumables.
 * Phase 4: snack items with a `consumable: { stamina }` payload.
 */

export type ItemEffect = "stamina" | "bait" | "lure";

export interface ItemDef {
  id: string;
  name: string;
  desc: string;
  stackable: boolean;
  icon: string;
  effect?: ItemEffect;
  value?: number;
  /** Bonus to luck while equipped/used (additive). */
  luck?: number;
  /** Bias toward a rarity tier. */
  rarityBias?: Partial<Record<"common" | "uncommon" | "rare" | "legendary", number>>;
  /** Reduce fish escape and jerk chance multiplicatively. */
  calm?: number;
  /** Tag used by crafting recipes. */
  tag?: "bait" | "consumable" | "material";
  /** Phase 4 — consumable payload (eat from inventory). */
  consumable?: { stamina?: number };
}


export const ITEM_DEFS: Record<string, ItemDef> = {
  bait: {
    id: "bait", name: "Bait", desc: "Standard worm bait. Slightly raises catch rate.",
    stackable: true, icon: "assets/images/ui/coin.png",
    effect: "bait", value: 1, luck: 0.02, tag: "bait",
  },
  bait_glow: {
    id: "bait_glow", name: "Glow Bait", desc: "Attracts night-active fish.",
    stackable: true, icon: "assets/images/ui/coin.png",
    effect: "bait", value: 1, luck: 0.04, tag: "bait",
    rarityBias: { uncommon: 1.4, rare: 1.2 },
  },
  bait_pro: {
    id: "bait_pro", name: "Pro Bait", desc: "Crafted lure. Big rarity bias.",
    stackable: true, icon: "assets/images/ui/coin.png",
    effect: "bait", value: 1, luck: 0.07, tag: "bait",
    rarityBias: { rare: 1.6, legendary: 1.4 },
    calm: 0.85,
  },
  bait_legendary: {
    id: "bait_legendary", name: "Sea-King Lure", desc: "Whispered to draw legends.",
    stackable: true, icon: "assets/images/ui/coin.png",
    effect: "bait", value: 1, luck: 0.12, tag: "bait",
    rarityBias: { legendary: 2.5, rare: 1.4 },
    calm: 0.7,
  },
  // ── Consumable snacks (Phase 4) ─────────────────────────────
  snack_jerky: {
    id: "snack_jerky", name: "Smoked Jerky", desc: "Restores 25 stamina.",
    stackable: true, icon: "assets/images/ui/coin.png",
    tag: "consumable", consumable: { stamina: 25 },
  },
  snack_biscuit: {
    id: "snack_biscuit", name: "Sea Biscuit", desc: "Restores 15 stamina.",
    stackable: true, icon: "assets/images/ui/coin.png",
    tag: "consumable", consumable: { stamina: 15 },
  },
  snack_chowder: {
    id: "snack_chowder", name: "Hot Chowder", desc: "Restores 50 stamina.",
    stackable: true, icon: "assets/images/ui/coin.png",
    tag: "consumable", consumable: { stamina: 50 },
  },
};

