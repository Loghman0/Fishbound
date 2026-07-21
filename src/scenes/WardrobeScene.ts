/**
 * WardrobeScene — Phase 4. Lets the player browse and equip unlocked
 * cosmetics from any location (no longer tied to a physical building).
 */
import Phaser from "phaser";
import { SCENE, CANVAS_W, CANVAS_H } from "../core/Constants";
import { SERVICE_REGISTRY_KEY } from "../core/Game";
import type { GameServices } from "../core/Game";
import { SFX } from "../data/audioKeys";
import { COSMETIC_DEFS, getCosmetic } from "../data/cosmeticDefs";
import { createPanel, createButton, pixelText } from "../ui/UIKit";
import { FONT_TITLE, UI_COLORS, TEXT_RESOLUTION } from "../core/Fonts";

export class WardrobeScene extends Phaser.Scene {
  private svc!: GameServices;
  constructor() { super(SCENE.Wardrobe); }

  create() {
    this.svc = this.registry.get(SERVICE_REGISTRY_KEY) as GameServices;
    this.input.topOnly = true;
    this.svc.audio.playSfx(SFX.UiClick);

    this.add.rectangle(0, 0, CANVAS_W, CANVAS_H, 0x000000, 0.55).setOrigin(0);
    const pw = 480, ph = 360;
    const px = (CANVAS_W - pw) / 2, py = (CANVAS_H - ph) / 2;
    createPanel(this, px, py, pw, ph, { title: "WARDROBE" });

    this.add.text(CANVAS_W / 2, py + 40, "EQUIP A LOOK", {
      fontFamily: FONT_TITLE, fontSize: "10px",
      color: UI_COLORS.accent, resolution: TEXT_RESOLUTION,
    }).setOrigin(0.5);

    const ids = Object.keys(COSMETIC_DEFS);
    const cols = 4;
    const cell = 96;
    const gridW = cols * cell;
    const startX = (CANVAS_W - gridW) / 2 + cell / 2;
    const startY = py + 80;

    ids.forEach((id, i) => {
      const cx = startX + (i % cols) * cell;
      const cy = startY + Math.floor(i / cols) * cell;
      const cos = getCosmetic(id);
      const unlocked = this.svc.wardrobe.isUnlocked(id);
      const equipped = this.svc.wardrobe.current() === id;

      const slot = this.add.rectangle(cx, cy, cell - 12, cell - 12,
        equipped ? 0x2c4048 : 0x14222a, 1)
        .setStrokeStyle(2, equipped ? 0xffe066 : 0x7a6420, 1)
        .setInteractive({ useHandCursor: unlocked });

      const tex = cos.fallbackTexture;
      if (this.textures.exists(tex)) {
        this.add.image(cx, cy - 12, tex).setScale(1).setAlpha(unlocked ? 1 : 0.25);
      }
      this.add.text(cx, cy + 24,
        unlocked ? cos.name : "Locked",
        { fontFamily: FONT_TITLE, fontSize: "7px",
          color: equipped ? "#ffe066" : (unlocked ? "#d6e2e6" : "#7d8a8e"),
          resolution: TEXT_RESOLUTION }).setOrigin(0.5);

      if (unlocked) {
        slot.on("pointerdown", () => {
          if (this.svc.wardrobe.equip(id)) {
            this.svc.audio.playSfx(SFX.Coin);
            this.scene.restart();
          }
        });
      }
    });

    createButton(this, CANVAS_W / 2, py + ph - 24, "CLOSE", {
      width: 140, height: 32, fontSize: 9,
      onClick: () => this.close(),
    });

    this.input.keyboard?.once("keydown-ESC", () => this.close());
    this.input.keyboard?.once("keydown-C", () => this.close());
  }

  private close(): void {
    this.svc.audio.playSfx(SFX.UiClick);
    this.scene.stop();
    if (this.scene.isPaused(SCENE.Overworld)) this.scene.resume(SCENE.Overworld);
  }
}
