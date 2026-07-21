/**
 * SettingsScene — volume sliders, screen-shake, colorblind, simplified fishing, autosave.
 */
import Phaser from "phaser";
import { SCENE, CANVAS_W, CANVAS_H } from "../core/Constants";
import { SERVICE_REGISTRY_KEY } from "../core/Game";
import type { GameServices } from "../core/Game";
import { SFX } from "../data/audioKeys";

export class SettingsScene extends Phaser.Scene {
  private svc!: GameServices;
  private returnTo: string = SCENE.MainMenu;

  constructor() { super(SCENE.Settings); }

  init(data?: { returnTo?: string }) {
    if (data?.returnTo) this.returnTo = data.returnTo;
  }

  create() {
    this.svc = this.registry.get(SERVICE_REGISTRY_KEY) as GameServices;
    this.input.topOnly = true;
    this.add.rectangle(0, 0, CANVAS_W, CANVAS_H, 0x0b1416, 0.97).setOrigin(0);
    this.add.text(CANVAS_W / 2, 22, "Settings", { fontSize: "20px", color: "#e6efe2", fontStyle: "bold" }).setOrigin(0.5);

    let y = 70;
    // Audio is intentionally disabled in this build — sliders hidden until
    // sound design returns. A short note keeps the screen self-explanatory.
    this.add.text(CANVAS_W / 2, y, "Audio: disabled in this build", {
      fontSize: "11px", color: "#7d8a8e",
    }).setOrigin(0.5);
    y += 36;


    this.toggle("Screen shake", y,
      () => this.svc.settings.state.screenShake,
      (v) => this.svc.settings.patch({ screenShake: v })); y += 30;
    this.toggle("Simplified fishing", y,
      () => this.svc.settings.state.simplifiedFishing,
      (v) => this.svc.settings.patch({ simplifiedFishing: v })); y += 30;
    this.toggle("Autosave", y,
      () => this.svc.settings.state.autosave,
      (v) => this.svc.settings.patch({ autosave: v })); y += 30;

    this.add.text(60, y, "Colorblind:", { fontSize: "11px", color: "#d6e2e6" });
    const palettes: Array<"off" | "protanopia" | "deuteranopia" | "tritanopia"> =
      ["off", "protanopia", "deuteranopia", "tritanopia"];
    palettes.forEach((p, i) => {
      const x = 160 + i * 100;
      const lbl = this.add.text(x, y, p, {
        fontSize: "10px",
        color: this.svc.settings.state.colorblind === p ? "#ffe066" : "#aab7bb",
        backgroundColor: this.svc.settings.state.colorblind === p ? "#2c4048" : "#1c2a30",
        padding: { x: 5, y: 3 },
      }).setInteractive({ useHandCursor: true });
      lbl.on("pointerdown", () => {
        this.svc.settings.patch({ colorblind: p });
        this.svc.audio.playSfx(SFX.UiClick);
        this.scene.restart({ returnTo: this.returnTo });
      });
    });
    y += 40;

    const back = this.add.text(CANVAS_W / 2, CANVAS_H - 28, "[ Back ]", {
      fontSize: "12px", color: "#d6e2e6", backgroundColor: "#1c2a30", padding: { x: 12, y: 5 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    back.on("pointerdown", () => this.exit());
    this.input.keyboard!.once("keydown-ESC", () => this.exit());
  }

  private exit(): void {
    this.svc.audio.playSfx(SFX.UiClick);
    this.scene.stop();
    if (this.scene.isPaused(this.returnTo)) this.scene.resume(this.returnTo);
    else this.scene.start(this.returnTo);
  }

  private slider(label: string, y: number, initial: number, onSet: (v: number) => void): void {
    const x = 80, w = 360, h = 10;
    this.add.text(x, y - 14, label, { fontSize: "11px", color: "#d6e2e6" });
    const valTxt = this.add.text(x + w + 12, y - 14, `${Math.round(initial * 100)}%`,
      { fontSize: "11px", color: "#aab7bb" });
    const bg = this.add.rectangle(x, y, w, h, 0x22343a).setOrigin(0).setInteractive({ useHandCursor: true });
    const fill = this.add.rectangle(x, y, w * initial, h, 0x6fb56e).setOrigin(0);
    const apply = (px: number) => {
      const v = Phaser.Math.Clamp((px - x) / w, 0, 1);
      onSet(v); fill.width = w * v; valTxt.setText(`${Math.round(v * 100)}%`);
    };
    bg.on("pointerdown", (p: Phaser.Input.Pointer) => apply(p.x));
    bg.on("pointermove", (p: Phaser.Input.Pointer) => { if (p.isDown) apply(p.x); });
  }

  private toggle(label: string, y: number, get: () => boolean, set: (v: boolean) => void): void {
    this.add.text(60, y, label, { fontSize: "11px", color: "#d6e2e6" });
    const v = get();
    const btn = this.add.text(420, y, v ? "[ ON ]" : "[ OFF ]", {
      fontSize: "11px",
      color: v ? "#6fb56e" : "#aab7bb",
      backgroundColor: "#1c2a30",
      padding: { x: 8, y: 3 },
    }).setOrigin(0).setInteractive({ useHandCursor: true });
    btn.on("pointerdown", () => {
      set(!get());
      this.svc.audio.playSfx(SFX.UiClick);
      this.scene.restart({ returnTo: this.returnTo });
    });
  }
}
