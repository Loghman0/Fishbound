/**
 * SaveSystem — versioned localStorage with 3 slots + JSON import/export.
 * Stage 3 (v2): adds settings, flags, flagCounters, bestWeight, heaviestKg,
 * playtimeSec, activeTitle.
 */

import { SAVE_KEY_PREFIX, SAVE_SLOTS, SAVE_VERSION, BASE_STAMINA } from "../core/Constants";
import { DEFAULT_SETTINGS, type GameSettings } from "../data/settingsDefs";

export interface PlayerState {
  version: number;
  savedAt: string;
  mapId: string;
  tileX: number;
  tileY: number;
  coins: number;
  bait: number;
  rod: number;
  rodDurability: number;
  stamina: number;
  maxStamina: number;
  caught: Record<string, number>;
  caughtBiome: Record<string, Record<string, number>>;
  caughtRarity: Record<string, number>;
  inventory: Record<string, number>;
  totalCaught: number;
  totalSold: number;
  totalSoldValue: number;
  totalEarned: number;
  totalCrafted: number;
  exploredMaps: string[];
  skillLevel: number;
  skillXp: number;
  day: number;
  caughtToday: number;
  lastDailyHour: number;
  weather: "clear" | "cloudy" | "rain" | "storm";
  hours: number;
  completedQuests: string[];
  unlockedAchievements: string[];
  titles: string[];
  permLuck: number;
  permTension: number;
  settings: GameSettings;
  flags: Record<string, boolean>;
  flagCounters: Record<string, number>;
  bestWeight: Record<string, number>;
  heaviestKg: number;
  playtimeSec: number;
  activeTitle?: string;
  /** Wardrobe — optional, defaults to "fisherman" on load. Back-compat-safe. */
  equippedCosmetic?: string;
  /** Phase B — maps that have already paid out a first-visit reward. */
  exploredRewarded?: string[];
  /** Phase B — current consecutive successful-catch streak. */
  catchStreak?: number;
  /** Phase B — best catch streak achieved. */
  bestStreak?: number;
}

export function makeFreshState(): PlayerState {
  return {
    version: SAVE_VERSION,
    savedAt: new Date().toISOString(),
    mapId: "xerite",
    tileX: 4, tileY: 7,
    coins: 25, bait: 5, rod: 1, rodDurability: 30,
    stamina: BASE_STAMINA, maxStamina: BASE_STAMINA,
    caught: {}, caughtBiome: {}, caughtRarity: {}, inventory: {},
    totalCaught: 0, totalSold: 0, totalSoldValue: 0, totalEarned: 0, totalCrafted: 0,
    exploredMaps: ["xerite"],
    skillLevel: 1, skillXp: 0,
    day: 1, caughtToday: 0, lastDailyHour: 8,
    weather: "clear", hours: 8,
    completedQuests: [], unlockedAchievements: [], titles: [],
    permLuck: 0, permTension: 0,
    settings: { ...DEFAULT_SETTINGS },
    flags: {}, flagCounters: {}, bestWeight: {}, heaviestKg: 0, playtimeSec: 0,
    exploredRewarded: ["xerite"], catchStreak: 0, bestStreak: 0,
  };
}

const MIGRATIONS: Record<number, (s: any) => any> = {
  1: (s) => ({
    ...s,
    settings: s.settings ?? { ...DEFAULT_SETTINGS },
    flags: s.flags ?? {},
    flagCounters: s.flagCounters ?? {},
    bestWeight: s.bestWeight ?? {},
    heaviestKg: s.heaviestKg ?? 0,
    playtimeSec: s.playtimeSec ?? 0,
  }),
};

function migrate(raw: any): PlayerState {
  let s = raw;
  while (typeof s.version === "number" && s.version < SAVE_VERSION) {
    const mig = MIGRATIONS[s.version];
    if (!mig) {
      console.warn(`[Save] No migration from v${s.version}; using fresh defaults overlay.`);
      return { ...makeFreshState(), ...s, version: SAVE_VERSION };
    }
    s = mig(s);
    s.version += 1;
  }
  const merged = { ...makeFreshState(), ...s, version: SAVE_VERSION };
  // Phase B back-compat: don't re-reward maps the player already explored.
  if (!Array.isArray(s.exploredRewarded)) {
    merged.exploredRewarded = [...(merged.exploredMaps ?? ["sample_cove"])];
  }
  if (typeof s.catchStreak !== "number") merged.catchStreak = 0;
  if (typeof s.bestStreak !== "number") merged.bestStreak = 0;
  return merged;
}

export interface SlotMeta {
  savedAt: string;
  mapId: string;
  coins: number;
  rod: number;
  totalCaught: number;
  playtimeSec: number;
}

export class SaveSystem {
  private current: PlayerState = makeFreshState();
  private activeSlot = 0;

  get state(): PlayerState { return this.current; }
  get slot(): number { return this.activeSlot; }
  setState(s: PlayerState): void { this.current = s; }
  patch(p: Partial<PlayerState>): void { this.current = { ...this.current, ...p }; }
  reset(): void { this.current = makeFreshState(); }
  setSlot(i: number): void { this.activeSlot = i; }

  private key(slot: number): string { return `${SAVE_KEY_PREFIX}.slot${slot}`; }

  listSlots(): Array<{ slot: number; meta: SlotMeta | null }> {
    const out: Array<{ slot: number; meta: SlotMeta | null }> = [];
    for (let i = 0; i < SAVE_SLOTS; i++) {
      const raw = localStorage.getItem(this.key(i));
      if (!raw) { out.push({ slot: i, meta: null }); continue; }
      try {
        const s = JSON.parse(raw);
        out.push({
          slot: i, meta: {
            savedAt: s.savedAt, mapId: s.mapId, coins: s.coins,
            rod: s.rod ?? 1,
            totalCaught: s.totalCaught ?? 0, playtimeSec: s.playtimeSec ?? 0,
          }
        });
      } catch {
        out.push({ slot: i, meta: null });
      }
    }
    return out;
  }

  save(slot = this.activeSlot): void {
    this.current.savedAt = new Date().toISOString();
    this.current.version = SAVE_VERSION;
    localStorage.setItem(this.key(slot), JSON.stringify(this.current));
    this.activeSlot = slot;
  }

  load(slot = this.activeSlot): boolean {
    const raw = localStorage.getItem(this.key(slot));
    if (!raw) return false;
    try {
      this.current = migrate(JSON.parse(raw));
      this.activeSlot = slot;
      return true;
    } catch (e) {
      console.error("[Save] corrupt slot", slot, e);
      return false;
    }
  }

  clear(slot: number): void { localStorage.removeItem(this.key(slot)); }

  exportJSON(): string { return JSON.stringify(this.current, null, 2); }

  exportDownload(filename = `fishbound2-save-${Date.now()}.json`): void {
    const blob = new Blob([this.exportJSON()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  }

  importJSON(json: string): boolean {
    try { this.current = migrate(JSON.parse(json)); return true; }
    catch (e) { console.error("[Save] import failed", e); return false; }
  }

  importFile(): Promise<boolean> {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file"; input.accept = "application/json";
      input.onchange = async () => {
        const file = input.files?.[0]; if (!file) { resolve(false); return; }
        const text = await file.text();
        resolve(this.importJSON(text));
      };
      input.click();
    });
  }
}
