/**
 * SaveSlotsScene — 3 save slots with playtime, last-played, biome preview.
 */
import Phaser from "phaser";
import { SCENE, CANVAS_W, CANVAS_H } from "../core/Constants";
import { SERVICE_REGISTRY_KEY } from "../core/Game";
import type { GameServices } from "../core/Game";
import { getMap } from "../data/mapDefs";
import { SFX } from "../data/audioKeys";

export class SaveSlotsScene extends Phaser.Scene {
  private svc!: GameServices;

  constructor() { super(SCENE.SaveSlots); }

  create() {
    this.svc = this.registry.get(SERVICE_REGISTRY_KEY) as GameServices;
    this.input.topOnly = true;
    this.add.rectangle(0, 0, CANVAS_W, CANVAS_H, 0x0b1416, 0.97).setOrigin(0);
    this.add.text(CANVAS_W / 2, 28, "Save Slots",
      { fontSize: "20px", color: "#e6efe2", fontStyle: "bold" }).setOrigin(0.5);

    const slots = this.svc.save.listSlots();
    slots.forEach((entry, i) => this.renderSlot(i, entry.meta));

    let y = 380;
    this.btn(CANVAS_W / 2 - 100, y, "Export JSON", () => {
      this.svc.save.exportDownload();
      this.svc.audio.playSfx(SFX.UiClick);
    });
    this.btn(CANVAS_W / 2 + 100, y, "Import JSON", async () => {
      const ok = await this.svc.save.importFile();
      this.svc.audio.playSfx(SFX.UiClick);
      if (ok) {
        this.svc.settings.syncFromSave();
        this.scene.start(SCENE.Overworld);
      }
    });
    y += 40;
    this.btn(CANVAS_W / 2, y, "<- Back", () => {
      this.svc.audio.playSfx(SFX.UiClick);
      this.scene.start(SCENE.MainMenu);
    });

    this.input.keyboard!.once("keydown-ESC", () => this.scene.start(SCENE.MainMenu));
  }

  private renderSlot(i: number,
    meta: ReturnType<GameServices["save"]["listSlots"]>[number]["meta"]): void {
    const w = CANVAS_W - 80, h = 80;
    const x = 40, y = 70 + i * (h + 14);
    this.add.rectangle(x, y, w, h, 0x14252b).setOrigin(0).setStrokeStyle(1, 0x2c4048);
    if (!meta) {
      this.add.text(x + 14, y + 28, `Slot ${i + 1} - Empty`,
        { fontSize: "14px", color: "#7d8a8e" });
      const newBtn = this.add.text(x + w - 14, y + 28, "[ New Game ]", {
        fontSize: "12px", color: "#6fb56e",
        backgroundColor: "#1c2a30", padding: { x: 8, y: 4 },
      }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
      newBtn.on("pointerdown", () => this.startFresh(i));
      return;
    }
    const mapName = getMap(meta.mapId).name;
    const date = new Date(meta.savedAt);
    const playtime = this.formatTime(meta.playtimeSec);
    this.add.text(x + 14, y + 8, `Slot ${i + 1} - ${mapName}`,
      { fontSize: "13px", color: "#e6efe2", fontStyle: "bold" });
    this.add.text(x + 14, y + 26,
      `${meta.coins}c  Rod ${meta.rod}  ${meta.totalCaught} caught`,
      { fontSize: "10px", color: "#aab7bb" });
    this.add.text(x + 14, y + 42,
      `Playtime ${playtime}  -  Last played ${date.toLocaleString()}`,
      { fontSize: "9px", color: "#7d8a8e" });

    const load = this.add.text(x + w - 230, y + 50, "[ Load ]", {
      fontSize: "12px", color: "#d6e2e6",
      backgroundColor: "#1c2a30", padding: { x: 8, y: 4 },
    }).setOrigin(0, 0).setInteractive({ useHandCursor: true });
    load.on("pointerdown", () => {
      if (this.svc.save.load(i)) {
        this.svc.settings.syncFromSave();
        this.scene.start(SCENE.Overworld);
      }
    });

    const nw = this.add.text(x + w - 140, y + 50, "[ Overwrite ]", {
      fontSize: "12px", color: "#ffe066",
      backgroundColor: "#1c2a30", padding: { x: 8, y: 4 },
    }).setOrigin(0, 0).setInteractive({ useHandCursor: true });
    nw.on("pointerdown", () => this.startFresh(i));

    const del = this.add.text(x + w - 18, y + 50, "[ Delete ]", {
      fontSize: "12px", color: "#ff8a8a",
      backgroundColor: "#1c2a30", padding: { x: 8, y: 4 },
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    del.on("pointerdown", () => {
      this.svc.save.clear(i);
      this.svc.audio.playSfx(SFX.UiClick);
      this.scene.restart();
    });
  }

  private startFresh(slot: number): void {
    this.svc.save.reset();
    this.svc.save.setSlot(slot);
    this.svc.save.save(slot);
    this.svc.settings.syncFromSave();
    this.scene.start(SCENE.Overworld);
  }

  private btn(x: number, y: number, label: string, cb: () => void): void {
    const t = this.add.text(x, y, label, {
      fontSize: "12px", color: "#d6e2e6",
      backgroundColor: "#1c2a30", padding: { x: 12, y: 5 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    t.on("pointerdown", cb);
    t.on("pointerover", () => t.setBackgroundColor("#2c4048"));
    t.on("pointerout", () => t.setBackgroundColor("#1c2a30"));
  }

  private formatTime(sec: number): string {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }
}
