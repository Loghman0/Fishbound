import Phaser from "phaser";
import { CANVAS_W, CANVAS_H } from "./Constants";
import { BootScene } from "../scenes/BootScene";
import { PreloadScene } from "../scenes/PreloadScene";
import { MainMenuScene } from "../scenes/MainMenuScene";
import { OverworldScene } from "../scenes/OverworldScene";
import { FishingScene } from "../scenes/FishingScene";
import { ShopScene } from "../scenes/ShopScene";
import { InventoryScene } from "../scenes/InventoryScene";
import { BestiaryScene } from "../scenes/BestiaryScene";
import { QuestLogScene } from "../scenes/QuestLogScene";
import { SettingsScene } from "../scenes/SettingsScene";
import { SaveSlotsScene } from "../scenes/SaveSlotsScene";
import { WardrobeScene } from "../scenes/WardrobeScene";
import { PauseMenuScene } from "../scenes/PauseMenuScene";

export const createGameConfig = (parent: string): Phaser.Types.Core.GameConfig => ({
  type: Phaser.AUTO,
  parent,
  backgroundColor: "#0b1416",
  pixelArt: true,
  roundPixels: true,
  antialias: false,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: CANVAS_W,
    height: CANVAS_H,
  },
  physics: { default: "arcade", arcade: { gravity: { x: 0, y: 0 }, debug: false } },
  render: {
    pixelArt: true,
    antialias: false,
    roundPixels: true,
    powerPreference: "high-performance",
  },
  audio: { disableWebAudio: false, noAudio: true },
  scene: [
    BootScene, PreloadScene, MainMenuScene, OverworldScene,
    FishingScene, ShopScene, InventoryScene, BestiaryScene,
    QuestLogScene, SettingsScene, SaveSlotsScene,
    WardrobeScene, PauseMenuScene,
  ],
});
