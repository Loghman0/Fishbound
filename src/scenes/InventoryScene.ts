/**
 * InventoryScene — Phase 4: rarity-coded grid + click-to-Eat action for
 * consumable fish and snacks (restores stamina immediately).
 */
import Phaser from "phaser";
import { SCENE, CANVAS_W, CANVAS_H } from "../core/Constants";
import { SERVICE_REGISTRY_KEY } from "../core/Game";
import { SFX } from "../data/audioKeys";
import type { GameServices } from "../core/Game";
import { FISH_DEFS } from "../data/fishDefs";
import { ITEM_DEFS } from "../data/itemDefs";
import { rarityStyle } from "../data/rarityDefs";
import { Tooltip } from "../ui/Tooltip";
import { createPanel, createButton, pixelText } from "../ui/UIKit";
import { FONT_TITLE, UI_COLORS, TEXT_RESOLUTION } from "../core/Fonts";

interface ContextMenu {
  destroy: () => void;
}

export class InventoryScene extends Phaser.Scene {
  private svc!: GameServices;
  private contextMenu?: ContextMenu;
  private toastTxt?: Phaser.GameObjects.Text;

  constructor() { super(SCENE.Inventory); }

  private rarityOf(id: string, kind: string): string {
    if (kind === "junk") return "junk";
    if (kind === "item") return "common";
    return FISH_DEFS[id]?.rarity ?? "common";
  }

  create() {
    this.svc = this.registry.get(SERVICE_REGISTRY_KEY) as GameServices;
    this.input.topOnly = true;
    this.svc.audio.playSfx(SFX.UiClick);

    this.add.rectangle(0, 0, CANVAS_W, CANVAS_H, 0x000000, 0.6).setOrigin(0);
    const pw = 580, ph = 420;
    const px = (CANVAS_W - pw) / 2, py = (CANVAS_H - ph) / 2;
    createPanel(this, px, py, pw, ph, { title: "INVENTORY" });

    const tip = new Tooltip(this);

    const cap = 50;
    const weight = this.svc.inventory.totalWeight();
    const value = this.svc.inventory.totalSellValue();
    const ratio = Math.min(1, cap > 0 ? weight / cap : 0);

    // Capacity bar
    const barW = 280, barX = (CANVAS_W - barW) / 2, barY = py + 50;
    this.add.rectangle(barX, barY, barW, 12, 0x22343a).setOrigin(0, 0.5);
    const fillColor = ratio > 0.9 ? 0xff4d4d : ratio > 0.7 ? 0xffaa33 : 0x6fb56e;
    this.add.rectangle(barX, barY, Math.max(2, barW * ratio), 12, fillColor).setOrigin(0, 0.5);
    pixelText(this, CANVAS_W / 2, barY, `${weight.toFixed(1)} / ${cap} kg`, {
      size: 12, color: "#0b1416",
    }).setOrigin(0.5);
    pixelText(this, CANVAS_W / 2, barY + 18, `Total value: ${value} coins`, {
      size: 14, color: UI_COLORS.accent,
    }).setOrigin(0.5);

    const list = this.svc.inventory.list()
      .sort((a, b) => {
        const ra = rarityStyle(this.rarityOf(a.id, a.kind)).weight;
        const rb = rarityStyle(this.rarityOf(b.id, b.kind)).weight;
        if (rb !== ra) return rb - ra;
        return b.unitValue * b.qty - a.unitValue * a.qty;
      });

    if (list.length === 0) {
      pixelText(this, CANVAS_W / 2, CANVAS_H / 2, "Empty. Go catch something!", {
        size: 14, color: UI_COLORS.textMute,
      }).setOrigin(0.5);
    } else {
      const cols = 9, cell = 56;
      const gridW = cols * cell;
      const startX = (CANVAS_W - gridW) / 2;
      const startY = py + 110;
      list.forEach((e, i) => {
        const cx = startX + (i % cols) * cell + cell / 2;
        const cy = startY + Math.floor(i / cols) * cell + cell / 2;
        const rar = this.rarityOf(e.id, e.kind);
        const st = rarityStyle(rar);

        const box = this.add.rectangle(cx, cy, cell - 6, cell - 6, 0x14222a)
          .setStrokeStyle(2, st.color, 0.95)
          .setInteractive({ useHandCursor: true });
        this.add.circle(cx + (cell - 6) / 2 - 6, cy - (cell - 6) / 2 + 6, 3, st.color);

        const iconKey = e.kind === "fish" ? `fish.${e.id}` :
          e.kind === "junk" ? `junk.${e.id}` : null;
        if (iconKey && this.textures.exists(iconKey)) {
          this.add.image(cx, cy - 6, iconKey).setScale(1.5);
        } else if (e.kind === "item") {
          this.add.text(cx, cy - 6, "•", {
            fontFamily: FONT_TITLE, fontSize: "14px", color: st.hex,
            resolution: TEXT_RESOLUTION,
          }).setOrigin(0.5);
        }
        this.add.text(cx + 18, cy + 12, `x${e.qty}`, {
          fontFamily: FONT_TITLE, fontSize: "7px", color: "#ffffff",
          resolution: TEXT_RESOLUTION,
        }).setOrigin(1, 0.5);
        this.add.text(cx, cy + 22, e.name, {
          fontFamily: FONT_TITLE, fontSize: "6px", color: st.hex,
          resolution: TEXT_RESOLUTION,
        }).setOrigin(0.5);

        const def = FISH_DEFS[e.id];
        const itemDef = ITEM_DEFS[e.id];
        const stamina = this.svc.inventory.consumableStamina(e.id);
        const best = (this.svc.save.state.bestWeight ?? {})[e.id] ?? 0;
        const lines = [
          `${e.name}  (${st.label})`,
          `Qty ${e.qty}  ·  ${e.unitValue} coins each`,
          stamina > 0 ? `Eat to restore +${stamina} stamina` : "",
          best > 0 ? `Best: ${best.toFixed(2)} kg` : "",
          def?.lore ? `"${def.lore}"` : "",
          itemDef?.desc ?? "",
        ].filter(Boolean);
        box.on("pointerover", () => tip.show(cx + 24, cy - 24, lines.join("\n")));
        box.on("pointerout", () => tip.hide());
        box.on("pointerdown", () => this.openContextMenu(cx, cy, e.id, e.name, stamina));
      });
    }

    pixelText(this, CANVAS_W / 2, py + ph - 42,
      "Click an item for actions  ·  hover for details",
      { size: 12, color: UI_COLORS.textMute },
    ).setOrigin(0.5);
    createButton(this, CANVAS_W / 2, py + ph - 20, "CLOSE  (ESC / I)", {
      width: 200, height: 28, fontSize: 9,
      onClick: () => this.close(),
    });

    this.input.keyboard?.once("keydown-ESC", () => this.close());
    this.input.keyboard?.once("keydown-I", () => this.close());
  }

