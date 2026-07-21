/**
 * BootScene — wires up shared services on the game registry.
 */
import Phaser from "phaser";
import { SCENE } from "../core/Constants";
import { SaveSystem } from "../systems/SaveSystem";
import { InventorySystem } from "../systems/InventorySystem";
import { EconomySystem } from "../systems/EconomySystem";
import { QuestSystem } from "../systems/QuestSystem";
import { TimeWeatherSystem } from "../systems/TimeWeatherSystem";
import { AudioSystem } from "../systems/AudioSystem";
import { FishingSystem } from "../systems/FishingSystem";
import { AchievementSystem } from "../systems/AchievementSystem";
import { SettingsSystem } from "../systems/SettingsSystem";
import { WardrobeSystem } from "../systems/WardrobeSystem";
import type { GameServices } from "../core/Game";
import { SERVICE_REGISTRY_KEY } from "../core/Game";

export class BootScene extends Phaser.Scene {
  constructor() { super(SCENE.Boot); }

  async create() {
    const save = new SaveSystem();
    const inventory = new InventorySystem(save);
    const economy = new EconomySystem(save, inventory);
    const quests = new QuestSystem(save, economy);
    const time = new TimeWeatherSystem();
    const audio = new AudioSystem();
    audio.attach(this.game);
    const settings = new SettingsSystem(save, audio);
    const fishing = new FishingSystem(save, inventory, time);
    time.bind(save);
    const achievements = new AchievementSystem(save);
    const wardrobe = new WardrobeSystem(save);

    const services: GameServices = {
      save, inventory, economy, quests, time, audio, fishing,
      achievements, settings, wardrobe,
    };
    this.registry.set(SERVICE_REGISTRY_KEY, services);
    fishing.setRegistry(this.registry);

    // Global UX: hover cursor, "top hit only" so backdrops never steal clicks
    // from buttons rendered on top of them.
    this.input.topOnly = true;

    try {
      if (typeof document !== "undefined" && (document as any).fonts?.ready) {
        await (document as any).fonts.ready;
      }
    } catch {
      // ignore — font API not available
    }

    this.scene.start(SCENE.Preload);
  }
}
