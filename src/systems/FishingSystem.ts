/**
 * FishingSystem — Stage 2 multi-phase mini-game brain.
 *
 *   pickFish(power, accuracy) -> { def, hookChance, biome }
 *   resolveCatch(def, weight) -> commits to inventory + emits events
 *   resolveLost(def, reason)  -> emits fish:lost
 *   bestBait()                -> resolves which bait item to consume
 *
 * The actual UI/simulation runs in FishingScene; this class provides the
 * deterministic "what fish, what stats, what bonuses" lookups.
 */

import type { SaveSystem } from "./SaveSystem";
import type { InventorySystem } from "./InventorySystem";
import type { TimeWeatherSystem } from "./TimeWeatherSystem";
import { getMap } from "../data/mapDefs";
import { JUNK_POOL, ALL_CATCH_DEFS, FISH_DEFS, defaultFightStats } from "../data/fishDefs";
import type { FishDef, FightStats } from "../data/fishDefs";
import { ITEM_DEFS } from "../data/itemDefs";
import { getRod } from "../data/rodDefs";
import { HOOK_BASE_CHANCE, SKILL_LUCK_PER_LEVEL, SKILL_TENSION_TOL_PER_LEVEL, SKILL_XP_PER_CATCH, SKILL_XP_TO_LEVEL } from "../core/Balance";
import { EventBus } from "../core/EventBus";

/** Nocturnal fish only available when timeOfDay === 'evening'. */
const NOCTURNAL_FISH = ["Moonfish", "Neonfish", "Rubybream", "Crystaltrout", "Angelfish"];

export interface PickResult {
  isJunk: boolean;
  junkId?: string;
  fishId?: string;
  def?: FishDef;
  fightStats: FightStats;
  hookChance: number;
  hookWindowMs: number;
  biome: string;
  baitUsed?: string;
}

export interface CatchResult {
  isJunk: boolean;
  id: string;
  name: string;
  rarity: string;
  weightKg: number;
  value: number;
  isNewSpecies: boolean;
  isRecord: boolean;
  isHeaviest: boolean;
  streak: number;
  streakBonus: number;
}

export interface ContextStats {
  rodPower: number;
  rodLuck: number;
  rodTensionTol: number;
  baitLuck: number;
  baitCalm: number;
  rarityBias: Partial<Record<string, number>>;
  tensionMult: number;
  reelMult: number;
  skillLuck: number;
  skillTensionTol: number;
  weather: string;
  phase: string;
  weight: number;
}

export class FishingSystem {
  constructor(
    private save: SaveSystem,
    private inv: InventorySystem,
    private time?: TimeWeatherSystem,
    private registry?: Phaser.Data.DataManager,
  ) { }

  setTime(t: TimeWeatherSystem) { this.time = t; }
  setRegistry(r: Phaser.Data.DataManager) { this.registry = r; }

  /** Returns 'morning' or 'evening' from the shared game registry. */
  private getTimeOfDay(): string {
    return (this.registry?.get("timeOfDay") as string) ?? "morning";
  }

  /** Compute every multiplier this attempt cares about. */
  buildContext(): ContextStats {
    const s = this.save.state;
    const rod = getRod(s.rod);
    const map = getMap(s.mapId);
    const phase = this.time?.state.phase ?? "day";
    const weather = this.time?.state.weather ?? "clear";

    // Best bait we have (consumed only on attempt commit, not on pick)
    const bait = this.bestBait();
    const baitDef = bait ? ITEM_DEFS[bait] : undefined;

    const skill = s.skillLevel ?? 1;
    const tod = this.getTimeOfDay();
    // Evening: bump rare + legendary odds
    const todRarityBias: Partial<Record<string, number>> = tod === "evening"
      ? { rare: 1.5, legendary: 1.8, uncommon: 1.2 }
      : {};
    return {
      rodPower: rod.power,
      rodLuck: rod.luck,
      rodTensionTol: rod.tensionTolerance + s.permTension,
      baitLuck: baitDef?.luck ?? 0,
      baitCalm: baitDef?.calm ?? 1,
      rarityBias: { ...(map.modifiers?.rarity ?? {}), ...todRarityBias, ...this.weatherRarityBias(weather, baitDef) },
      tensionMult: map.modifiers?.tensionMult ?? 1,
      reelMult: map.modifiers?.reelMult ?? 1,
      skillLuck: (skill - 1) * SKILL_LUCK_PER_LEVEL + s.permLuck,
      skillTensionTol: (skill - 1) * SKILL_TENSION_TOL_PER_LEVEL,
      weather, phase,
      weight: this.inv.totalWeight(),
    };
  }

