/**
 * data/questDefs.ts — Stage 3: 20 quests including SteamMan/GraveRobber arcs.
 */
import type { PlayerState } from "../systems/SaveSystem";

export interface QuestReward {
  coins?: number;
  bait?: number;
  baitItem?: { id: string; qty: number };
  skillXp?: number;
  permLuck?: number;
  permTension?: number;
  title?: string;
  flag?: string;
}

export type QuestKind =
  | "catchSpecies" | "catchInBiome" | "catchRarity"
  | "sellValue" | "explore" | "craftBait"
  | "rodTier" | "skillLevel"
  | "totalCaught" | "weightOver" | "weatherCatch"
  | "narrative";

export interface QuestDef {
  id: string;
  title: string;
  desc: string;
  kind: QuestKind;
  target?: string;
  goal: number;
  reward: QuestReward;
  category?: "main" | "side" | "daily" | "story";
  requires?: string;
  progress?: (s: PlayerState) => number;
}

export const QUEST_DEFS: QuestDef[] = [
  {
    id: "q1", title: "Small Fry", desc: "Catch 3 Minnows.",
    kind: "catchSpecies", target: "Minnow", goal: 3,
    reward: { coins: 30, bait: 5 }, category: "main"
  },
  {
    id: "q2", title: "Market Day", desc: "Sell goods worth 80¢ total.",
    kind: "sellValue", goal: 80, reward: { coins: 45 }, category: "main"
  },
  {
    id: "q3", title: "A Better Cast", desc: "Upgrade to a Tier 2 rod.",
    kind: "rodTier", goal: 2, reward: { coins: 35, bait: 8 }, category: "main", requires: "q2"
  },
  {
    id: "q4", title: "Experienced Caster", desc: "Reach fishing skill level 2.",
    kind: "skillLevel", goal: 2, reward: { coins: 100, bait: 10 }, category: "main", requires: "q3"
  },
  {
    id: "q5", title: "Riverbed Roll", desc: "Catch any fish in the Mossy River.",
    kind: "catchInBiome", target: "river", goal: 1,
    reward: { coins: 60, baitItem: { id: "bait_glow", qty: 4 } }, category: "main", requires: "q4"
  },
  {
    id: "q7", title: "Rare Catch", desc: "Catch any rare fish.",
    kind: "catchRarity", target: "rare", goal: 1, reward: { coins: 120 }, category: "main", requires: "q5"
  },
  {
    id: "q8", title: "Legend of the Deep", desc: "Catch a Moonfish.",
    kind: "catchSpecies", target: "Moonfish", goal: 1,
    reward: { coins: 800, baitItem: { id: "bait_legendary", qty: 1 }, title: "Moonbinder" },
    category: "main", requires: "q7"
  },
  {
    id: "q9", title: "Into the Green", desc: "Visit the Rainforest River.",
    kind: "explore", target: "rainforest", goal: 1,
    reward: { coins: 60, bait: 6 }, category: "main", requires: "q4"
  },
  {
    id: "q10", title: "Northern Passage", desc: "Reach the Frozen Lake.",
    kind: "explore", target: "frozen", goal: 1,
    reward: { coins: 150, baitItem: { id: "bait_pro", qty: 2 } }, category: "main", requires: "q4"
  },
  {
    id: "qS1", title: "Foul Water", desc: "Visit the Steamworks Outflow.",
    kind: "explore", target: "outflow", goal: 1,
    reward: { coins: 30 }, category: "story", requires: "q4"
  },
  {
    id: "qS2", title: "Clean Catch", desc: "Catch 5 Slime Carp in the Outflow.",
    kind: "catchSpecies", target: "Slimecarp", goal: 5,
    reward: { coins: 120, bait: 8 }, category: "story", requires: "qS1"
  },
  {
    id: "qS3", title: "Clear the Outflow", desc: "Help SteamMan clean the runoff: catch 3 Ironback.",
    kind: "catchSpecies", target: "Ironback", goal: 3,
    reward: { coins: 400, permLuck: 0.02, title: "Cleanup Crew", flag: "outflow_cleaned" },
    category: "story", requires: "qS2"
  },
  {
    id: "qS4", title: "What the Smoke Made", desc: "Catch the Slag Sire (after cleaning).",
    kind: "catchSpecies", target: "Slagsire", goal: 1,
    reward: { coins: 1500, baitItem: { id: "bait_legendary", qty: 1 }, title: "Slag Slayer" },
    category: "story", requires: "qS3"
  },
  {
    id: "qG1", title: "Missing Fish", desc: "Catch 10 fish at night (something is stealing them).",
    kind: "narrative", goal: 10,
    reward: { coins: 80, bait: 6, flag: "graverobber_aware" },
    category: "story", requires: "q5",
    progress: (s) => (s.flagCounters?.nightCatches ?? 0)
  },
  {
    id: "qG2", title: "Confront the Thief", desc: "Catch a legendary fish - proof for the GraveRobber.",
    kind: "catchRarity", target: "legendary", goal: 1,
    reward: { coins: 600, title: "Night Warden", permTension: 4 },
    category: "story", requires: "qG1"
  },
  {
    id: "q11", title: "Heavy Catch", desc: "Land a fish weighing over 5 kg.",
    kind: "weightOver", goal: 5,
    reward: { coins: 200, title: "Heavyweight" }, category: "side", requires: "q5",
    progress: (s) => Math.floor(Math.max(0, (s.heaviestKg ?? 0)))
  },
  {
    id: "q12", title: "Storm Catcher", desc: "Catch any fish during a storm.",
    kind: "weatherCatch", target: "storm", goal: 1,
    reward: { coins: 90, baitItem: { id: "bait_pro", qty: 2 } }, category: "side",
    progress: (s) => (s.flagCounters?.stormCatches ?? 0)
  },
  {
    id: "q13", title: "Century Club", desc: "Catch 100 fish total.",
    kind: "totalCaught", goal: 100,
    reward: { coins: 400, title: "Centurion", permLuck: 0.01 },
    category: "side", requires: "q4"
  },
  {
    id: "q14", title: "Master Angler", desc: "Reach skill level 5.",
    kind: "skillLevel", goal: 5,
    reward: { coins: 200, title: "Tidemaster", permTension: 4 }, category: "side"
  },
  {
    id: "qD1", title: "Daily Haul", desc: "Catch 6 fish today.",
    kind: "skillLevel", goal: 1, reward: { coins: 50, bait: 4 }, category: "daily",
    progress: (s) => s.caughtToday >= 6 ? 1 : 0
  },
];
