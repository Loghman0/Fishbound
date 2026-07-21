/**
 * AnimationRegistry — registers every spritesheet animation exactly once
 * with the global Phaser AnimationManager.
 *
 * Add a new character: append to FISHERMAN_ANIMS (or new arrays here),
 * then any scene/entity can `play("yourchar.walk")` without re-registering.
 */
import Phaser from "phaser";
import { FISHERMAN_ANIMS, type AnimSpec } from "../data/assetKeys";

export class AnimationRegistry {
  private static registered = new Set<string>();

  static registerAll(scene: Phaser.Scene): void {
    this.registerGroup(scene, FISHERMAN_ANIMS);
  }

  static registerGroup(scene: Phaser.Scene, specs: AnimSpec[]): void {
    for (const a of specs) {
      if (this.registered.has(a.key)) continue;
      if (scene.anims.exists(a.key)) { this.registered.add(a.key); continue; }
      if (!scene.textures.exists(a.sheet)) continue; // sheet not loaded yet
      // Build the frame config without an explicit `end: undefined` — Phaser's
      // GetValue returns the (undefined) own-property instead of its -1 default,
      // which yields a zero-frame animation that crashes on play (getFirstTick
      // reading `duration` of an undefined frame).
      const frameCfg: Phaser.Types.Animations.GenerateFrameNumbers = { start: a.start ?? 0 };
      if (a.end !== undefined) frameCfg.end = a.end;
      scene.anims.create({
        key: a.key,
        frames: scene.anims.generateFrameNumbers(a.sheet, frameCfg),
        frameRate: a.frameRate,
        repeat: a.repeat,
      });
      this.registered.add(a.key);
    }
  }

  static clear(): void { this.registered.clear(); }
}