  private weatherRarityBias(w: string, baitDef?: { rarityBias?: Partial<Record<string, number>> }): Partial<Record<string, number>> {
    const out: Partial<Record<string, number>> = {};
    if (w === "rain") out.uncommon = (out.uncommon ?? 1) * 1.1;
    if (w === "storm") { out.rare = (out.rare ?? 1) * 1.2; out.legendary = (out.legendary ?? 1) * 1.3; }
    if (baitDef?.rarityBias) for (const [k, v] of Object.entries(baitDef.rarityBias))
      out[k] = (out[k] ?? 1) * (v as number);
    return out;
  }

  bestBait(): string | undefined {
    const inv = this.save.state.inventory;
    const order = ["bait_legendary", "bait_pro", "bait_glow", "bait"];
    for (const id of order) if ((inv[id] ?? 0) > 0) return id;
    return undefined;
  }

  /**
   * Pick the catch outcome from a cast. Power/accuracy are 0..1.
   * Junk chance is reduced by good cast + rod/skill luck.
   */
  pickFish(power: number, accuracy: number): PickResult {
    const ctx = this.buildContext();
    const s = this.save.state;
    const rod = getRod(s.rod);
    const map = getMap(s.mapId);
    const phase = ctx.phase;
    const tod = this.getTimeOfDay();

    // Junk chance — strongly reduced by rod power and quality of cast.
    const totalLuck = ctx.rodLuck + ctx.skillLuck + ctx.baitLuck;
    const rodPowerNorm = (rod.power - 1) / 0.84; // 0 .. ~1 across tiers 1..7
    const junkChance = Math.max(
      0.02,
      0.22 - rod.id * 0.018 - rodPowerNorm * 0.08 - power * 0.06 - accuracy * 0.04 - totalLuck,
    );
    if (Math.random() < junkChance) {
      const id = JUNK_POOL[Math.floor(Math.random() * JUNK_POOL.length)]!;
      return {
        isJunk: true, junkId: id,
        fightStats: { pullStrength: 0.3, directionChangeFrequency: 0.1, escapeChance: 0, jerkChance: 0, hookWindowMs: 900 },
        hookChance: 1, hookWindowMs: 900, biome: map.id,
      };
    }

    // Build weighted pool from biome by rarity, filtered by rod tier, time
    // of day and active windows. Rod power amplifies rare/legendary odds and
    // morning/evening preferences amplify matching fish.
    type Cand = { id: string; def: FishDef; w: number };
    const candidates: Cand[] = [];
    const addPool = (ids: string[], tier: "common" | "uncommon" | "rare" | "legendary", baseWeight: number) => {
      for (const id of ids) {
        const def = FISH_DEFS[id]; if (!def) continue;
        if ((def.minRodTier ?? 1) > rod.id) continue;
        if (def.activeWindows && def.activeWindows.length && !def.activeWindows.includes(phase as any)) continue;

        const wb = def.weatherBias?.[ctx.weather as keyof FishDef["weatherBias"] & string] ?? 1;
        const rarMul = ctx.rarityBias[tier] ?? 1;

        // Time-of-day preference: dawn-tagged fish prefer morning,
        // dusk/night-tagged prefer evening. Match = ×1.8, mismatch = ×0.5.
        let todMul = 1;
        if (def.activeWindows && def.activeWindows.length) {
          const matchesMorning = def.activeWindows.includes("dawn") || def.activeWindows.includes("day");
          const matchesEvening = def.activeWindows.includes("dusk") || def.activeWindows.includes("night");
          if (tod === "morning") todMul = matchesMorning ? 1.8 : matchesEvening ? 0.5 : 1;
          else todMul = matchesEvening ? 1.8 : matchesMorning ? 0.5 : 1;
        }

        // Rod power lifts rare/legendary, slightly dampens common.
        let powerMul = 1;
        if (tier === "rare") powerMul = 1 + rodPowerNorm * 0.6;
        else if (tier === "legendary") powerMul = 1 + rodPowerNorm * 1.1;
        else if (tier === "common") powerMul = 1 - rodPowerNorm * 0.25;

        candidates.push({ id, def, w: Math.max(0.01, baseWeight * wb * rarMul * todMul * powerMul) });
      }
    };
    addPool(map.fish, "common", 1);
    addPool(map.fish.filter((id) => FISH_DEFS[id]?.rarity === "uncommon"), "uncommon", 0.6);
    addPool(map.rare, "rare", 0.18 + totalLuck + rodPowerNorm * 0.12);
    addPool(map.legendary ?? [], "legendary", 0.05 + totalLuck * 0.4 + rodPowerNorm * 0.08);



    // Evening: nocturnal fish added at boosted weight
    if (this.getTimeOfDay() === "evening") {
      const nocturnalInMap = NOCTURNAL_FISH.filter(
        id => !map.fish.includes(id) && !map.rare.includes(id)
      );
      addPool(nocturnalInMap, "rare", 0.3 + totalLuck * 0.5);
    }

    if (candidates.length === 0) {
      return {
        isJunk: true, junkId: "stick",
        fightStats: defaultFightStats(),
        hookChance: 1, hookWindowMs: 900, biome: map.id,
      };
    }
    const totalW = candidates.reduce((a, c) => a + c.w, 0);
    let roll = Math.random() * totalW;
    let chosen = candidates[0]!;
    for (const c of candidates) { roll -= c.w; if (roll <= 0) { chosen = c; break; } }
    const def = chosen.def;
    const fight: FightStats = { ...(def.fightStats ?? defaultFightStats()) };
    // Apply bait calm
    fight.escapeChance *= ctx.baitCalm;
    fight.jerkChance *= ctx.baitCalm;

    // Hook chance: HOOK_BASE_CHANCE + accuracy + (luck), reduced for "shy" fish
    const shy = def.behaviors?.includes("shy") ? -0.1 : 0;
    const hookChance = Math.min(0.99, HOOK_BASE_CHANCE + accuracy * 0.1 + totalLuck * 0.5 + shy);

    return {
      isJunk: false, fishId: def.id, def, fightStats: fight,
      hookChance, hookWindowMs: fight.hookWindowMs, biome: map.id,
      baitUsed: this.bestBait(),
    };
  }

