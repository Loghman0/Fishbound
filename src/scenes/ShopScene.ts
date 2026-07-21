/**
 * ShopScene — Phase B: sectioned shop with a sell summary (rarity breakdown),
 * current→next gear stats, boat icon and coin-burst purchase feedback.
 */
import Phaser from "phaser";
import { SCENE, CANVAS_W, CANVAS_H, ROD_MAX, BAIT_PACK_COST, BAIT_PACK_AMOUNT } from "../core/Constants";
import { SERVICE_REGISTRY_KEY } from "../core/Game";
import type { GameServices } from "../core/Game";
import { getRod } from "../data/rodDefs";
import { FISH_DEFS } from "../data/fishDefs";
import { rarityStyle, RARITY_ORDER } from "../data/rarityDefs";
import { SFX } from "../data/audioKeys";
import { FeedbackOverlay } from "../ui/FeedbackOverlay";

export class ShopScene extends Phaser.Scene {
  private svc!: GameServices;
  private fx!: FeedbackOverlay;

  constructor() { super(SCENE.Shop); }

  create() {
    this.svc = this.registry.get(SERVICE_REGISTRY_KEY) as GameServices;
    this.input.topOnly = true;
    this.fx = new FeedbackOverlay(this);
    this.svc.audio.playSfx(SFX.ShopBell);
    this.render();
    this.input.keyboard!.once("keydown-ESC", () => {
      this.scene.stop();
      this.scene.resume(SCENE.Overworld);
    });
  }

  private sellBreakdown(): string {
    const counts: Record<string, number> = {};
    for (const e of this.svc.inventory.list()) {
      if (e.kind === "item") continue;
      const rar = e.kind === "junk" ? "junk" : FISH_DEFS[e.id]?.rarity ?? "common";
      counts[rar] = (counts[rar] ?? 0) + e.qty;
    }
    const parts: string[] = [];
    for (const r of RARITY_ORDER) if (counts[r]) parts.push(`${counts[r]} ${rarityStyle(r).label.toLowerCase()}`);
    return parts.join(" · ") || "nothing to sell";
  }

  private render() {
    this.children.removeAll();
    const s = this.svc.save.state;
    this.add.rectangle(0, 0, CANVAS_W, CANVAS_H, 0x0b1416, 0.95).setOrigin(0).setScrollFactor(0);
    this.add.text(CANVAS_W / 2, 26, "Bait & Tackle", { fontSize: "20px", color: "#e6efe2" }).setOrigin(0.5);
    this.add.text(CANVAS_W / 2, 50, `${s.coins}¢   ·   Bait ${s.bait}`, { fontSize: "12px", color: "#ffe066" }).setOrigin(0.5);

    // ── Sell panel ──
    this.panel(40, 74, CANVAS_W - 80, 58, "SELL CATCHES");
    this.add.text(56, 100, this.sellBreakdown(), { fontSize: "10px", color: "#aab7bb", wordWrap: { width: 360 } });
    const sellVal = this.svc.inventory.totalSellValue();
    this.button(CANVAS_W - 150, 104, `Sell all  ·  ${sellVal}¢`, sellVal > 0, () => {
      const r = this.svc.economy.sellAll();
      this.svc.audio.playSfx(SFX.Coin);
      this.fx.burst(CANVAS_W / 2, CANVAS_H / 2, 0xffe066, 16, 220);
      this.fx.toast(`Sold ${r.sold} for ${r.earned}¢`, "#ffe066");
      this.render();
    });

    // ── Rod ──
    this.panel(40, 144, CANVAS_W - 80, 70, "ROD");
    const rod = getRod(s.rod);
    // Draw the rod image from assets
    this.add.image(60, 178, 'rod.' + s.rod).setOrigin(0.5).setScale(2);

    this.add.text(80, 170, `${rod.name}`, { fontSize: "11px", color: "#d6e2e6" });
    this.add.text(80, 186, `pwr ${rod.power.toFixed(2)} · luck ${rod.luck.toFixed(2)} · tol ${rod.tensionTolerance}`,
      { fontSize: "9px", color: "#7d8a8e" });
    if (s.rod < ROD_MAX) {
      const next = getRod(s.rod + 1);
      this.add.text(80, 202, `→ ${next.name}  (pwr ${next.power.toFixed(2)} · tol ${next.tensionTolerance})`,
        { fontSize: "9px", color: "#9ccf86" });
      this.button(CANVAS_W - 150, 180, `Upgrade · ${next.cost}¢`, this.svc.economy.canBuyRod(), () => {
        if (this.svc.economy.buyRod()) { this.svc.audio.playSfx(SFX.Coin); this.fx.toast(`Equipped ${next.name}`, "#9ccf86"); this.render(); }
      });
    } else {
      this.add.text(CANVAS_W - 150, 184, "Maxed ✓", { fontSize: "11px", color: "#6fb56e" });
    }



    // ── Banka Yatırımı (YENİ SİSTEM) ──
    this.panel(40, 226, CANVAS_W - 80, 68, "BANK KOOPERATİVİ");
    const invLvl = s.flagCounters["investment"] || 0;
    const invCost = 200 + (invLvl * 150);
    this.add.text(56, 246, `Yatırım Səviyyəsi: ${invLvl}\nHər səhər passiv gəlir: ${invLvl * 25}¢`, { fontSize: "10px", color: "#aab7bb", lineSpacing: 4 });
    this.button(CANVAS_W - 146, 262, `Yüksəlt · ${invCost}¢`, s.coins >= invCost, () => {
      s.coins -= invCost;
      s.flagCounters["investment"] = invLvl + 1;
      this.svc.audio.playSfx(SFX.Coin);
      this.fx.toast("Yatırım səviyyəsi artdı!", "#ffe066");
      this.render();
    });

    // ── Bait ──
    this.panel(40, 308, CANVAS_W - 80, 50, "BAIT");
    this.add.text(56, 330, `Restocks your bait supply.`, { fontSize: "10px", color: "#aab7bb" });
    this.button(CANVAS_W - 150, 332, `Buy ×${BAIT_PACK_AMOUNT} · ${BAIT_PACK_COST}¢`, s.coins >= BAIT_PACK_COST, () => {
      if (this.svc.economy.buyBait()) { this.svc.audio.playSfx(SFX.Coin); this.fx.toast("Bait stocked.", "#ffe066"); this.render(); }
    });

    this.add.text(CANVAS_W / 2, CANVAS_H - 18, "ESC to close", { fontSize: "10px", color: "#7d8a8e" }).setOrigin(0.5);
  }

  private panel(x: number, y: number, w: number, h: number, title: string) {
    this.add.rectangle(x, y, w, h, 0x0e1a1f, 0.95).setOrigin(0).setStrokeStyle(1, 0x2c4048);
    this.add.text(x + 8, y + 6, title, { fontSize: "9px", color: "#6f8a90", fontStyle: "bold" });
  }

  private button(cx: number, cy: number, label: string, enabled: boolean, onClick: () => void) {
    const color = enabled ? "#0b1416" : "#5b676b";
    const bg = enabled ? "#9ccf86" : "#1c2a30";
    const t = this.add.text(cx, cy, label, {
      fontSize: "11px", color, backgroundColor: bg, fontStyle: "bold", padding: { x: 10, y: 6 },
    }).setOrigin(0.5);
    if (enabled) {
      t.setInteractive({ useHandCursor: true });
      t.on("pointerover", () => t.setBackgroundColor("#b7e3a3"));
      t.on("pointerout", () => t.setBackgroundColor(bg));
      t.on("pointerdown", onClick);
    }
  }
}
