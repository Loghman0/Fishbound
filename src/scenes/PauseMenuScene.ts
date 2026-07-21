/**
 * PauseMenuScene — ESC overlay menu.
 *
 * Uses `ui.esc_menu` (256×256 pixel art panel) as the backdrop.
 * The image is scaled to fill a 300×380 area centred on-screen.
 *
 * Key improvements:
 *  - Immediate `pointerdown` callbacks — zero lag.
 *  - ESC key is managed with a toggling `on/off` listener bound once;
 *    a small cooldown prevents double-fire.
 *  - The Overworld is paused cleanly; only the PauseMenu scene gets
 *    input while the overlay is open.
 */
import Phaser from "phaser";
import { SCENE, CANVAS_W, CANVAS_H } from "../core/Constants";
import { SERVICE_REGISTRY_KEY } from "../core/Game";
import type { GameServices } from "../core/Game";
import { SFX } from "../data/audioKeys";
import { FONT_TITLE, FONT_BODY, TEXT_RESOLUTION, UI_COLORS } from "../core/Fonts";

export const PAUSE_MENU_FLAG = "ui.pauseMenuOpen";

// ── Sizes ─────────────────────────────────────────────────────────────────
const PANEL_W = 300;
const PANEL_H = 380;

// Button visual constants
const BTN_W = 220;
const BTN_H = 30;
const BTN_GAP = 8;

const COLOR_IDLE = 0x1a2e36;
const COLOR_HOVER = 0x2c4a56;
const COLOR_ACTIVE = 0x3a5e6e;
const COLOR_BORDER = 0xd4af37;
const COLOR_BORDER_SOFT = 0x4a6a7a;

interface MenuEntry {
  label: string;
  action: () => void;
}

export class PauseMenuScene extends Phaser.Scene {
  private svc!: GameServices;
  private returnTo: string = SCENE.Overworld;

  /** Tracks whether we are currently "open" to prevent the ESC listener
   *  from double-triggering on the same key event. */
  private _escCooldown = false;

  constructor() { super(SCENE.PauseMenu); }

  init(data?: { returnTo?: string }) {
    if (data?.returnTo) this.returnTo = data.returnTo;
  }

  create() {
    this.svc = this.registry.get(SERVICE_REGISTRY_KEY) as GameServices;
    this.registry.set(PAUSE_MENU_FLAG, true);
    this.input.topOnly = true;
    this.svc.audio.playSfx(SFX.UiClick);

    // ── Dim, click-outside-to-close backdrop ─────────────────────────────
    const backdrop = this.add
      .rectangle(0, 0, CANVAS_W, CANVAS_H, 0x000000, 0.62)
      .setOrigin(0)
      .setInteractive()          // captures mouse so world doesn't receive it
      .setDepth(0);
    backdrop.on("pointerdown", () => this.close());

    // ── Panel centred on screen ───────────────────────────────────────────
    const cx = CANVAS_W / 2;
    const cy = CANVAS_H / 2;
    const px = cx - PANEL_W / 2;
    const py = cy - PANEL_H / 2;

    // Background art — scale the 256×256 PNG to fill PANEL_W × PANEL_H
    const hasImg = this.textures.exists("ui.esc_menu");
    if (hasImg) {
      this.add.image(cx, cy, "ui.esc_menu")
        .setDisplaySize(PANEL_W, PANEL_H)
        .setDepth(1)
        .setInteractive(); // block backdrop clicks over the panel area
    } else {
      // Fallback if somehow image isn't loaded yet
      this.add.rectangle(px, py, PANEL_W, PANEL_H, 0x0e1a22, 0.97)
        .setOrigin(0)
        .setDepth(1)
        .setStrokeStyle(2, COLOR_BORDER, 1)
        .setInteractive();
    }

    // ── Title ─────────────────────────────────────────────────────────────
    this.add.text(cx, py + 28, "MENU", {
      fontFamily: FONT_TITLE,
      fontSize: "14px",
      color: UI_COLORS.accent,
      resolution: TEXT_RESOLUTION,
    }).setOrigin(0.5).setDepth(2);

    this.add.text(cx, py + 50, "PAUSED", {
      fontFamily: FONT_BODY,
      fontSize: "10px",
      color: UI_COLORS.textMute,
      resolution: TEXT_RESOLUTION,
    }).setOrigin(0.5).setDepth(2);

    // Decorative divider line
    this.add.rectangle(cx, py + 64, PANEL_W - 32, 1, COLOR_BORDER, 0.6)
      .setOrigin(0.5, 0).setDepth(2);

    // ── Menu items ────────────────────────────────────────────────────────
    const items: MenuEntry[] = [
      { label: "RESUME", action: () => this.close() },
      { label: "INVENTORY  [I]", action: () => this.launch(SCENE.Inventory) },
      { label: "SHOP  [B]", action: () => this.launch(SCENE.Shop) },
      { label: "QUESTS  [Q]", action: () => this.launch(SCENE.QuestLog) },
      { label: "BESTIARY  [J]", action: () => this.launch(SCENE.Bestiary) },
      { label: "WARDROBE  [C]", action: () => this.launch(SCENE.Wardrobe) },
      { label: "SETTINGS", action: () => this.launch(SCENE.Settings, { returnTo: SCENE.Overworld }) },
      { label: "SAVE GAME", action: () => this.quickSave() },
    ];

    const listTop = py + 80;
    items.forEach((item, i) => {
      this.makeButton(cx, listTop + i * (BTN_H + BTN_GAP), item.label, item.action);
    });

    // ── Hint text ─────────────────────────────────────────────────────────
    this.add.text(cx, py + PANEL_H - 18, "ESC to close", {
      fontFamily: FONT_BODY,
      fontSize: "9px",
      color: UI_COLORS.textMute,
      resolution: TEXT_RESOLUTION,
    }).setOrigin(0.5).setDepth(2);

    // ── ESC key listener — toggle off ─────────────────────────────────────
    this._escCooldown = false;
    this.input.keyboard?.on("keydown-ESC", this.onEsc, this);
  }