  /** Commit a successful catch. Consumes bait, updates stats, emits events. */
  resolveCatch(pick: PickResult, weightKg?: number): CatchResult {
    const s = this.save.state;
    if (pick.isJunk && pick.junkId) {
      this.inv.add(pick.junkId, 1);
      EventBus.emit("fish:caught", { id: pick.junkId, name: this.catchName(pick.junkId), rarity: "junk", weightKg: 0, value: 0, biome: pick.biome });
      this.consumeBait(pick.baitUsed);
      return {
        isJunk: true, id: pick.junkId, name: this.catchName(pick.junkId), rarity: "junk",
        weightKg: 0, value: 0, isNewSpecies: false, isRecord: false, isHeaviest: false,
        streak: s.catchStreak ?? 0, streakBonus: 0,
      };
    }
    if (!pick.def) {
      return {
        isJunk: true, id: "?", name: "?", rarity: "junk", weightKg: 0, value: 0,
        isNewSpecies: false, isRecord: false, isHeaviest: false, streak: s.catchStreak ?? 0, streakBonus: 0
      };
    }
    const def = pick.def;
    const w = weightKg ?? 0;

    // Discovery + record checks BEFORE mutating counters.
    const isNewSpecies = (s.caught[def.id] ?? 0) === 0;
    const prevBest = s.bestWeight[def.id] ?? 0;
    const isRecord = w > prevBest && prevBest > 0;
    const isHeaviest = w > s.heaviestKg;

    this.inv.add(def.id, 1);
    s.caught[def.id] = (s.caught[def.id] ?? 0) + 1;
    s.caughtRarity[def.rarity] = (s.caughtRarity[def.rarity] ?? 0) + 1;
    s.caughtBiome[pick.biome] = s.caughtBiome[pick.biome] ?? {};
    s.caughtBiome[pick.biome]![def.id] = (s.caughtBiome[pick.biome]![def.id] ?? 0) + 1;
    s.totalCaught += 1;
    s.caughtToday += 1;

    // Catch streak — consecutive landed fish build a small coin bonus.
    s.catchStreak = (s.catchStreak ?? 0) + 1;
    if (s.catchStreak > (s.bestStreak ?? 0)) s.bestStreak = s.catchStreak;
    let streakBonus = 0;
    if (s.catchStreak >= 3) {
      streakBonus = Math.min(15, (s.catchStreak - 2) * 2);
      s.coins += streakBonus;
      s.totalEarned += streakBonus;
    }

    // Skill XP
    const xp = SKILL_XP_PER_CATCH[def.rarity] ?? 2;
    s.skillXp += xp;
    while (s.skillXp >= SKILL_XP_TO_LEVEL(s.skillLevel)) {
      s.skillXp -= SKILL_XP_TO_LEVEL(s.skillLevel);
      s.skillLevel += 1;
      EventBus.emit("skill:level", s.skillLevel);
    }

    this.consumeBait(pick.baitUsed);
    // Track best weights and narrative counters
    if (w > prevBest) s.bestWeight[def.id] = w;
    if (w > s.heaviestKg) s.heaviestKg = w;
    const phase = this.time?.state.phase;
    if (phase === "night") s.flagCounters.nightCatches = (s.flagCounters.nightCatches ?? 0) + 1;
    if (this.time?.state.weather === "storm") s.flagCounters.stormCatches = (s.flagCounters.stormCatches ?? 0) + 1;
    EventBus.emit("fish:caught", {
      id: def.id, name: def.name, rarity: def.rarity, weightKg: w, value: def.price,
      biome: pick.biome, isLegendary: def.rarity === "legendary",
      isNewSpecies, isRecord, isHeaviest, streak: s.catchStreak,
    });

    return {
      isJunk: false, id: def.id, name: def.name, rarity: def.rarity, weightKg: w,
      value: def.price, isNewSpecies, isRecord, isHeaviest,
      streak: s.catchStreak, streakBonus,
    };
  }

  resolveLost(pick: PickResult, reason: string): void {
    const s = this.save.state;
    s.catchStreak = 0; // a lost fish breaks the streak
    if (!pick.isJunk && pick.def) {
      // Rod durability hit on snap
      if (reason === "snap") {
        s.rodDurability = Math.max(0, s.rodDurability - 1);
      }
    }
    this.consumeBait(pick.baitUsed);
    EventBus.emit("fish:lost", { id: pick.fishId ?? "?", reason });
  }

  private consumeBait(id?: string): void {
    if (!id) return;
    this.inv.remove(id, 1);
    // legacy `bait` counter stays in sync with `bait` item count
    if (id === "bait") this.save.state.bait = Math.max(0, this.save.state.bait - 1);
  }

  /** Generate a random weight inside the species range. */
  rollWeight(def: FishDef): number {
    const r = def.weightKg ?? [0.2, 1];
    return Math.round((r[0]! + Math.random() * (r[1]! - r[0]!)) * 100) / 100;
  }

  // Helper used for junk pseudo-name display
  catchName(id: string): string {
    return ALL_CATCH_DEFS[id]?.name ?? id;
  }
}
