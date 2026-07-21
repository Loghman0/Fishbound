/**
 * MainMenuScene — Phase 4 polish: perfectly centered crisp pixel text,
 * retro-styled buttons, no top-right text wrap. Layout rebuilds on resize.
 */
import Phaser from "phaser";
import { SCENE, CANVAS_W, CANVAS_H } from "../core/Constants";
import type { GameServices } from "../core/Game";
import { SERVICE_REGISTRY_KEY } from "../core/Game";
import { MUSIC, SFX } from "../data/audioKeys";
import { createButton, pixelText } from "../ui/UIKit";
import { FONT_TITLE, UI_COLORS, TEXT_RESOLUTION } from "../core/Fonts";

export class MainMenuScene extends Phaser.Scene {
  private svc!: GameServices;
  private root!: Phaser.GameObjects.Container;

  constructor() { super(SCENE.MainMenu); }

  create() {
    this.svc = this.registry.get(SERVICE_REGISTRY_KEY) as GameServices;
    this.input.topOnly = true;
    this.cameras.main.setBackgroundColor(UI_COLORS.bg);
    this.svc.audio.playMusic(MUSIC.Village);

    this.root = this.add.container(0, 0);
    this.buildLayout();
  }

  private buildLayout(): void {
    this.root.removeAll(true);

    const cx = CANVAS_W / 2;
    const title = this.add.text(cx, 70, "FISHBOUND 2", {
      fontFamily: FONT_TITLE,
      fontSize: "20px",
      color: UI_COLORS.text,
      resolution: TEXT_RESOLUTION,
      align: "center",
    }).setOrigin(0.5);
    title.setShadow(2, 3, "#000000", 0, true, true);

    const sub = pixelText(this, cx, 104, "v0.5.0  ·  Phase 4", {
      size: 14, color: UI_COLORS.textMute, align: "center",
    }).setOrigin(0.5);

    this.root.add([title, sub]);

    const slots = this.svc.save.listSlots();
    const latest = slots
      .filter((s) => s.meta)
      .sort((a, b) => (b.meta!.savedAt > a.meta!.savedAt ? 1 : -1))[0];

    type Item = { label: string; onClick: () => void };
    const items: Item[] = [];
    if (latest) {
      items.push({
        label: `CONTINUE (SLOT ${latest.slot + 1})`,
        onClick: () => {
          if (this.svc.save.load(latest.slot)) {
            this.svc.settings.syncFromSave();
            this.scene.start(SCENE.Overworld);
          }
        },
      });
    }
    items.push({ label: "NEW GAME",   onClick: () => this.startNewGame() });
    items.push({ label: "LOAD GAME",  onClick: () => this.scene.start(SCENE.SaveSlots) });
    items.push({ label: "SAVE SLOTS", onClick: () => this.scene.start(SCENE.SaveSlots) });
    items.push({ label: "SETTINGS",   onClick: () => this.scene.start(SCENE.Settings, { returnTo: SCENE.MainMenu }) });

    let y = 170;
    for (const it of items) {
      const handle = createButton(this, cx, y, it.label, {
        width: 240,
        height: 38,
        fontSize: 10,
        onClick: () => { this.svc.audio.playSfx(SFX.UiClick); it.onClick(); },
      });
      this.root.add(handle.container);
      y += 46;
    }

    const hint = pixelText(this, cx, CANVAS_H - 26,
      "WASD/Arrows move  ·  E interact  ·  ESC menu  ·  I B Q N C  ·  F5/F9 save/load",
      { size: 13, color: UI_COLORS.textMute, align: "center" },
    ).setOrigin(0.5);
    this.root.add(hint);
  }

  private startNewGame(): void {
    this.svc.save.reset();
    this.svc.settings.syncFromSave();
    this.scene.start(SCENE.Overworld);
  }
}
