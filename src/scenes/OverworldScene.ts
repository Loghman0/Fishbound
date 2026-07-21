/**
 * OverworldScene — Comprehensive overhaul:
 *  - Tiled-layer water detection for fishing (reads 'water' and 'water_anim' layers)
 *  - Building proximity interactions: Shop, Quest log, Home
 *  - Home dialog: Rest (restore stamina) + Toggle time of day
 *  - Evening/Morning ambient tint system
 *  - Time-of-day fishing loot modifiers
 */

import Phaser from "phaser";
import {
  SCENE, TILE, INTERACT_DIST,
  CANVAS_W as CANVAS_W_LOCAL, CANVAS_H as CANVAS_H_LOCAL, MAP_W, MAP_H,
} from "../core/Constants";
import { SERVICE_REGISTRY_KEY } from "../core/Game";
import type { GameServices } from "../core/Game";
import { REST_REGEN_PER_SEC } from "../core/Balance";
import { Player } from "../entities/Player";
import { HUD } from "../ui/HUD";
import { getMap, type PortalDef } from "../data/mapDefs";
import { EventBus } from "../core/EventBus";
import { SFX } from "../data/audioKeys";
import { InputManager } from "../input/InputManager";
import { TouchControls } from "../input/TouchControls";
import { SceneLifecycle } from "../core/SceneLifecycle";
import { getCosmetic } from "../data/cosmeticDefs";
import { getTheme, type MapTheme, type DecorFx } from "../data/mapThemes";
import { FeedbackOverlay } from "../ui/FeedbackOverlay";
import { FONT_TITLE, FONT_BODY, TEXT_RESOLUTION, UI_COLORS } from "../core/Fonts";

// ── Building zones from Tiled object layer (tile coords) ──────────────────────
// Derived by dividing pixel coords by 32 and rounding
const BUILDING_ZONES = {
  shop: { tx: 1, ty: 0, tw: 6, th: 6 },
  quest: { tx: 7, ty: 0, tw: 6, th: 6 },
  home: { tx: 13, ty: 0, tw: 7, th: 7 },
};

// Tile GIDs in xerite.json: water starts at firstgid 547, water_anim at 551
const WATER_FIRSTGID = 547;
const WATER_LASTGID = 550;  // water (4 tiles)
const WATER_ANIM_FIRSTGID = 551;
const WATER_ANIM_LASTGID = 586; // water_anim (36 tiles)

type TileKind = "grass" | "sand" | "water" | "shop" | "workbench" | "home" | "portal";
type TimeOfDay = "morning" | "evening";

interface InteractTarget {
  kind: "water" | "shop" | "quest" | "home" | "portal";
  tx: number; ty: number;
  portal?: PortalDef;
}

export class OverworldScene extends Phaser.Scene {
  private svc!: GameServices;
  private input$!: InputManager;
  private touch$!: TouchControls;
  private life!: SceneLifecycle;
  private player!: Player;
  private hud!: HUD;
  private hint!: Phaser.GameObjects.Text;
  private portalAt: Record<string, PortalDef> = {};
  private tintOverlay!: Phaser.GameObjects.Rectangle;
  private eveningOverlay!: Phaser.GameObjects.Rectangle;
  private weatherFx?: Phaser.GameObjects.Particles.ParticleEmitter;
  private blockers!: Phaser.Physics.Arcade.StaticGroup;
  private fx!: FeedbackOverlay;
  private ambientFx?: Phaser.GameObjects.Particles.ParticleEmitter;
  private questBadge!: Phaser.GameObjects.Text;
  /** Lock to stop ESC double-firing. */
  private _pauseLock = false;
  /** Lock to prevent home dialog re-opening. */
  private _dialogOpen = false;
  /** Active home dialog container ref for cleanup. */
  private _homeDialog?: Phaser.GameObjects.Container;

  // ── Time of Day ───────────────────────────────────────────────────────────
  private timeOfDay: TimeOfDay = "morning";

  // ── Tiled layer references for water detection ────────────────────────────
  private waterLayer?: Phaser.Tilemaps.TilemapLayer;
  private waterAnimLayer?: Phaser.Tilemaps.TilemapLayer;
  private tilemap?: Phaser.Tilemaps.Tilemap;

