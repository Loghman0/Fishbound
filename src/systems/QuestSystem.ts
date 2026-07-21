/**
 * QuestSystem — Stage 2: typed quest progress driven by EventBus.
 * Progress is recomputed from PlayerState + memorized counters so the
 * system is stateless beyond the save file.
 */

import type { SaveSystem } from "./SaveSystem";
import type { EconomySystem } from "./EconomySystem";
import { QUEST_DEFS, type QuestDef } from "../data/questDefs";
import { EventBus } from "../core/EventBus";
import type { FishCaughtEvent, ShopSoldEvent, AreaEnteredEvent, BaitCraftedEvent } from "../core/EventBus";
import { ITEM_DEFS } from "../data/itemDefs";

export interface QuestStatus {
  def: QuestDef;
  progress: number;
  goal: number;
  completed: boolean;
  claimable: boolean;
  locked: boolean;
}

export class QuestSystem {
  /** Per-quest live counters that aren't easily recoverable from PlayerState. */
  private counters: Record<string, number> = {};

  constructor(private save: SaveSystem, private economy: EconomySystem) {
    EventBus.on("fish:caught", this.onCatch, this);
    EventBus.on("shop:sold", this.onSold, this);
    EventBus.on("area:entered", this.onArea, this);
    EventBus.on("bait:crafted", this.onCraft, this);
  }

  private onCatch = (e: FishCaughtEvent) => {
    void e;
    // Counters live on PlayerState (caught, caughtBiome, caughtRarity).
  };
  private onSold = (e: ShopSoldEvent) => {
    void e; // sellValue tracked via state.totalSoldValue in EconomySystem
  };
  private onArea = (e: AreaEnteredEvent) => {
    const s = this.save.state;
    if (!s.exploredMaps.includes(e.mapId)) s.exploredMaps.push(e.mapId);
  };
  private onCraft = (e: BaitCraftedEvent) => {
    void e;
    this.save.state.totalCrafted += 1;
  };

  list(): QuestStatus[] {
    const s = this.save.state;
    return QUEST_DEFS.map((def) => {
      const completed = s.completedQuests.includes(def.id);
      const locked = !!def.requires && !s.completedQuests.includes(def.requires);
      const progress = this.progressOf(def);
      const goal = def.goal;
      const claimable = !completed && !locked && progress >= goal;
      return { def, progress, goal, completed, claimable, locked };
    });
  }

  private progressOf(def: QuestDef): number {
    const s = this.save.state;
    if (def.progress) return def.progress(s);
    switch (def.kind) {
      case "catchSpecies": return s.caught[def.target ?? ""] ?? 0;
      case "catchInBiome": {
        const m = s.caughtBiome[def.target ?? ""];
        if (!m) return 0;
        return Object.values(m).reduce((a, b) => a + b, 0);
      }
      case "catchRarity": return s.caughtRarity[def.target ?? ""] ?? 0;
      case "sellValue": return s.totalSoldValue;
      case "explore": return s.exploredMaps.includes(def.target ?? "") ? 1 : 0;
      case "craftBait": return s.totalCrafted;
      case "rodTier": return s.rod;
      case "skillLevel": return s.skillLevel;
    }
    return 0;
  }

  claimAllReady(): QuestDef[] {
    const ready = this.list().filter((q) => q.claimable);
    for (const q of ready) {
      const r = q.def.reward;
      if (r.coins) this.economy.addCoins(r.coins);
      if (r.bait) this.save.state.bait += r.bait;
      if (r.baitItem && ITEM_DEFS[r.baitItem.id]) {
        const inv = this.save.state.inventory;
        inv[r.baitItem.id] = (inv[r.baitItem.id] ?? 0) + r.baitItem.qty;
      }
      if (r.skillXp) this.save.state.skillXp += r.skillXp;
      if (r.permLuck) this.save.state.permLuck += r.permLuck;
      if (r.permTension) this.save.state.permTension += r.permTension;
      if (r.title && !this.save.state.titles.includes(r.title)) this.save.state.titles.push(r.title);
      if (r.flag) this.save.state.flags[r.flag] = true;
      this.save.state.completedQuests.push(q.def.id);
      EventBus.emit("quest:complete", q.def.id);
    }
    return ready.map((q) => q.def);
  }
}
