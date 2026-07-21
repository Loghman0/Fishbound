/**
 * data/achievementDefs.ts — Stage 3: tiered achievements (bronze/silver/gold).
 */
import type { PlayerState } from "../systems/SaveSystem";

export interface AchievementReward {
  title?: string;
  luckBonus?: number;
  tensionBonus?: number;
  coins?: number;
  tier?: "bronze" | "silver" | "gold";
}

export interface AchievementDef {
  id: string;
  title: string;
  desc: string;
  check: (s: PlayerState) => boolean;
  category?: "fishing" | "economy" | "exploration" | "mastery" | "story";
  secret?: boolean;
  reward?: AchievementReward;
}

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  {
    id: "ac_b", title: "First Splash", desc: "Catch your first fish.",
    check: (s) => s.totalCaught >= 1, category: "fishing",
    reward: { tier: "bronze", title: "Novice Angler", coins: 10 }
  },
  {
    id: "ac_s", title: "Bucketful", desc: "Catch 25 fish.",
    check: (s) => s.totalCaught >= 25, category: "fishing",
    reward: { tier: "silver", title: "Bucketful", luckBonus: 0.02 }
  },
  {
    id: "ac_g", title: "Century Net", desc: "Catch 100 fish.",
    check: (s) => s.totalCaught >= 100, category: "fishing",
    reward: { tier: "gold", title: "Centurion", luckBonus: 0.03, coins: 200 }
  },
  {
    id: "co_b", title: "Pocket Change", desc: "Hold 100¢.",
    check: (s) => s.coins >= 100, category: "economy", reward: { tier: "bronze" }
  },
  {
    id: "co_s", title: "Angler's Purse", desc: "Hold 500¢.",
    check: (s) => s.coins >= 500, category: "economy",
    reward: { tier: "silver", title: "Patron", coins: 25 }
  },
  {
    id: "co_g", title: "Tycoon", desc: "Hold 5,000¢.",
    check: (s) => s.coins >= 5000, category: "economy",
    reward: { tier: "gold", title: "Tycoon", luckBonus: 0.02 }
  },

  {
    id: "ex_g", title: "All The World's A Coast", desc: "Visit 7 distinct maps.",
    check: (s) => (s.exploredMaps?.length ?? 0) >= 7, category: "exploration",
    reward: { tier: "gold", title: "Cartographer", coins: 250, luckBonus: 0.02 }
  },
  {
    id: "ma_b", title: "First Rare", desc: "Catch a rare fish.",
    check: (s) => (s.caughtRarity?.rare ?? 0) >= 1, category: "mastery",
    reward: { tier: "bronze" }
  },
  {
    id: "ma_s", title: "Legend Glow", desc: "Catch a Moonfish.",
    check: (s) => (s.caught?.Moonfish ?? 0) >= 1, category: "mastery", secret: true,
    reward: { tier: "silver", title: "Moonbinder", luckBonus: 0.04, coins: 250 }
  },
  {
    id: "ma_g", title: "King of Tides", desc: "Catch the Tide King.",
    check: (s) => (s.caught?.Tideking ?? 0) >= 1, category: "mastery", secret: true,
    reward: { tier: "gold", title: "Tideking", luckBonus: 0.05, tensionBonus: 8, coins: 500 }
  },
  {
    id: "sk_s", title: "Master of Tides", desc: "Reach skill level 5.",
    check: (s) => (s.skillLevel ?? 0) >= 5, category: "mastery",
    reward: { tier: "silver", title: "Tidemaster", luckBonus: 0.03 }
  },
  {
    id: "sk_g", title: "Grandmaster", desc: "Reach skill level 10.",
    check: (s) => (s.skillLevel ?? 0) >= 10, category: "mastery",
    reward: { tier: "gold", title: "Grandmaster", luckBonus: 0.05, tensionBonus: 6 }
  },
  {
    id: "st_clean", title: "Cleaner of Waters", desc: "Help clean the Outflow.",
    check: (s) => !!s.flags?.outflow_cleaned, category: "story",
    reward: { tier: "gold", title: "Cleanup Crew" }
  },
];
