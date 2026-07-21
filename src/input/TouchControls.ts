/**
 * TouchControls — on-screen virtual joystick + action button.
 *
 * Pure Phaser, no DOM. Auto-shows on touch-capable devices, hidden otherwise.
 * Drives the shared InputManager via setVirtualAxis / pressVirtual.
 */
import Phaser from "phaser";
import type { InputManager, InputAction } from "./InputManager";

const STICK_RADIUS = 48;
const KNOB_RADIUS = 22;
const BUTTON_RADIUS = 30;

export class TouchControls {
  private stickBase: Phaser.GameObjects.Arc;
  private stickKnob: Phaser.GameObjects.Arc;
  private buttonBg: Phaser.GameObjects.Arc;
  private buttonLabel: Phaser.GameObjects.Text;
  private container: Phaser.GameObjects.Container;
  private pointerId: number | null = null;
  private buttonAction: InputAction = "interact";

  constructor(
    private scene: Phaser.Scene,
    private input: InputManager,
    opts: { force?: boolean; buttonAction?: InputAction } = {},
  ) {
    const enabled = opts.force || isTouchDevice();
    this.buttonAction = opts.buttonAction ?? "interact";
    const w = scene.scale.width, h = scene.scale.height;
    this.container = scene.add.container(0, 0).setScrollFactor(0).setDepth(5000);

    this.stickBase = scene.add.circle(80, h - 80, STICK_RADIUS, 0xffffff, 0.12)
      .setStrokeStyle(2, 0xffffff, 0.5);
    this.stickKnob = scene.add.circle(80, h - 80, KNOB_RADIUS, 0xffffff, 0.4);
    this.buttonBg = scene.add.circle(w - 64, h - 80, BUTTON_RADIUS, 0xffe066, 0.55)
      .setStrokeStyle(2, 0xffffff, 0.7);
    this.buttonLabel = scene.add.text(w - 64, h - 80, "E", {
      fontSize: "16px", color: "#1c2a30", fontStyle: "bold",
    }).setOrigin(0.5);

    this.container.add([this.stickBase, this.stickKnob, this.buttonBg, this.buttonLabel]);
    this.container.setVisible(enabled);

    if (!enabled) return;

    this.stickBase.setInteractive(new Phaser.Geom.Circle(0, 0, STICK_RADIUS * 1.4), Phaser.Geom.Circle.Contains);
    this.buttonBg.setInteractive(new Phaser.Geom.Circle(0, 0, BUTTON_RADIUS * 1.2), Phaser.Geom.Circle.Contains);
    this.buttonBg.on("pointerdown", () => this.input.pressVirtual(this.buttonAction));
    this.buttonBg.on("pointerup", () => this.input.releaseVirtual(this.buttonAction));
    this.buttonBg.on("pointerout", () => this.input.releaseVirtual(this.buttonAction));

    scene.input.on(Phaser.Input.Events.POINTER_DOWN, this.onDown, this);
    scene.input.on(Phaser.Input.Events.POINTER_MOVE, this.onMove, this);
    scene.input.on(Phaser.Input.Events.POINTER_UP,   this.onUp, this);
    scene.input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.onUp, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  setButtonAction(action: InputAction, label = action[0]?.toUpperCase() ?? "?"): void {
    this.buttonAction = action;
    this.buttonLabel.setText(label);
  }

  private onDown(p: Phaser.Input.Pointer): void {
    if (this.pointerId !== null) return;
    // Only claim pointer on the stick half
    if (p.x > this.scene.scale.width / 2) return;
    this.pointerId = p.id;
    this.updateStick(p.x, p.y);
  }
  private onMove(p: Phaser.Input.Pointer): void {
    if (this.pointerId !== p.id) return;
    this.updateStick(p.x, p.y);
  }
  private onUp(p: Phaser.Input.Pointer): void {
    if (this.pointerId !== p.id) return;
    this.pointerId = null;
    this.stickKnob.setPosition(this.stickBase.x, this.stickBase.y);
    this.input.setVirtualAxis(0, 0);
  }

  private updateStick(px: number, py: number): void {
    const dx = px - this.stickBase.x;
    const dy = py - this.stickBase.y;
    const len = Math.hypot(dx, dy);
    const clamped = Math.min(len, STICK_RADIUS);
    const ux = len > 0 ? dx / len : 0;
    const uy = len > 0 ? dy / len : 0;
    this.stickKnob.setPosition(this.stickBase.x + ux * clamped, this.stickBase.y + uy * clamped);
    const dead = 0.18;
    const norm = clamped / STICK_RADIUS;
    if (norm < dead) this.input.setVirtualAxis(0, 0);
    else this.input.setVirtualAxis(ux * norm, uy * norm);
  }

  destroy(): void {
    this.scene.input.off(Phaser.Input.Events.POINTER_DOWN, this.onDown, this);
    this.scene.input.off(Phaser.Input.Events.POINTER_MOVE, this.onMove, this);
    this.scene.input.off(Phaser.Input.Events.POINTER_UP, this.onUp, this);
    this.scene.input.off(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.onUp, this);
    this.container.destroy();
  }
}

function isTouchDevice(): boolean {
  if (typeof window === "undefined") return false;
  return ("ontouchstart" in window) ||
    (typeof navigator !== "undefined" && navigator.maxTouchPoints > 0);
}