  constructor() { super(SCENE.Overworld); }

  create() {
    this.svc = this.registry.get(SERVICE_REGISTRY_KEY) as GameServices;
    this.life = new SceneLifecycle(this);
    this.fx = new FeedbackOverlay(this);
    this.input$ = new InputManager(this);
    this.input$.setContext("overworld");

    const map = getMap(this.svc.save.state.mapId);
    this.cameras.main.setBackgroundColor(map.bg);

    // ── Build Tiled map ───────────────────────────────────────────────────
    this.tilemap = this.make.tilemap({ key: "map.xerite" });
    const tilesetNames = this.tilemap.tilesets.map(t => t.name);
    const addedTilesets = tilesetNames
      .map(t => this.tilemap!.addTilesetImage(t, `ts.${t}`))
      .filter((t): t is Phaser.Tilemaps.Tileset => t !== null);

    let collisionLayer: Phaser.Tilemaps.TilemapLayer | null = null;
    (this.tilemap.layers as any[]).forEach((layerData, idx) => {
      const layer = this.tilemap!.createLayer(layerData.name, addedTilesets, 0, 0);
      if (!layer) return;
      layer.setDepth(-10 + idx);
      const name = (layerData.name as string).toLowerCase();
      if (name === "collision") {
        collisionLayer = layer;
      } else if (name === "water") {
        this.waterLayer = layer;
      } else if (name === "water_anim") {
        this.waterAnimLayer = layer;
      }
    });

    // ── Player spawn ──────────────────────────────────────────────────────
    const s = this.svc.save.state;
    const px = s.tileX * TILE + TILE / 2;
    const py = s.tileY * TILE + TILE / 2;
    this.player = new Player(this, px, py);
    this.applyCosmetic();

    // ── Camera & world bounds ─────────────────────────────────────────────
    const worldW = this.tilemap.widthInPixels;
    const worldH = this.tilemap.heightInPixels;
    this.physics.world.setBounds(0, 0, worldW, worldH);
    this.cameras.main.setZoom(1.6);
    this.cameras.main.setRoundPixels(true);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setDeadzone(48, 36);
    this.cameras.main.setBounds(0, 0, worldW, worldH);

    // ── Physics collision ─────────────────────────────────────────────────
    this.blockers = this.physics.add.staticGroup();
    this.physics.add.collider(this.player, this.blockers);
    if (collisionLayer) {
      (collisionLayer as Phaser.Tilemaps.TilemapLayer).setCollisionByExclusion([-1]);
      (collisionLayer as Phaser.Tilemaps.TilemapLayer).setVisible(false);
      this.physics.add.collider(this.player, collisionLayer as Phaser.Tilemaps.TilemapLayer);
    }

    // ── Overlay layers ────────────────────────────────────────────────────
    this.tintOverlay = this.add
      .rectangle(0, 0, CANVAS_W_LOCAL, CANVAS_H_LOCAL, 0x000033, 0)
      .setOrigin(0).setScrollFactor(0).setDepth(800);

    this.eveningOverlay = this.add
      .rectangle(0, 0, CANVAS_W_LOCAL, CANVAS_H_LOCAL, 0x0a1540, 0)
      .setOrigin(0).setScrollFactor(0).setDepth(799);

    // ── Ambient FX ────────────────────────────────────────────────────────
    this.input.topOnly = true; // dialogs/buttons never lose clicks to backdrops below
    this.applyWeatherFx();
    this.startAmbientFx(getTheme(map.id, map.biome));
    this.life.add(() => this.ambientFx?.destroy());
    if (map.ambientKey) this.svc.audio.playAmbient(map.ambientKey);
    if (map.musicKey) this.svc.audio.playMusic(map.musicKey);
    this.life.on(EventBus, "weather:change", this.applyWeatherFx, this);
    this.life.on(EventBus, "wardrobe:changed", this.applyCosmetic, this);

    // ── HUD ───────────────────────────────────────────────────────────────
    this.hud = new HUD(this);
    this.hint = this.add.text(0, 0, "", {
      fontSize: "9px", color: "#ffffff",
      backgroundColor: "#000000aa", padding: { x: 4, y: 2 },
    }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(1000);

    this.touch$ = new TouchControls(this, this.input$, { buttonAction: "interact" });

    this.questBadge = this.add.text(CANVAS_W_LOCAL / 2, 38, "", {
      fontSize: "10px", color: "#ffe066", backgroundColor: "#1c2a30cc",
      padding: { x: 8, y: 3 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1001).setVisible(false);

    // ── Exploration reward ────────────────────────────────────────────────
    this.cameras.main.fadeIn(250, 11, 20, 22);
    EventBus.emit("area:entered", { mapId: map.id });
    this.checkExplorationReward(map);

    this.events.on("update", this.applyTint, this);
    this.life.add(() => this.events.off("update", this.applyTint, this));
    this.life.add(() => this.weatherFx?.destroy());

    // ── ESC key ───────────────────────────────────────────────────────────
    this._pauseLock = false;
    this.input.keyboard?.on("keydown-ESC", this.onEscKey, this);
    this.events.on(Phaser.Scenes.Events.RESUME, () => {
      this.time.delayedCall(80, () => { this._pauseLock = false; });
    });

    // Expose timeOfDay for FishingSystem via registry
    this.registry.set("timeOfDay", this.timeOfDay);
  }

  private applyCosmetic = (): void => {
    const cos = getCosmetic(this.svc.wardrobe.current());
    this.player?.setSkin(cos.animPrefix, cos.fallbackTexture);
  };

  // ── Water tile detection ─────────────────────────────────────────────────
  /**
   * Returns true if the tile at tile-coords (tx,ty) is a water tile
   * (present in either the 'water' or 'water_anim' Tiled layers).
   */
  private isWaterTile(tx: number, ty: number): boolean {
    if (this.waterLayer) {
      const t = this.waterLayer.getTileAt(tx, ty);
      if (t && t.index >= WATER_FIRSTGID && t.index <= WATER_LASTGID) return true;
    }
    if (this.waterAnimLayer) {
      const t = this.waterAnimLayer.getTileAt(tx, ty);
      if (t && t.index >= WATER_ANIM_FIRSTGID && t.index <= WATER_ANIM_LASTGID) return true;
    }
    return false;
  }

  // ── Building proximity test ──────────────────────────────────────────────
  private nearBuilding(kind: "shop" | "quest" | "home"): boolean {
    const zone = BUILDING_ZONES[kind];
    const ptx = Math.floor(this.player.x / TILE);
    const pty = Math.floor(this.player.y / TILE);
    // Check if player tile is at the edge / just outside the building footprint
    const inX = ptx >= zone.tx - 1 && ptx <= zone.tx + zone.tw;
    const inY = pty >= zone.ty - 1 && pty <= zone.ty + zone.th;
    if (!inX || !inY) return false;
    // Also check pixel distance to building centre
    const bcx = (zone.tx + zone.tw / 2) * TILE;
    const bcy = (zone.ty + zone.th / 2) * TILE;
    return Phaser.Math.Distance.Between(this.player.x, this.player.y, bcx, bcy) < TILE * 4;
  }

  // ── Interact target resolution ───────────────────────────────────────────
  private findInteract(): InteractTarget | null {
    const ptx = Math.floor(this.player.x / TILE);
    const pty = Math.floor(this.player.y / TILE);

    // Buildings checked first (higher priority)
    if (this.nearBuilding("shop")) return { kind: "shop", tx: ptx, ty: pty };
    if (this.nearBuilding("quest")) return { kind: "quest", tx: ptx, ty: pty };
    if (this.nearBuilding("home")) return { kind: "home", tx: ptx, ty: pty };

    // Water — check facing tile and adjacent tiles
    const checks: Array<[number, number]> = [
      [ptx, pty],
      [ptx + 1, pty], [ptx - 1, pty],
      [ptx, pty + 1], [ptx, pty - 1],
    ];
    for (const [tx, ty] of checks) {
      if (this.isWaterTile(tx, ty)) {
        const cx = tx * TILE + TILE / 2;
        const cy = ty * TILE + TILE / 2;
        if (Phaser.Math.Distance.Between(this.player.x, this.player.y, cx, cy) <= INTERACT_DIST + TILE) {
          return { kind: "water", tx, ty };
        }
      }
    }
    return null;
  }

  // ── Update loop ──────────────────────────────────────────────────────────
  override update(_t: number, dt: number) {
    this.svc.time.update(dt);

    const ax = this.input$.axis("overworld");
    if (!this._dialogOpen) this.player.move(ax.x, ax.y, 1);
    else this.player.stop();

    if (this.player.resting) {
      const s = this.svc.save.state;
      if (s.stamina < s.maxStamina) {
        s.stamina = Math.min(s.maxStamina, s.stamina + REST_REGEN_PER_SEC * (dt / 1000));
      }
    }
    this.hud.refresh(this.svc, this.svc.time.formatted(), this.player.resting);

    // Interaction hint
    const target = this._dialogOpen ? null : this.findInteract();
    this.updateHint(target);

    if (!this._dialogOpen && this.input$.justPressed("interact", "overworld")) {
      if (target?.kind === "water") this.openFishing();
      else if (target?.kind === "shop") this.openShop();
      else if (target?.kind === "quest") this.openQuests();
      else if (target?.kind === "home") this.openHomeDialog();
    }

    if (this.input$.justPressed("inventory", "overworld")) this.openInventory();
    if (this.input$.justPressed("shop", "overworld")) this.openShop();
    if (this.input$.justPressed("quests", "overworld")) this.openQuests();
    if (this.input$.justPressed("bestiary", "overworld")) this.openBestiary();
    if (this.input$.justPressed("wardrobe", "overworld")) this.openWardrobe();

    const ready = this.svc.quests.list().filter((q) => q.claimable).length;
    if (ready > 0) {
      this.questBadge.setText(`★ ${ready} quest${ready > 1 ? "s" : ""} ready — press Q`).setVisible(true);
    } else {
      this.questBadge.setVisible(false);
    }

    if (this.input$.justPressed("quickSave", "overworld")) {
      this.persistPosition();
      this.svc.save.save(0);
      this.svc.audio.playSfx(SFX.Coin); this.toast("Saved.");
    }
    if (this.input$.justPressed("quickLoad", "overworld")) {
      if (this.svc.save.load(0)) { this.toast("Loaded."); this.scene.restart(); }
      else this.toast("No save in slot 1.");
    }
  }

  private updateHint(target: InteractTarget | null): void {
    if (!target) { this.hint.setVisible(false); return; }
    const labels: Record<string, string> = {
      water: "Fish",
      shop: "Shop",
      quest: "Quest Board",
      home: "Home",
    };
    const word = labels[target.kind] ?? target.kind;
    this.hint.setPosition(this.cameras.main.centerX, this.cameras.main.height - 38);
    this.hint.setText(`[E] ${word}`).setVisible(true);
  }

  // ── Home dialog ──────────────────────────────────────────────────────────
  private openHomeDialog(): void {
    if (this._dialogOpen) return;
    this._dialogOpen = true;
    this.svc.audio.playSfx(SFX.UiClick);

    const CW = CANVAS_W_LOCAL, CH = CANVAS_H_LOCAL;
    const W = 280, H = 180;
    const x = CW / 2 - W / 2, y = CH / 2 - H / 2;

    const c = this.add.container(0, 0).setDepth(2000).setScrollFactor(0);

    // Backdrop
    const backdrop = this.add.rectangle(0, 0, CW, CH, 0x000000, 0.5).setOrigin(0).setInteractive();
    backdrop.on("pointerup", () => this.closeHomeDialog(c));
    c.add(backdrop);

    // Panel
    const panel = this.add.rectangle(x, y, W, H, 0x0e1a22, 0.97).setOrigin(0)
      .setStrokeStyle(2, 0xd4af37, 1).setInteractive();
    c.add(panel);

    c.add(this.add.text(CW / 2, y + 18, "HOME", {
      fontFamily: FONT_TITLE, fontSize: "13px",
      color: UI_COLORS.accent, resolution: TEXT_RESOLUTION,
    }).setOrigin(0.5));
    c.add(this.add.rectangle(CW / 2, y + 33, W - 32, 1, 0xd4af37, 0.5).setOrigin(0.5, 0));

    const tod = this.timeOfDay === "morning" ? "Morning" : "Evening";
    c.add(this.add.text(CW / 2, y + 44, `Time: ${tod}`, {
      fontFamily: FONT_BODY, fontSize: "10px",
      color: UI_COLORS.textMute, resolution: TEXT_RESOLUTION,
    }).setOrigin(0.5));

    // Button factory (immediate pointerup, non-laggy)
    const makeBtn = (cy: number, label: string, action: () => void) => {
      const bg = this.add.rectangle(CW / 2, cy, 220, 30, 0x1a2e36, 0.95)
        .setStrokeStyle(1, 0x4a6a7a, 1);
      const txt = this.add.text(CW / 2, cy, label, {
        fontFamily: FONT_TITLE, fontSize: "11px",
        color: UI_COLORS.text, resolution: TEXT_RESOLUTION,
      }).setOrigin(0.5);

      bg.setInteractive({ useHandCursor: true });
      bg.on("pointerover", () => { bg.setFillStyle(0x2c4a56, 1); txt.setColor(UI_COLORS.accent); });
      bg.on("pointerout", () => { bg.setFillStyle(0x1a2e36, 0.95); txt.setColor(UI_COLORS.text); });
      bg.on("pointerdown", () => { bg.setFillStyle(0x3a5e6e, 1); });
      bg.on("pointerup", () => { action(); });
      c.add([bg, txt]);
    };

    makeBtn(y + 90, "✦  Yorğunluğu Almaq", () => this.doRest(c));
    makeBtn(y + 130, "◑  Səhər / Axşam Etmək", () => this.doToggleTime(c));

    this._homeDialog = c;
  }

  private doRest(dialog: Phaser.GameObjects.Container): void {
    const s = this.svc.save.state;
    s.stamina = s.maxStamina;
    this.svc.audio.playSfx(SFX.LevelUp);
    this.closeHomeDialog(dialog);
    this.toast("You feel well rested! ✦");
  }

  private doToggleTime(dialog: Phaser.GameObjects.Container): void {
    this.timeOfDay = this.timeOfDay === "morning" ? "evening" : "morning";
    this.registry.set("timeOfDay", this.timeOfDay);
    this.applyEveningTint();
    this.closeHomeDialog(dialog);
    const label = this.timeOfDay === "evening" ? "Axşam düşür…" : "Yeni bir səhər!";

    // BANK SİSTEMİ: Səhər olanda passiv gəlir gəlir
    if (this.timeOfDay === "morning") {
      const invLvl = this.svc.save.state.flagCounters["investment"] || 0;
      if (invLvl > 0) {
        const income = invLvl * 25;
        this.svc.economy.addCoins(income);
        this.time.delayedCall(1600, () => {
          this.toast(`Passiv Gəlir: +${income}¢ Bankdan gəldi!`);
          this.svc.audio.playSfx(SFX.Coin);
        });
      }
    }

    this.toast(label);
  }

  private closeHomeDialog(dialog: Phaser.GameObjects.Container): void {
    dialog.destroy();
    this._homeDialog = undefined;
    this._dialogOpen = false;
  }

  // ── Evening tint ─────────────────────────────────────────────────────────
  private applyEveningTint(): void {
    const targetAlpha = this.timeOfDay === "evening" ? 0.38 : 0;
    this.tweens.add({
      targets: this.eveningOverlay,
      alpha: targetAlpha,
      duration: 800,
      ease: "Sine.easeInOut",
    });
  }

  // ── Fishing ──────────────────────────────────────────────────────────────
  private openFishing() {
    if (this.svc.inventory.totalWeight() >= 50) {
      this.toast("Inventory full!");
      return;
    }
    // Pass timeOfDay context through registry so FishingScene can read it
    this.registry.set("timeOfDay", this.timeOfDay);
    this.persistPosition();
    this.scene.pause();
    this.scene.launch(SCENE.Fishing);
  }

  // ── Other scene launchers ────────────────────────────────────────────────
  private openShop() { this.persistPosition(); this.scene.pause(); this.scene.launch(SCENE.Shop); }
  private openInventory() { this.persistPosition(); this.scene.pause(); this.scene.launch(SCENE.Inventory); }
  private openQuests() { this.persistPosition(); this.scene.pause(); this.scene.launch(SCENE.QuestLog); }
  private openBestiary() { this.persistPosition(); this.scene.pause(); this.scene.launch(SCENE.Bestiary); }
  private openWardrobe() { this.persistPosition(); this.scene.pause(); this.scene.launch(SCENE.Wardrobe); }

  private openPauseMenu() {
    if (this._pauseLock) return;
    this._pauseLock = true;
    this.persistPosition();
    this.scene.pause();
    this.scene.launch(SCENE.PauseMenu, { returnTo: SCENE.Overworld });
  }

  private onEscKey = (): void => {
    if (this._dialogOpen) { this.closeHomeDialog(this._homeDialog!); return; }
    if (this._pauseLock) return;
    this.openPauseMenu();
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  private persistPosition(): void {
    this.svc.save.state.tileX = Math.floor(this.player.x / TILE);
    this.svc.save.state.tileY = Math.floor(this.player.y / TILE);
  }

  private checkExplorationReward(map: ReturnType<typeof getMap>): void {
    const s = this.svc.save.state;
    if (!Array.isArray(s.exploredRewarded)) s.exploredRewarded = [...(s.exploredMaps ?? [])];
    const theme = getTheme(map.id, map.biome);
    if (s.exploredRewarded.includes(map.id)) {
      this.time.delayedCall(350, () => this.fx.toast(`${map.name} — ${theme.caption}`, "#cfe0e4"));
      return;
    }
    s.exploredRewarded.push(map.id);
    const coins = 25 + map.depth * 15;
    const bait = 3 + Math.floor(map.depth / 2);
    this.svc.economy.addCoins(coins);
    s.bait += bait;
    s.inventory.bait = (s.inventory.bait ?? 0) + bait;
    this.svc.audio.playSfx(SFX.LevelUp);
    this.time.delayedCall(450, () => {
      this.fx.banner("✦ NEW AREA DISCOVERED ✦", "#9bf0a6", 76, 17);
      this.fx.toast(`${map.name}  ·  +${coins}¢  +${bait} bait`, "#ffe066");
    });
  }

  /** Per-map ambient particle effect. */
  private startAmbientFx(theme: MapTheme): void {
    this.ambientFx?.destroy();
    this.ambientFx = undefined;
    const fx: DecorFx = theme.fx;
    if (fx === "none") return;
    const palette: Record<DecorFx, number> = {
      none: 0xffffff, leaves: 0x9ccf6b, snow: 0xffffff, embers: 0xff8a3a,
      fireflies: 0xffe066, pollen: 0xfff0a0, mist: 0xcfe0e4, bubbles: 0xbcd9ff,
    };
    const color = palette[fx];
    const tex = `fx_amb_${fx}`;
    if (!this.textures.exists(tex)) {
      const gg = this.add.graphics();
      gg.fillStyle(color, 1); gg.fillCircle(2, 2, 2);
      gg.generateTexture(tex, 4, 4); gg.destroy();
    }
    const W = CANVAS_W_LOCAL, H = CANVAS_H_LOCAL;
    let cfg: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig;
    switch (fx) {
      case "snow": cfg = { x: { min: 0, max: W }, y: -8, lifespan: 6000, speedY: { min: 24, max: 60 }, speedX: { min: -16, max: 16 }, quantity: 1, frequency: 220, scale: { min: 0.5, max: 1.2 }, alpha: { start: 0.9, end: 0.4 } }; break;
      case "leaves": cfg = { x: { min: 0, max: W }, y: -8, lifespan: 7000, speedY: { min: 18, max: 40 }, speedX: { min: -28, max: 12 }, rotate: { min: 0, max: 360 }, quantity: 1, frequency: 420, scale: { min: 0.7, max: 1.3 }, alpha: { start: 0.85, end: 0.3 } }; break;
      case "embers": cfg = { x: { min: 0, max: W }, y: H + 8, lifespan: 3200, speedY: { min: -70, max: -30 }, speedX: { min: -14, max: 14 }, quantity: 1, frequency: 180, scale: { start: 1, end: 0 }, alpha: { start: 0.9, end: 0 }, tint: [0xff8a3a, 0xffc23d] }; break;
      case "fireflies": cfg = { x: { min: 0, max: W }, y: { min: 60, max: H - 40 }, lifespan: 2600, speedX: { min: -18, max: 18 }, speedY: { min: -18, max: 18 }, quantity: 1, frequency: 300, scale: { min: 0.6, max: 1.1 }, alpha: { start: 0, end: 0 }, emitting: true }; break;
      case "pollen": cfg = { x: { min: 0, max: W }, y: { min: -8, max: H }, lifespan: 8000, speedX: { min: -20, max: 20 }, speedY: { min: -6, max: 14 }, quantity: 1, frequency: 360, scale: { min: 0.4, max: 0.9 }, alpha: { start: 0.6, end: 0.1 } }; break;
      case "bubbles": cfg = { x: { min: 0, max: W }, y: H + 8, lifespan: 5000, speedY: { min: -40, max: -18 }, speedX: { min: -8, max: 8 }, quantity: 1, frequency: 260, scale: { min: 0.4, max: 1.0 }, alpha: { start: 0.5, end: 0 } }; break;
      case "mist":
      default: cfg = { x: { min: 0, max: W }, y: { min: 80, max: H - 60 }, lifespan: 7000, speedX: { min: -22, max: 22 }, speedY: { min: -4, max: 4 }, quantity: 1, frequency: 600, scale: { min: 2, max: 4 }, alpha: { start: 0.12, end: 0 } }; break;
    }
    this.ambientFx = this.add.particles(0, 0, tex, cfg).setScrollFactor(0).setDepth(805);
    if (fx === "fireflies") {
      this.ambientFx.setConfig({ ...cfg, alpha: { start: 0.9, end: 0 } });
    }
  }

  /** Weather + time-of-day tint. */
  private applyTint = (): void => {
    const phase = this.svc.time.state.phase;
    const phaseMap: Record<string, { color: number; alpha: number }> = {
      dawn: { color: 0xff8a3a, alpha: 0.10 },
      day: { color: 0x000000, alpha: 0.0 },
      dusk: { color: 0xff5e2e, alpha: 0.18 },
      night: { color: 0x0a1a55, alpha: 0.45 },
    };
    const cfg = phaseMap[phase] ?? phaseMap.day!;
    this.tintOverlay.setFillStyle(cfg.color, cfg.alpha);
  };

  private applyWeatherFx = (): void => {
    this.weatherFx?.destroy();
    this.weatherFx = undefined;
    const w = this.svc.time.state.weather;
    if (w !== "rain" && w !== "storm") return;
    const tex = "fx_rain_world";
    if (!this.textures.exists(tex)) {
      const g = this.add.graphics();
      g.fillStyle(0xbcd9ff, 0.7); g.fillRect(0, 0, 1, 4);
      g.generateTexture(tex, 1, 4); g.destroy();
    }
    this.weatherFx = this.add.particles(0, -10, tex, {
      x: { min: 0, max: CANVAS_W_LOCAL }, y: -10,
      lifespan: 1000, speedY: { min: 380, max: 520 },
      quantity: w === "storm" ? 4 : 1, frequency: 50, alpha: 0.6,
    }).setDepth(810);
  };

  private toast(msg: string): void {
    const t = this.add.text(this.cameras.main.centerX, 30, msg, {
      fontSize: "12px", color: "#ffffff", backgroundColor: "#1c2a30aa",
      padding: { x: 8, y: 4 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(2000);
    this.tweens.add({ targets: t, alpha: 0, duration: 1600, delay: 600, onComplete: () => t.destroy() });
  }
}
