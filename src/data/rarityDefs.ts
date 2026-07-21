/**
 * data/rarityDefs.ts — single source of truth for rarity presentation.
 * Colors, glow, particle tints, labels, sort weight and the celebratory
 * SFX cue per rarity. Consumed by FishingScene (catch cards), Inventory,
 * Bestiary and Quest UI so the whole game speaks one visual language.
 */
import { SFX } from "./audioKeys";

export type RarityId = "common" | "uncommon" | "rare" | "legendary" | "junk";

export interface RarityStyle {
  id: RarityId;
  label: string;
  /** CSS hex string for Text colors. */
  hex: string;
  /** 0xRRGGBB for Phaser GameObjects. */
  color: number;
  /** Glow / frame accent color. */
  glow: number;
  /** Particle burst tint. */
  particle: number;
  /** Sort weight — higher = rarer. */
  weight: number;
  /** Celebratory SFX key played on the catch card. */
  cardSfx: string;
  /** How big the catch celebration should feel (0..1). */
  hype: number;
}

export const RARITY_STYLES: Record<RarityId, RarityStyle> = {
  junk: {
    id: "junk", label: "Junk", hex: "#8a7a66", color: 0x8a7a66,
    glow: 0x6a5d4d, particle: 0x8a7a66, weight: 0, cardSfx: SFX.Splash, hype: 0.1,
  },
  common: {
    id: "common", label: "Common", hex: "#aab7bb", color: 0xaab7bb,
    glow: 0x7f9398, particle: 0xcfe0e4, weight: 1, cardSfx: SFX.Splash, hype: 0.25,
  },
  uncommon: {
    id: "uncommon", label: "Uncommon", hex: "#5fd66f", color: 0x5fd66f,
    glow: 0x2fae46, particle: 0x9bf0a6, weight: 2, cardSfx: SFX.Coin, hype: 0.5,
  },
  rare: {
    id: "rare", label: "Rare", hex: "#4d8bff", color: 0x4d8bff,
    glow: 0x2f5fd6, particle: 0x9cc0ff, weight: 3, cardSfx: SFX.LevelUp, hype: 0.78,
  },
  legendary: {
    id: "legendary", label: "Legendary", hex: "#ffc23d", color: 0xffc23d,
    glow: 0xff7a1a, particle: 0xffe28a, weight: 4, cardSfx: SFX.Thunder, hype: 1,
  },
};

export const RARITY_ORDER: RarityId[] = ["legendary", "rare", "uncommon", "common", "junk"];

export function rarityStyle(id: string): RarityStyle {
  return RARITY_STYLES[(id as RarityId)] ?? RARITY_STYLES.common;
}

export function rarityHex(id: string): string {
  return rarityStyle(id).hex;
}
