/**
 * EconomySystem — coins, selling, rod/boat purchases + sellValue tracking.
 */

import type { SaveSystem } from "./SaveSystem";
import type { InventorySystem } from "./InventorySystem";
import { getRod } from "../data/rodDefs";
import { ROD_MAX, BAIT_PACK_COST, BAIT_PACK_AMOUNT } from "../core/Constants";
import { EventBus } from "../core/EventBus";

export class EconomySystem {
  constructor(private save: SaveSystem, private inv: InventorySystem) { }

  get coins(): number { return this.save.state.coins; }

  addCoins(n: number): void {
    const s = this.save.state;
    s.coins = Math.max(0, s.coins + n);
    if (n > 0) s.totalEarned += n;
  }

  sellAll(): { sold: number; earned: number } {
    let sold = 0;
    let earned = 0;
    for (const e of this.inv.list()) {
      if (e.kind === "item") continue;
      sold += e.qty;
      earned += e.qty * e.unitValue;
      this.inv.remove(e.id, e.qty);
    }
    if (earned > 0) this.addCoins(earned);
    this.save.state.totalSold += sold;
    this.save.state.totalSoldValue += earned;
    if (sold > 0) EventBus.emit("shop:sold", { count: sold, earned });
    return { sold, earned };
  }

  canBuyRod(): boolean {
    const s = this.save.state;
    if (s.rod >= ROD_MAX) return false;
    return s.coins >= getRod(s.rod + 1).cost;
  }
  buyRod(): boolean {
    if (!this.canBuyRod()) return false;
    const next = getRod(this.save.state.rod + 1);
    this.save.state.coins -= next.cost;
    this.save.state.rod = next.id;
    this.save.state.rodDurability = next.durability;
    return true;
  }

  buyBait(): boolean {
    const s = this.save.state;
    if (s.coins < BAIT_PACK_COST) return false;
    s.coins -= BAIT_PACK_COST;
    s.bait += BAIT_PACK_AMOUNT;
    s.inventory.bait = (s.inventory.bait ?? 0) + BAIT_PACK_AMOUNT;
    return true;
  }

  /** Daily-stock multiplier seeded by in-game day. */
  dailyStockMult(): number {
    const seed = this.save.state.day;
    const r = (Math.sin(seed * 12.9898) * 43758.5453) % 1;
    return 0.85 + Math.abs(r) * 0.4; // 0.85..1.25
  }
}
