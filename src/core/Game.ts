import Phaser from "phaser";
import { createGameConfig } from "./Config";
import { SCENE } from "./Constants";

export interface GameServices {
  save: import("../systems/SaveSystem").SaveSystem;
  inventory: import("../systems/InventorySystem").InventorySystem;
  economy: import("../systems/EconomySystem").EconomySystem;
  quests: import("../systems/QuestSystem").QuestSystem;
  time: import("../systems/TimeWeatherSystem").TimeWeatherSystem;
  audio: import("../systems/AudioSystem").AudioSystem;
  fishing: import("../systems/FishingSystem").FishingSystem;
  achievements: import("../systems/AchievementSystem").AchievementSystem;
  settings: import("../systems/SettingsSystem").SettingsSystem;
  wardrobe: import("../systems/WardrobeSystem").WardrobeSystem;
}

export const SERVICE_REGISTRY_KEY = "services";

export function createGame(parent: string): Phaser.Game {
  const game = new Phaser.Game(createGameConfig(parent));
  game.events.once(Phaser.Core.Events.READY, () => {
    console.info("[Fishbound2] booted; starting", SCENE.Boot);
  });
  return game;
}
