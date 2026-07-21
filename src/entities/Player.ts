/**
 * Player — Container holding the body sprite. Wraps Phaser Arcade physics body
 * for 4-directional top-down movement.
 *
 * Phase 4 additions:
 *  - tracks `lastMoveAt` and surfaces a `resting` flag once the player has
 *    been completely still for REST_IDLE_MS. The owning scene can read
 *    `resting` to drive the HUD indicator and the stamina regen tick.
 *  - exposes `markMoved()` so external systems (touch joystick, scripted
 *    cutscenes) can keep the rest timer accurate even when bypassing move().
 */

import Phaser from "phaser";
import { IMG } from "../data/assetKeys";
import { REST_IDLE_MS } from "../core/Balance";

export type PlayerAnim = "idle" | "walk" | "fish" | "hook" | "attack" | "hurt" | "death";

export class Player extends Phaser.GameObjects.Container {
  declare body: Phaser.Physics.Arcade.Body;
  sprite: Phaser.GameObjects.Sprite;
  facing: "left" | "right" = "right";
  private currentAnim: PlayerAnim = "idle";
  private animPrefix = "fisherman";
  speed = 100;
  /** ms timestamp (scene.time.now) of the most recent movement input. */
  lastMoveAt = 0;
  /** True once the player has been still long enough to passively rest. */
  resting = false;
  private restIcon?: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    this.sprite = scene.add.sprite(0, 0, IMG.FishermanIdle, 0);
    this.add(this.sprite);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setSize(20, 20);
    this.body.setOffset(-10, 4);
    this.body.setCollideWorldBounds(true);
    this.setDepth(10);
    this.play("idle");
    this.lastMoveAt = scene.time.now;
  }

  /** Swap to a cosmetic that registers its anims under a different prefix. */
  setSkin(animPrefix: string, fallbackTexture: string): void {
    if (this.animPrefix === animPrefix) return;
    this.animPrefix = animPrefix;
    const cur = this.currentAnim;
    this.currentAnim = "idle"; // force re-play
    const key = `${animPrefix}.${cur}`;
    if (this.scene.anims.exists(key)) this.sprite.play(key, true);
    else if (this.scene.textures.exists(fallbackTexture)) this.sprite.setTexture(fallbackTexture, 0);
  }

  play(anim: PlayerAnim): void {
    if (this.currentAnim === anim) return;
    this.currentAnim = anim;
    const key = `${this.animPrefix}.${anim}`;
    if (this.scene.anims.exists(key)) {
      this.sprite.play(key, true);
    } else if (this.animPrefix !== "fisherman") {
      const fb = `fisherman.${anim}`;
      if (this.scene.anims.exists(fb)) this.sprite.play(fb, true);
    }
  }

  /** External systems can refresh the idle clock (e.g. tile-bound cutscenes). */
  markMoved(): void {
    this.lastMoveAt = this.scene.time.now;
    if (this.resting) this.setResting(false);
  }

  /**
   * Apply movement. `dx`/`dy` are expected to be already-normalized
   * (magnitude <= 1) — diagonal handling lives in InputManager.
   */
  move(dx: number, dy: number, speedScale = 1): void {
    const sp = this.speed * speedScale;
    const vx = dx * sp;
    const vy = dy * sp;
    this.body.setVelocity(vx, vy);
    if (vx < -1) { this.facing = "left"; this.sprite.setFlipX(true); }
    else if (vx > 1) { this.facing = "right"; this.sprite.setFlipX(false); }
    const moving = Math.abs(vx) + Math.abs(vy) > 1;
    if (moving) {
      this.play("walk");
      this.markMoved();
    } else {
      this.play("idle");
      this.updateRestState();
    }
  }

  /** Re-evaluate rest state without mutating velocity. */
  updateRestState(): void {
    const idleFor = this.scene.time.now - this.lastMoveAt;
    const shouldRest = idleFor >= REST_IDLE_MS;
    if (shouldRest !== this.resting) this.setResting(shouldRest);
  }

  private setResting(v: boolean): void {
    this.resting = v;
    if (v) {
      if (!this.restIcon) {
        this.restIcon = this.scene.add.text(0, -22, "Zz", {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: "8px",
          color: "#ffe066",
          resolution: 2,
        }).setOrigin(0.5);
        this.add(this.restIcon);
        this.scene.tweens.add({
          targets: this.restIcon,
          y: -28,
          alpha: { from: 0.4, to: 1 },
          duration: 900,
          yoyo: true,
          repeat: -1,
        });
      }
      this.restIcon.setVisible(true);
    } else if (this.restIcon) {
      this.scene.tweens.killTweensOf(this.restIcon);
      this.restIcon.destroy();
      this.restIcon = undefined;
    }
  }

  stop(): void {
    this.body.setVelocity(0, 0);
    this.play("idle");
    this.updateRestState();
  }
  startFishing(): void {
    this.body.setVelocity(0, 0);
    this.play("fish");
    this.markMoved();
  }
  hooked(): void { this.play("hook"); this.markMoved(); }
  stopFishing(): void { this.play("idle"); this.markMoved(); }
}
