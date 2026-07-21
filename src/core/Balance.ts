/**
 * Balance.ts — Stage 2 tuning knobs for the new fishing mini-game,
 * weather, boats, progression, quests. Keep them all here so playtesting
 * means editing one file.
 */

// ── Cast phase ────────────────────────────────────────────────
export const CAST_BAR_W = 360;
export const CAST_CHARGE_RATE = 1.4;        // 0..1 per second hold
export const CAST_SWEET_SWEEP = 0.9;        // sweet-spot moves at 0..1/s
export const CAST_SWEET_HALF = 0.08;        // half-width in 0..1 space

// ── Hook phase ────────────────────────────────────────────────
export const HOOK_DEFAULT_MS = 700;
export const HOOK_BASE_CHANCE = 0.85;

// ── Fight phase ───────────────────────────────────────────────
export const TENSION_MAX = 100;
export const TENSION_REEL_RAISE = 38;
export const TENSION_DECAY = 22;
export const TENSION_DANGER = 88;
export const TENSION_SNAP = 100;
export const TENSION_SNAP_HOLD_MS = 700;
export const REEL_PROGRESS_PER_SEC = 26;
export const REEL_FISH_PUSHBACK = 18;
export const FIGHT_DISTANCE = 100;
export const STAMINA_REEL_DRAIN = 6;

// ── Weather ──────────────────────────────────────────────────
export const WEATHER_TICK_MS = 60_000;
export const WEATHER_TRANSITIONS: Record<string, Array<[string, number]>> = {
  clear:  [["clear", 0.65], ["cloudy", 0.30], ["rain", 0.05]],
  cloudy: [["clear", 0.35], ["cloudy", 0.40], ["rain", 0.20], ["storm", 0.05]],
  rain:   [["cloudy", 0.45], ["rain", 0.35], ["storm", 0.20]],
  storm:  [["rain", 0.55], ["storm", 0.30], ["cloudy", 0.15]],
};

// ── Skill ────────────────────────────────────────────────────
export const SKILL_XP_PER_CATCH: Record<string, number> = {
  common: 4, uncommon: 9, rare: 22, legendary: 80, junk: 1,
};
export const SKILL_XP_TO_LEVEL = (lv: number) => 25 + lv * 20; // Phase B: smoother early curve
export const SKILL_LUCK_PER_LEVEL = 0.01;
export const SKILL_TENSION_TOL_PER_LEVEL = 0.5;

// ── Inventory weight ─────────────────────────────────────────
export const BOAT_CAPACITY_KG: Record<number, number> = {
  0: 8, 1: 18, 2: 32, 3: 55, 4: 90, 5: 140, 6: 220, 7: 360,
};

// ── Achievement bonuses ──────────────────────────────────────
export const ACHIEVEMENT_LUCK_BONUS = 0.02;

// ── Quest tracking ───────────────────────────────────────────
export const DAILY_RESET_HOUR = 5;

// ── Stamina passive rest (Phase 4) ───────────────────────────
/** ms of standing perfectly still before passive rest kicks in. */
export const REST_IDLE_MS = 3000;
/** stamina regenerated per second while resting. */
export const REST_REGEN_PER_SEC = 6;
/** stamina restored per kilogram of consumed fish. */
export const FISH_STAMINA_PER_KG = 18;
/** baseline stamina restored by a generic fish if no weight known. */
export const FISH_STAMINA_BASE = 8;