  private openContextMenu(x: number, y: number, id: string, name: string, stamina: number): void {
    this.contextMenu?.destroy();
    const w = 150, h = stamina > 0 ? 76 : 46;
    const cx = Phaser.Math.Clamp(x, w / 2 + 4, CANVAS_W - w / 2 - 4);
    const cy = Phaser.Math.Clamp(y, h / 2 + 4, CANVAS_H - h / 2 - 4);
    const panel = createPanel(this, cx - w / 2, cy - h / 2, w, h, { title: name.slice(0, 16).toUpperCase() });
    panel.setDepth(2000);

    const buttons: Phaser.GameObjects.Container[] = [];
    if (stamina > 0) {
      const eatBtn = createButton(this, cx, cy - 2, `EAT  +${stamina}`, {
        width: w - 16, height: 22, fontSize: 8,
        onClick: () => this.consume(id, name),
      });
      eatBtn.container.setDepth(2001);
      buttons.push(eatBtn.container);
    }
    const closeBtn = createButton(this, cx, cy + (stamina > 0 ? 22 : 0), "CLOSE", {
      width: w - 16, height: 22, fontSize: 8,
      onClick: () => this.contextMenu?.destroy(),
    });
    closeBtn.container.setDepth(2001);
    buttons.push(closeBtn.container);

    this.contextMenu = {
      destroy: () => {
        panel.destroy();
        buttons.forEach((b) => b.destroy());
        this.contextMenu = undefined;
      },
    };
  }

  private consume(id: string, name: string): void {
    const restored = this.svc.inventory.consume(id);
    if (restored <= 0) return;
    const s = this.svc.save.state;
    s.stamina = Math.min(s.maxStamina, s.stamina + restored);
    this.svc.audio.playSfx(SFX.Coin);
    this.showToast(`Ate ${name}: +${restored} stamina`);
    this.contextMenu?.destroy();
    this.scene.restart();
  }

  private showToast(msg: string): void {
    this.toastTxt?.destroy();
    this.toastTxt = pixelText(this, CANVAS_W / 2, 28, msg, {
      size: 14, color: UI_COLORS.accent, bg: "#0b1416cc", padX: 8, padY: 4,
    }).setOrigin(0.5).setDepth(3000);
    this.tweens.add({
      targets: this.toastTxt,
      alpha: 0, duration: 1400, delay: 700,
      onComplete: () => { this.toastTxt?.destroy(); this.toastTxt = undefined; },
    });
  }

  private close(): void {
    this.svc.audio.playSfx(SFX.UiClick);
    this.scene.stop();
    if (this.scene.isPaused(SCENE.Overworld)) this.scene.resume(SCENE.Overworld);
  }
}
