/**
 * PreloadScene — loads everything declared in /data manifests through the
 * AssetManager wrapper, then registers all animations exactly once via
 * AnimationRegistry. Skips assets already in cache (safe on scene restart).
 */
import Phaser from "phaser";
import { SCENE, CANVAS_W, CANVAS_H } from "../core/Constants";
import { AssetManager } from "../assets/AssetManager";
import { AnimationRegistry } from "../assets/AnimationRegistry";

export class PreloadScene extends Phaser.Scene {
  constructor() { super(SCENE.Preload); }

  preload() {
    const w = 240, h = 8;
    const x = (CANVAS_W - w) / 2;
    const y = CANVAS_H / 2;
    this.add.text(CANVAS_W / 2, y - 24, "Loading...", { fontSize: "12px", color: "#d6e2e6" }).setOrigin(0.5);
    this.add.rectangle(x, y, w, h, 0x22343a).setOrigin(0, 0);
    const fill = this.add.rectangle(x, y, 1, h, 0x6fb56e).setOrigin(0, 0);
    this.load.on("progress", (p: number) => fill.width = Math.max(1, w * p));
    this.load.on("loaderror", (file: Phaser.Loader.File) => {
      console.warn("[Preload] failed to load", file.key, file.url);
    });

    new AssetManager(this).registerAll();
  }

  create() {
    AnimationRegistry.registerAll(this);
    this.scene.start(SCENE.MainMenu);
  }
}