  /** One clean handler — no `once`, we need it while the scene is alive. */
  private onEsc() {
    if (this._escCooldown) return;
    this._escCooldown = true;
    this.close();
  }

  // ── Button factory ──────────────────────────────────────────────────────
  private makeButton(cx: number, cy: number, label: string, action: () => void): void {
    const depth = 3;

    const bg = this.add.rectangle(cx, cy, BTN_W, BTN_H, COLOR_IDLE, 0.95)
      .setDepth(depth)
      .setStrokeStyle(1, COLOR_BORDER_SOFT, 1);

    const txt = this.add.text(cx, cy, label, {
      fontFamily: FONT_TITLE,
      fontSize: "9px",
      color: UI_COLORS.text,
      resolution: TEXT_RESOLUTION,
      align: "center",
    }).setOrigin(0.5).setDepth(depth + 1);

    // Hit area covers exactly the button rectangle
    const hitZone = this.add.zone(cx, cy, BTN_W, BTN_H)
      .setDepth(depth + 2)
      .setInteractive({ useHandCursor: true });

    hitZone.on("pointerover", () => {
      bg.setFillStyle(COLOR_HOVER, 1);
      bg.setStrokeStyle(2, COLOR_BORDER, 1);
      txt.setColor(UI_COLORS.accent);
    });

    hitZone.on("pointerout", () => {
      bg.setFillStyle(COLOR_IDLE, 0.95);
      bg.setStrokeStyle(1, COLOR_BORDER_SOFT, 1);
      txt.setColor(UI_COLORS.text);
    });

    hitZone.on("pointerdown", () => {
      bg.setFillStyle(COLOR_ACTIVE, 1);
      bg.setStrokeStyle(2, COLOR_BORDER, 1);
      txt.setColor(UI_COLORS.accent);
    });

    // Action fires on pointerup for immediate feel — no delay, no polling
    hitZone.on("pointerup", () => {
      this.svc.audio.playSfx(SFX.UiClick);
      action();
    });
  }

  // ── Actions ─────────────────────────────────────────────────────────────
  private launch(target: string, payload?: Record<string, unknown>): void {
    this.registry.set(PAUSE_MENU_FLAG, false);
    this.input.keyboard?.off("keydown-ESC", this.onEsc, this);
    this.scene.stop();
    this.scene.launch(target, payload);
  }

  private quickSave(): void {
    this.svc.save.save(0);
    this.svc.audio.playSfx(SFX.Coin);
    // Show a small inline toast without closing the menu
    const toast = this.add.text(CANVAS_W / 2, CANVAS_H / 2 + PANEL_H / 2 - 10, "✔  Game Saved!", {
      fontFamily: FONT_BODY,
      fontSize: "11px",
      color: "#9ccf86",
      backgroundColor: "#0b1416cc",
      padding: { x: 10, y: 5 },
      resolution: TEXT_RESOLUTION,
    }).setOrigin(0.5).setDepth(10);
    this.tweens.add({
      targets: toast,
      alpha: 0, y: toast.y - 18,
      duration: 1200, delay: 600,
      onComplete: () => toast.destroy(),
    });
  }

  private close(): void {
    this.svc.audio.playSfx(SFX.UiClick);
    this.registry.set(PAUSE_MENU_FLAG, false);
    this.input.keyboard?.off("keydown-ESC", this.onEsc, this);
    this.scene.stop();
    if (this.scene.isPaused(this.returnTo)) this.scene.resume(this.returnTo);
  }
}
