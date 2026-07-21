/**
 * BestiaryScene — Stage 3: grid + detail with biome filter, silhouettes,
 * lore + personal best weight.
 */
import Phaser from "phaser";
import { SCENE, CANVAS_W, CANVAS_H } from "../core/Constants";
import { SERVICE_REGISTRY_KEY } from "../core/Game";
import type { GameServices } from "../core/Game";
import { FISH_DEFS, type FishDef } from "../data/fishDefs";
import { BIOMES, type BiomeId } from "../data/mapDefs";
import { SFX } from "../data/audioKeys";
import { rarityStyle } from "../data/rarityDefs";

const rarHex = (r: string) => rarityStyle(r).hex;

export class BestiaryScene extends Phaser.Scene {
  private svc!: GameServices;
  private filter: BiomeId | "all" = "all";
  private listLayer!: Phaser.GameObjects.Container;
  private detail!: Phaser.GameObjects.Container;
  private selected: FishDef | null = null;

  constructor() { super(SCENE.Bestiary); }

  create() {
    this.svc = this.registry.get(SERVICE_REGISTRY_KEY) as GameServices;
    this.input.topOnly = true;
    this.add.rectangle(0, 0, CANVAS_W, CANVAS_H, 0x0b1416, 0.96).setOrigin(0);
    this.add.text(20, 14, "Bestiary", { fontSize: "16px", color: "#e6efe2", fontStyle: "bold" });
    this.add.text(CANVAS_W - 20, 16, this.summary(),
      { fontSize: "10px", color: "#aab7bb" }).setOrigin(1, 0);
    this.discoveryBar();

    const tabs: Array<BiomeId | "all"> = ["all", ...BIOMES];
    const tabW = (CANVAS_W - 40) / tabs.length;
    tabs.forEach((t, i) => {
      const x = 20 + i * tabW + tabW / 2;
      const lbl = t === "all" ? "All" : t;
      const txt = this.add.text(x, 38, lbl, {
        fontSize: "9px",
        color: this.filter === t ? "#ffe066" : "#aab7bb",
        backgroundColor: this.filter === t ? "#2c4048" : "#1c2a30",
        padding: { x: 6, y: 3 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      txt.on("pointerdown", () => {
        this.filter = t; this.svc.audio.playSfx(SFX.UiClick);
        this.scene.restart();
      });
    });

    this.listLayer = this.add.container(0, 0);
    this.detail = this.add.container(0, 0);
    this.renderGrid();
    this.renderDetail();

    this.add.text(CANVAS_W / 2, CANVAS_H - 14, "Click a fish - ESC to close",
      { fontSize: "9px", color: "#7d8a8e" }).setOrigin(0.5);
    this.input.keyboard!.once("keydown-ESC", () => {
      this.scene.stop();
      this.scene.resume(SCENE.Overworld);
    });
  }

  private discoveryBar(): void {
    const all = Object.values(FISH_DEFS);
    const pool = this.filter === "all" ? all : all.filter((f) => (f.biomeTags ?? []).includes(this.filter));
    const seen = pool.filter((f) => (this.svc.save.state.caught?.[f.id] ?? 0) > 0).length;
    const ratio = pool.length ? seen / pool.length : 0;
    const bw = CANVAS_W - 220, bx = 20, by = 56;
    this.add.rectangle(bx, by, bw, 5, 0x22343a).setOrigin(0, 0.5);
    this.add.rectangle(bx, by, Math.max(2, bw * ratio), 5, ratio >= 1 ? 0xffc23d : 0x6fb56e).setOrigin(0, 0.5);
    this.add.text(bx + bw + 8, by, `${seen}/${pool.length}`, { fontSize: "9px", color: "#aab7bb" }).setOrigin(0, 0.5);
  }

  private summary(): string {
    const all = Object.values(FISH_DEFS);
    const seen = all.filter((f) => (this.svc.save.state.caught?.[f.id] ?? 0) > 0).length;
    return `Discovered ${seen}/${all.length}`;
  }

  private renderGrid(): void {
    this.listLayer.removeAll(true);
    const all = Object.values(FISH_DEFS).filter((f) =>
      this.filter === "all" ? true : (f.biomeTags ?? []).includes(this.filter)
    );
    const cols = 6;
    const cell = 54;
    const startX = 20 + cell / 2;
    const startY = 70;
    all.forEach((f, i) => {
      const cx = startX + (i % cols) * cell;
      const cy = startY + Math.floor(i / cols) * cell;
      const seen = (this.svc.save.state.caught?.[f.id] ?? 0) > 0;
      const bg = this.add.rectangle(cx, cy, cell - 6, cell - 6, seen ? 0x16242b : 0x1c2a30)
        .setStrokeStyle(seen ? 2 : 1, seen ? rarityStyle(f.rarity).color : 0x2c4048, seen ? 0.95 : 1)
        .setInteractive({ useHandCursor: true });
      bg.on("pointerdown", () => {
        this.selected = f;
        this.svc.audio.playSfx(SFX.UiClick);
        this.renderDetail();
      });
      this.listLayer.add(bg);
      const key = `fish.${f.id}`;
      if (this.textures.exists(key)) {
        const img = this.add.image(cx, cy - 4, key).setScale(1.3);
        if (!seen) img.setTint(0x000000).setAlpha(0.6);
        this.listLayer.add(img);
      } else {
        this.listLayer.add(this.add.text(cx, cy - 4, "?",
          { fontSize: "14px", color: "#5b676b" }).setOrigin(0.5));
      }
      this.listLayer.add(this.add.text(cx, cy + 18, seen ? f.name : "???", {
        fontSize: "7px",
        color: seen ? rarHex(f.rarity) : "#5b676b",
      }).setOrigin(0.5));
    });
  }

  private renderDetail(): void {
    this.detail.removeAll(true);
    const panelX = CANVAS_W - 200, panelY = 70, panelW = 180, panelH = 360;
    this.detail.add(this.add.rectangle(panelX, panelY, panelW, panelH, 0x0e1a1f)
      .setOrigin(0).setStrokeStyle(1, 0x2c4048));
    const f = this.selected;
    if (!f) {
      this.detail.add(this.add.text(panelX + panelW / 2, panelY + 30,
        "Pick a fish -->", { fontSize: "10px", color: "#7d8a8e" }).setOrigin(0.5));
      return;
    }
    const seen = (this.svc.save.state.caught?.[f.id] ?? 0) > 0;
    this.detail.add(this.add.text(panelX + 10, panelY + 8, seen ? f.name : "???", {
      fontSize: "13px",
      color: seen ? rarHex(f.rarity) : "#5b676b",
      fontStyle: "bold",
    }));
    this.detail.add(this.add.text(panelX + 10, panelY + 26, `(${f.rarity})`,
      { fontSize: "9px", color: "#aab7bb" }));
    const key = `fish.${f.id}`;
    if (this.textures.exists(key)) {
      const sprite = this.add.image(panelX + panelW / 2, panelY + 70, key).setScale(2);
      if (!seen) sprite.setTint(0x000000).setAlpha(0.6);
      this.detail.add(sprite);
    }
    let y = panelY + 110;
    const line = (s: string, color = "#d6e2e6") => {
      this.detail.add(this.add.text(panelX + 10, y, s, {
        fontSize: "9px", color, wordWrap: { width: panelW - 20 },
      }));
      y += 14 + Math.floor(s.length / 30) * 10;
    };
    if (seen) {
      const count = this.svc.save.state.caught[f.id] ?? 0;
      const best = (this.svc.save.state.bestWeight ?? {})[f.id] ?? 0;
      line(`Caught: ${count}`);
      line(`Personal best: ${best.toFixed(2)}kg`);
      line(`Value: ${f.price}c`);
      line(`Weight: ${f.weightKg?.[0]}-${f.weightKg?.[1]}kg`, "#aab7bb");
      line(`Biomes: ${(f.biomeTags ?? []).join(", ")}`, "#aab7bb");
      if (f.activeWindows?.length) line(`Active: ${f.activeWindows.join(", ")}`, "#aab7bb");
      if (f.baitPreference?.length) line(`Prefers: ${f.baitPreference.join(", ")}`, "#aab7bb");
      if (f.behaviors?.length) line(`Behavior: ${f.behaviors.join(", ")}`, "#aab7bb");
      if (f.lore) line(`"${f.lore}"`, "#bbb59c");
    } else {
      line(f.bestiaryHint ?? "Hint: keep fishing!", "#7d8a8e");
    }
  }
}
