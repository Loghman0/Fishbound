/**
 * FeedbackOverlay — reusable juice helpers so every scene can throw up
 * celebratory banners, toasts, particle bursts and full catch cards without
 * re-implementing tweens each time. Screen-space (scrollFactor 0), high depth.
 */
import Phaser from "phaser";
import { rarityStyle } from "../data/rarityDefs";

export interface CatchCardOpts {
  fishKey?: string;      // texture key for the fish/junk sprite
  name: string;
  rarity: string;
  weightKg?: number;
  value?: number;
  isNewSpecies?: boolean;
  isRecord?: boolean;
  streak?: number;
  streakBonus?: number;
  /** Called when the card is dismissed (auto or by tap). */
  onDone?: () => void;
  /** Auto-dismiss after ms (0 = wait for input only). */
  autoMs?: number;
}

export class FeedbackOverlay {
  constructor(private scene: Phaser.Scene) {}

  private dot(key: string, color: number): string {
    if (this.scene.textures.exists(key)) return key;
    const g = this.scene.add.graphics();
    g.fillStyle(color, 1); g.fillCircle(3, 3, 3);
    g.generateTexture(key, 6, 6); g.destroy();
    return key;
  }

  /** Particle burst at a screen point. */
  burst(x: number, y: number, color: number, count = 14, power = 200): void {
    const tex = this.dot(`fx_burst_${color.toString(16)}`, color);
    const p = this.scene.add.particles(x, y, tex, {
      lifespan: 600, speed: { min: power * 0.4, max: power },
      angle: { min: 0, max: 360 }, gravityY: 120,
      quantity: count, scale: { start: 1.1, end: 0 }, emitting: false,
    }).setDepth(2100).setScrollFactor(0);
    p.explode(count);
    this.scene.time.delayedCall(900, () => p.destroy());
  }

  /** Full-screen color flash. */
  flash(color: number, alpha = 0.4, ms = 260): void {
    const w = this.scene.scale.width, h = this.scene.scale.height;
    const r = this.scene.add.rectangle(0, 0, w, h, color, alpha)
      .setOrigin(0).setDepth(2090).setScrollFactor(0);
    this.scene.tweens.add({ targets: r, alpha: 0, duration: ms, onComplete: () => r.destroy() });
  }

  /** Big celebratory banner that pops then fades. */
  banner(text: string, colorHex = "#ffe066", y?: number, size = 22): void {
    const cx = this.scene.scale.width / 2;
    const cy = y ?? this.scene.scale.height / 2 - 90;
    const t = this.scene.add.text(cx, cy, text, {
      fontSize: `${size}px`, color: colorHex, fontStyle: "bold",
      stroke: "#000000", strokeThickness: 4,
    }).setOrigin(0.5).setDepth(2110).setScrollFactor(0).setScale(0.3).setAlpha(0);
    this.scene.tweens.add({
      targets: t, scale: 1, alpha: 1, duration: 260, ease: "Back.Out",
      onComplete: () => this.scene.tweens.add({
        targets: t, alpha: 0, y: cy - 24, delay: 900, duration: 500,
        onComplete: () => t.destroy(),
      }),
    });
  }

  /** Small bottom toast. */
  toast(text: string, colorHex = "#ffffff"): void {
    const cx = this.scene.scale.width / 2;
    const t = this.scene.add.text(cx, 34, text, {
      fontSize: "12px", color: colorHex, backgroundColor: "#1c2a30dd",
      padding: { x: 10, y: 5 },
    }).setOrigin(0.5).setDepth(2100).setScrollFactor(0);
    this.scene.tweens.add({ targets: t, alpha: 0, y: 24, delay: 1300, duration: 700, onComplete: () => t.destroy() });
  }

  /** Catch splash card. Returns the container. */
  catchCard(o: CatchCardOpts): Phaser.GameObjects.Container {
    const W = this.scene.scale.width, H = this.scene.scale.height;
    const st = rarityStyle(o.rarity);
    const cardW = 240, cardH = 150;
    const cx = W / 2, cy = H / 2 + 10;
    const c = this.scene.add.container(cx, cy).setDepth(2120).setScrollFactor(0);

    // dim
    const dim = this.scene.add.rectangle(0, 0, W, H, 0x000000, 0.45).setScrollFactor(0).setDepth(2105);
    dim.setPosition(cx, cy);

    // glow + frame
    const glow = this.scene.add.rectangle(0, 0, cardW + 12, cardH + 12, st.glow, 0.35).setStrokeStyle(2, st.glow, 0.9);
    const panel = this.scene.add.rectangle(0, 0, cardW, cardH, 0x0e1a1f, 0.98).setStrokeStyle(3, st.color, 1);
    c.add(glow); c.add(panel);

    // rarity ribbon
    const ribbon = this.scene.add.text(0, -cardH / 2 + 14, st.label.toUpperCase(), {
      fontSize: "11px", color: st.hex, fontStyle: "bold",
    }).setOrigin(0.5);
    c.add(ribbon);

    // sprite
    if (o.fishKey && this.scene.textures.exists(o.fishKey)) {
      const img = this.scene.add.image(0, -16, o.fishKey).setScale(2.6);
      c.add(img);
      this.scene.tweens.add({ targets: img, y: -22, duration: 700, yoyo: true, repeat: -1, ease: "Sine.InOut" });
    }

    // name
    c.add(this.scene.add.text(0, 26, o.name, {
      fontSize: "16px", color: "#ffffff", fontStyle: "bold",
    }).setOrigin(0.5));

    // stats line
    const stats: string[] = [];
    if (o.weightKg != null && o.weightKg > 0) stats.push(`${o.weightKg.toFixed(2)} kg`);
    if (o.value != null && o.value > 0) stats.push(`${o.value}¢`);
    if (stats.length) {
      c.add(this.scene.add.text(0, 46, stats.join("   ·   "), {
        fontSize: "11px", color: "#aab7bb",
      }).setOrigin(0.5));
    }

    // streak chip
    if (o.streak && o.streak >= 2) {
      const txt = o.streakBonus ? `🔥 ${o.streak} streak  +${o.streakBonus}¢` : `🔥 ${o.streak} streak`;
      c.add(this.scene.add.text(0, cardH / 2 - 14, txt, {
        fontSize: "10px", color: "#ffb84d",
      }).setOrigin(0.5));
    }

    // entrance
    c.setScale(0.4).setAlpha(0);
    this.scene.tweens.add({ targets: c, scale: 1, alpha: 1, duration: 280, ease: "Back.Out" });
    this.scene.tweens.add({ targets: glow, alpha: 0.15, duration: 700, yoyo: true, repeat: -1 });

    // celebratory layers
    this.flash(st.color, 0.18 + st.hype * 0.18, 220);
    this.burst(cx, cy - 16, st.particle, Math.round(8 + st.hype * 22), 120 + st.hype * 220);
    if (o.isNewSpecies) this.banner("✦ NEW SPECIES ✦", "#9bf0a6", cy - cardH / 2 - 34, 18);
    if (o.isRecord) this.banner("★ NEW RECORD ★", "#ffd479", cy - cardH / 2 - (o.isNewSpecies ? 58 : 34), 18);

    const dismiss = () => {
      if (!c.active) return;
      this.scene.tweens.add({
        targets: [c, dim], alpha: 0, scale: 0.7, duration: 200,
        onComplete: () => { c.destroy(); dim.destroy(); o.onDone?.(); },
      });
    };

    const wait = o.autoMs ?? 1600;
    if (wait > 0) this.scene.time.delayedCall(wait, dismiss);
    return c;
  }
}
