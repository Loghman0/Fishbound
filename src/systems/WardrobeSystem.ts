/**
 * WardrobeSystem — owns the player's currently equipped cosmetic.
 * Reads/writes to PlayerState.equippedCosmetic; falls back to "fisherman".
 *
 * Decoupled from rendering: emits "wardrobe:changed" via EventBus, the
 * Player entity listens and swaps its animation prefix.
 */
import { EventBus } from "../core/EventBus";
import type { SaveSystem } from "./SaveSystem";
import { COSMETIC_DEFS, getCosmetic } from "../data/cosmeticDefs";

export class WardrobeSystem {
  constructor(private save: SaveSystem) {}

  current(): string { return this.save.state.equippedCosmetic ?? "fisherman"; }
  list(): string[] { return Object.keys(COSMETIC_DEFS); }
  isUnlocked(id: string): boolean {
    if (id === "fisherman") return true;
    return !!this.save.state.flags?.[`cosmetic.${id}`];
  }
  unlock(id: string): void {
    if (!this.save.state.flags) this.save.state.flags = {};
    this.save.state.flags[`cosmetic.${id}`] = true;
  }
  equip(id: string): boolean {
    if (!this.isUnlocked(id)) return false;
    this.save.state.equippedCosmetic = id;
    EventBus.emit("wardrobe:changed", { id, def: getCosmetic(id) });
    return true;
  }
}
