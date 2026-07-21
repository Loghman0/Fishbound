/**
 * InventorySystem — counts + weight + Phase 4 "consume" action for
 * stamina-restoring fish and snacks.
 */

import type { SaveSystem } from "./SaveSystem";
import { getCatch, ALL_CATCH_DEFS, FISH_DEFS } from "../data/fishDefs";
import { ITEM_DEFS } from "../data/itemDefs";
import { FISH_STAMINA_BASE, FISH_STAMINA_PER_KG } from "../core/Balance";


export type ItemKind = "fish" | "junk" | "item";

export interface InventoryEntry {
  id: string;
  kind: ItemKind;
  name: string;
  qty: number;
  unitValue: number;
  icon: string;
}

const WEIGHT_PER_FISH = 0.4; // arbitrary stage-1 weight unit
const WEIGHT_PER_JUNK = 0.2;
const WEIGHT_PER_ITEM = 0.05;

export class InventorySystem {
  constructor(private save: SaveSystem) {}

  add(id: string, qty = 1): void {
    const inv = this.save.state.inventory;
    inv[id] = (inv[id] ?? 0) + qty;
  }

  remove(id: string, qty = 1): boolean {
    const inv = this.save.state.inventory;
    const have = inv[id] ?? 0;
    if (have < qty) return false;
    inv[id] = have - qty;
    if (inv[id] <= 0) delete inv[id];
    return true;
  }

  count(id: string): number {
    return this.save.state.inventory[id] ?? 0;
  }

  list(): InventoryEntry[] {
    const out: InventoryEntry[] = [];
    for (const [id, qty] of Object.entries(this.save.state.inventory)) {
      if (!qty) continue;
      const c = ALL_CATCH_DEFS[id];
      const it = ITEM_DEFS[id];
      if (c) {
        out.push({
          id,
          kind: (c as any).junk ? "junk" : "fish",
          name: c.name,
          qty,
          unitValue: c.price,
          icon: c.icon,
        });
      } else if (it) {
        out.push({
          id,
          kind: "item",
          name: it.name,
          qty,
          unitValue: 0,
          icon: it.icon,
        });
      }
    }
    return out;
  }

  totalWeight(): number {
    let w = 0;
    for (const e of this.list()) {
      const per =
        e.kind === "fish" ? WEIGHT_PER_FISH :
        e.kind === "junk" ? WEIGHT_PER_JUNK : WEIGHT_PER_ITEM;
      w += per * e.qty;
    }
    return Math.round(w * 10) / 10;
  }

  totalSellValue(): number {
    return this.list()
      .filter((e) => e.kind !== "item")
      .reduce((sum, e) => sum + e.qty * e.unitValue, 0);
  }

  /** Convenience: resolve a catch id's display name. */
  nameOf(id: string): string {
    return getCatch(id)?.name ?? ITEM_DEFS[id]?.name ?? id;
  }

  /**
   * Phase 4 — compute stamina restored when consuming an inventory id.
   * - Items with a `consumable.stamina` value return that value directly.
   * - Fish use the FISH_STAMINA_BASE + FISH_STAMINA_PER_KG * midpoint
   *   formula so heavier catches feed more. Junk and unknown ids return 0.
   */
  consumableStamina(id: string): number {
    const item = ITEM_DEFS[id];
    if (item?.consumable?.stamina) return item.consumable.stamina;
    const fish = FISH_DEFS[id];
    if (fish && fish.rarity !== "junk") {
      const [lo, hi] = fish.weightKg ?? [0.2, 0.6];
      const mid = (lo + hi) / 2;
      return Math.max(1, Math.round(FISH_STAMINA_BASE + FISH_STAMINA_PER_KG * mid));
    }
    return 0;
  }

  /**
   * Consume one stack-unit of `id` and return how much stamina it grants
   * (0 if the item is not consumable). The caller is responsible for
   * applying the stamina to the player.
   */
  consume(id: string): number {
    const amount = this.consumableStamina(id);
    if (amount <= 0) return 0;
    if (!this.remove(id, 1)) return 0;
    return amount;
  }
}

