/**
 * FishingScene — Stage 2: 3-phase mini-game (Cast → Hook → Fight).
 * All numbers come from /core/Balance + /data fish/rod/boat defs.
 */

import Phaser from "phaser";
import {
  SCENE, CANVAS_W, CANVAS_H, FISHING_STAMINA_COST,
} from "../core/Constants";
import {
  CAST_BAR_W, CAST_CHARGE_RATE, CAST_SWEET_SWEEP, CAST_SWEET_HALF,
  TENSION_MAX, TENSION_REEL_RAISE, TENSION_DECAY, TENSION_DANGER, TENSION_SNAP_HOLD_MS,
  REEL_PROGRESS_PER_SEC, REEL_FISH_PUSHBACK, FIGHT_DISTANCE,
  STAMINA_REEL_DRAIN,
} from "../core/Balance";
import { SERVICE_REGISTRY_KEY } from "../core/Game";
import type { GameServices } from "../core/Game";
import type { PickResult, CatchResult } from "../systems/FishingSystem";
import type { FightStats } from "../data/fishDefs";
import { SFX, MUSIC } from "../data/audioKeys";
import { FeedbackOverlay } from "../ui/FeedbackOverlay";
import { rarityStyle } from "../data/rarityDefs";
import { getMap } from "../data/mapDefs";
import { getTheme } from "../data/mapThemes";

type Phase = "cast" | "hook" | "fight" | "done";
type FishDir = -1 | 1; // -1 = pulling away (player must reel against), 1 = with player

export class FishingScene extends Phaser.Scene {
  private svc!: GameServices;
  private fx!: FeedbackOverlay;
  private wasDanger = false;

  // shared
  private phase: Phase = "cast";
  private msgText!: Phaser.GameObjects.Text;
  private subText!: Phaser.GameObjects.Text;
  private weatherFx?: Phaser.GameObjects.Particles.ParticleEmitter;

  // cast
  private power = 0;
  private accuracy = 0;
  private charging = false;
  private sweetX = 0.5;
  private sweetDir = 1;
  private cursorX = 0;
  private powerBar!: Phaser.GameObjects.Rectangle;
  private accBar!: Phaser.GameObjects.Rectangle;
  private accCursor!: Phaser.GameObjects.Rectangle;
  private accSweet!: Phaser.GameObjects.Rectangle;

  // hook
  private hookT = 0;
  private hookWindow = 700;
  private hookGfx!: Phaser.GameObjects.Graphics;
  private hookPrompt!: Phaser.GameObjects.Text;
  private pick?: PickResult;

  // fight
  private tension = 0;
  private overTopMs = 0;
  private distance = 0;
  private fishDir: FishDir = -1;
  private fishDirTimer = 0;
  private jerkTimer = 0;
  private isJerking = 0; // ms remaining of unreelable
  private reeling = false;
  private fishStats!: FightStats;
  private fightStage = 0;
  private fightStages = 1;
  private bobber!: Phaser.GameObjects.Arc;
  private fishSprite?: Phaser.GameObjects.Image;
  private lineGfx!: Phaser.GameObjects.Graphics;
  private tensionBar!: Phaser.GameObjects.Rectangle;
  private distanceBar!: Phaser.GameObjects.Rectangle;
  private rodTipX = CANVAS_W / 2 - 110;
  private rodTipY = 200;
  private bobberX = CANVAS_W / 2 + 100;
  private bobberY = 320;

  // input
  private keySpace!: Phaser.Input.Keyboard.Key;
  private keyEsc!: Phaser.Input.Keyboard.Key;

  constructor() { super(SCENE.Fishing); }

  create() {
    this.svc = this.registry.get(SERVICE_REGISTRY_KEY) as GameServices;
    this.input.topOnly = true;
    this.fx = new FeedbackOverlay(this);
    if (this.svc.save.state.stamina < FISHING_STAMINA_COST) {
      this.endWithMessage("Too tired to fish.");
      return;
    }

    // background — themed per current map so each biome's water looks distinct
    const map = getMap(this.svc.save.state.mapId);
    const theme = getTheme(map.id, map.biome);
    this.add.rectangle(0, 0, CANVAS_W, CANVAS_H, 0x06121a, 0.85).setOrigin(0).setScrollFactor(0);
    this.add.rectangle(0, 240, CANVAS_W, 240, theme.waterDeep, 1).setOrigin(0); // water
    this.add.rectangle(0, 240, CANVAS_W, 40, theme.water, 0.5).setOrigin(0);     // surface band
    this.add.rectangle(0, 230, CANVAS_W, 12, theme.sand, 0.45).setOrigin(0);     // shore line

    // Day/night tint mirror
    const phase = this.svc.time.state.phase;
    const tints: Record<string, [number, number]> = {
      dawn: [0xff8a3a, 0.10], day: [0x000000, 0], dusk: [0xff5e2e, 0.18], night: [0x0a1a55, 0.45],
    };
    const t = tints[phase] ?? [0x000000, 0];
    this.add.rectangle(0, 0, CANVAS_W, CANVAS_H, t[0], t[1]).setOrigin(0).setDepth(900);

    this.weatherOverlay();

    this.msgText = this.add.text(CANVAS_W / 2, 24, "CAST", {
      fontSize: "16px", color: "#e6efe2", fontStyle: "bold",
    }).setOrigin(0.5).setDepth(950);
    this.subText = this.add.text(CANVAS_W / 2, 46, "Hold SPACE to charge — release in the green", {
      fontSize: "10px", color: "#aab7bb",
    }).setOrigin(0.5).setDepth(950);

    this.keySpace = this.input.keyboard!.addKey("SPACE");
    this.keyEsc = this.input.keyboard!.addKey("ESC");
    this.keyEsc.on("down", () => this.exitScene());

    // Memory-leak guard: ensure weather emitter is destroyed even if the
    // scene exits via an unusual path (camera fade, scene swap, etc.).
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.weatherFx?.destroy();
      this.weatherFx = undefined;
    });

    this.svc.save.state.stamina -= FISHING_STAMINA_COST;

    this.startCast();
  }

  private weatherOverlay(): void {
    const w = this.svc.time.state.weather;
    if (w === "rain" || w === "storm") {
      const tex = "fx_rain_dot";
      if (!this.textures.exists(tex)) {
        const g = this.add.graphics();
        g.fillStyle(0xbcd9ff, 0.8); g.fillRect(0, 0, 1, 4);
        g.generateTexture(tex, 1, 4); g.destroy();
      }
      this.weatherFx = this.add.particles(0, -10, tex, {
        x: { min: 0, max: CANVAS_W }, y: -10,
        lifespan: 800, speedY: { min: 480, max: 620 },
        quantity: w === "storm" ? 6 : 2, frequency: 30, alpha: 0.7,
      }).setDepth(905);
    }
    if (w === "storm") {
      this.time.addEvent({
        delay: 4000 + Math.random() * 4000, loop: true, callback: () => {
          const flash = this.add.rectangle(0, 0, CANVAS_W, CANVAS_H, 0xffffff, 0.6).setOrigin(0).setDepth(906);
          if (this.svc.settings.state.screenShake) this.cameras.main.shake(120, 0.004);
          this.tweens.add({ targets: flash, alpha: 0, duration: 220, onComplete: () => flash.destroy() });
        },
      });
    }
  }

  // ── CAST ────────────────────────────────────────────────────
  private startCast(): void {
    this.phase = "cast";
    const x = (CANVAS_W - CAST_BAR_W) / 2;
    const y1 = 110;
    const y2 = 156;
    this.add.text(CANVAS_W / 2, y1 - 14, "POWER", { fontSize: "9px", color: "#aab7bb" }).setOrigin(0.5);
    this.add.rectangle(x, y1, CAST_BAR_W, 14, 0x22343a).setOrigin(0, 0);
    this.powerBar = this.add.rectangle(x, y1, 1, 14, 0xffe066).setOrigin(0, 0);

    this.add.text(CANVAS_W / 2, y2 - 14, "ACCURACY", { fontSize: "9px", color: "#aab7bb" }).setOrigin(0.5);
    this.accBar = this.add.rectangle(x, y2, CAST_BAR_W, 14, 0x22343a).setOrigin(0, 0);
    const sweetW = CAST_BAR_W * (CAST_SWEET_HALF * 2);
    this.accSweet = this.add.rectangle(x + CAST_BAR_W * this.sweetX - sweetW / 2, y2, sweetW, 14, 0x6fb56e).setOrigin(0, 0);
    this.accCursor = this.add.rectangle(x, y2 - 4, 4, 22, 0xffffff).setOrigin(0, 0);

    this.cursorX = 0;
  }

  private updateCast(dt: number): void {
    const dts = dt / 1000;
    if (this.charging) this.power = Math.min(1, this.power + CAST_CHARGE_RATE * dts);

    // sweet spot drift
    this.sweetX += this.sweetDir * CAST_SWEET_SWEEP * dts;
    if (this.sweetX < 0.05) { this.sweetX = 0.05; this.sweetDir = 1; }
    if (this.sweetX > 0.95) { this.sweetX = 0.95; this.sweetDir = -1; }
    const x = (CANVAS_W - CAST_BAR_W) / 2;
    const sweetW = CAST_BAR_W * (CAST_SWEET_HALF * 2);
    this.accSweet.x = x + CAST_BAR_W * this.sweetX - sweetW / 2;

    // cursor races at 1.6x charge speed (tied to power)
    const speed = (0.5 + this.power) * 1.6;
    this.cursorX = (this.cursorX + speed * dts) % 1;
    this.accCursor.x = x + this.cursorX * CAST_BAR_W;

    this.powerBar.width = Math.max(1, this.power * CAST_BAR_W);

    if (Phaser.Input.Keyboard.JustDown(this.keySpace)) {
      this.charging = true;
    }
    if (this.charging && (Phaser.Input.Keyboard.JustUp(this.keySpace) || this.power >= 1)) {
      this.charging = false;
      this.lockCast();
    }
  }

  private lockCast(): void {
    const dist = Math.abs(this.cursorX - this.sweetX);
    this.accuracy = Math.max(0, 1 - dist / (CAST_SWEET_HALF * 2));
    this.subText.setText(`Cast: pwr ${(this.power * 100).toFixed(0)}% · acc ${(this.accuracy * 100).toFixed(0)}%`);
    // Pick the catch
    this.svc.audio.playSfx(SFX.CastWhoosh);
    this.pick = this.svc.fishing.pickFish(this.power, this.accuracy);
    this.startHook();
  }

  // ── HOOK ────────────────────────────────────────────────────
  private startHook(): void {
    this.phase = "hook";
    this.msgText.setText("HOOK!");
    this.hookT = 0;
    this.hookWindow = this.pick?.hookWindowMs ?? 700;
    this.hookGfx = this.add.graphics().setDepth(950);
    this.hookPrompt = this.add.text(CANVAS_W / 2, 200, "[ SPACE ]", {
      fontSize: "28px", color: "#ffe066", fontStyle: "bold",
    }).setOrigin(0.5).setDepth(951);

    // bobber splash
    const splashTex = this.ensureDot("fx_splash", 0xbcd9ff);
    this.svc.audio.playSfx(SFX.Splash);
    this.add.particles(this.bobberX, this.bobberY, splashTex, {
      lifespan: 400, speed: { min: 60, max: 140 }, angle: { min: 230, max: 310 },
      gravityY: 240, quantity: 12, scale: { start: 1, end: 0 },
    }).setDepth(901);
  }

  private updateHook(dt: number): void {
    this.hookT += dt;
    const remain = Math.max(0, 1 - this.hookT / this.hookWindow);
    this.hookGfx.clear();
    this.hookGfx.lineStyle(3, 0xffe066, 1);
    this.hookGfx.strokeCircle(CANVAS_W / 2, 200, 22 + (1 - remain) * 40);

    if (Phaser.Input.Keyboard.JustDown(this.keySpace)) {
      const ok = Math.random() < (this.pick?.hookChance ?? 0.8);
      this.hookPrompt.destroy(); this.hookGfx.destroy();
      if (ok) this.startFight();
      else this.fishGotAway("Slipped the hook!");
      return;
    }
    if (this.hookT >= this.hookWindow) {
      this.hookPrompt.destroy(); this.hookGfx.destroy();
      this.fishGotAway("Too late…");
    }
  }

  // ── FIGHT ───────────────────────────────────────────────────
  private startFight(): void {
    this.phase = "fight";
    if (this.pick?.isJunk) {
      // Junk auto-resolves into a (low-key) catch card.
      const res = this.svc.fishing.resolveCatch(this.pick);
      this.showCatchCard(res);
      return;
    }
    this.fishStats = this.pick!.fightStats;
    this.fightStages = this.fishStats.stages ?? 1;
    this.fightStage = 0;
    this.tension = 0;
    this.distance = 0;
    this.fishDir = -1;
    this.fishDirTimer = 0;
    this.jerkTimer = 0;
    this.isJerking = 0;
    this.msgText.setText(`FIGHT - ${this.pick!.def!.name}`);
    if (this.pick!.def!.rarity === "legendary") this.svc.audio.playMusic(MUSIC.Legendary);
    else this.svc.audio.playMusic(MUSIC.Tense);
    this.svc.audio.playSfx(SFX.Bite);
    this.subText.setText("Hold SPACE to reel — let go to ease tension");

    // Visuals
    this.lineGfx = this.add.graphics().setDepth(890);
    this.bobber = this.add.circle(this.bobberX, this.bobberY, 5, 0xff4d4d).setDepth(891);
    const fishKey = `fish.${this.pick!.def!.id}`;
    if (this.textures.exists(fishKey)) {
      this.fishSprite = this.add.image(this.bobberX, this.bobberY + 14, fishKey).setDepth(892);
      if (this.pick!.def!.behaviors?.includes("glow")) this.fishSprite.setTint(0xaaffff);
    }

    // Bars
    this.add.text(40, 380, "TENSION", { fontSize: "9px", color: "#ffaaaa" }).setOrigin(0, 0.5);
    this.add.rectangle(40, 392, 240, 14, 0x22343a).setOrigin(0, 0);
    this.tensionBar = this.add.rectangle(40, 392, 1, 14, 0xff4d4d).setOrigin(0, 0);
    this.add.text(CANVAS_W - 40, 380, "REEL", { fontSize: "9px", color: "#aaffaa" }).setOrigin(1, 0.5);
    this.add.rectangle(CANVAS_W - 280, 392, 240, 14, 0x22343a).setOrigin(0, 0);
    this.distanceBar = this.add.rectangle(CANVAS_W - 280, 392, 1, 14, 0x6fb56e).setOrigin(0, 0);
  }

  private updateFight(dt: number): void {
    const dts = dt / 1000;
    const ctx = this.svc.fishing.buildContext();
    const wasReeling = this.reeling; this.reeling = this.keySpace.isDown; if (this.reeling && !wasReeling) this.svc.audio.playSfx(SFX.ReelClick, { volume: 0.5 });

    // Fish behavior tick
    this.fishDirTimer -= dts;
    if (this.fishDirTimer <= 0) {
      this.fishDirTimer = 0.4 + Math.random() * 0.8;
      if (Math.random() < this.fishStats.directionChangeFrequency) {
        this.fishDir = (this.fishDir === -1 ? 1 : -1) as FishDir;
      }
    }
    this.jerkTimer -= dts;
    if (this.jerkTimer <= 0) {
      this.jerkTimer = 1.2;
      if (Math.random() < this.fishStats.jerkChance) this.triggerJerk();
    }

    // Pufferfish behavior: stage 2 = 1.5x pull
    let pullMul = 1;
    if (this.pick!.def!.behaviors?.includes("puffer") && this.fightStage >= 1) pullMul = 1.5;

    // Tension dynamics
    const isJerk = this.isJerking > 0;
    if (isJerk) this.isJerking -= dt;
    if (this.reeling && !isJerk) {
      // Reeling AGAINST the fish raises tension; with the fish gentle.
      const opposite = this.fishDir === -1 ? 1 : 0.25;
      this.tension += (TENSION_REEL_RAISE * this.fishStats.pullStrength * pullMul * ctx.tensionMult * opposite) * dts;
      // Distance gained (slower if rolling against, plus rod power, plus reel mult)
      const gain = REEL_PROGRESS_PER_SEC * ctx.rodPower * ctx.reelMult * (this.fishDir === 1 ? 1.2 : 0.55);
      this.distance += gain * dts;
      this.svc.save.state.stamina = Math.max(0, this.svc.save.state.stamina - STAMINA_REEL_DRAIN * dts);
    } else {
      this.tension = Math.max(0, this.tension - TENSION_DECAY * dts);
      // If not reeling, fish steals distance
      if (this.fishDir === -1 || isJerk) {
        this.distance = Math.max(0, this.distance - REEL_FISH_PUSHBACK * this.fishStats.pullStrength * dts);
      }
    }

    // Tension cap and snap window
    const tolerance = ctx.rodTensionTol + ctx.skillTensionTol;
    const cap = TENSION_MAX + tolerance;
    if (this.tension > cap) {
      this.overTopMs += dt;
      this.tension = cap;
      if (this.overTopMs > TENSION_SNAP_HOLD_MS) {
        this.snapLine();
        return;
      }
    } else this.overTopMs = Math.max(0, this.overTopMs - dt);

    // Visual updates — smooth safe→danger gradient with a danger pulse
    const ratio = this.tension / cap;
    this.tensionBar.width = Math.max(1, ratio * 240);
    this.tensionBar.fillColor = ratio > 0.85 ? 0xff2a2a : ratio > 0.6 ? 0xffaa33 : 0x6fd06f;
    const danger = ratio > 0.85;
    this.tensionBar.setAlpha(danger ? 0.55 + 0.45 * Math.abs(Math.sin(this.time.now * 0.02)) : 1);
    if (danger && !this.wasDanger) this.svc.audio.playSfx(SFX.LineTension, { volume: 0.6 });
    this.wasDanger = danger;
    this.distanceBar.width = Math.max(1, (this.distance / FIGHT_DISTANCE) * 240);

    // Bobber sway
    this.bobberX = CANVAS_W / 2 + 100 + Math.sin(this.time.now * 0.005) * (10 + this.tension / 6);
    this.bobberY = 320 + this.fishDir * 8;
    this.bobber.setPosition(this.bobberX, this.bobberY);
    if (this.fishSprite) this.fishSprite.setPosition(this.bobberX + Math.cos(this.time.now * 0.01) * 6, this.bobberY + 18);

    this.lineGfx.clear();
    this.lineGfx.lineStyle(1, 0xe6efe2, this.tension > TENSION_DANGER ? 1 : 0.7);
    this.lineGfx.beginPath();
    this.lineGfx.moveTo(this.rodTipX, this.rodTipY);
    const midX = (this.rodTipX + this.bobberX) / 2 + Math.sin(this.time.now * 0.006) * 8;
    const midY = (this.rodTipY + this.bobberY) / 2 + 16 - this.tension * 0.08;
    this.lineGfx.lineTo(midX, midY);
    this.lineGfx.lineTo(this.bobberX, this.bobberY);
    this.lineGfx.strokePath();

    // Multi-stage legendary
    if (this.distance >= FIGHT_DISTANCE) {
      this.fightStage += 1;
      if (this.fightStage >= this.fightStages) {
        this.landFish();
        return;
      }
      // next stage — fish gets stronger and runs
      this.distance = FIGHT_DISTANCE * 0.4;
      this.fishStats = {
        ...this.fishStats,
        pullStrength: this.fishStats.pullStrength * 1.25,
        jerkChance: Math.min(0.6, this.fishStats.jerkChance + 0.1),
      };
      if (this.svc.settings.state.screenShake) this.cameras.main.shake(220, 0.012);
      this.flash(`Stage ${this.fightStage + 1}/${this.fightStages}!`);
    }

    // Random escape pulse
    if (Math.random() < this.fishStats.escapeChance * dts) {
      this.distance = Math.max(0, this.distance - 10);
      if (this.svc.settings.state.screenShake) this.cameras.main.shake(100, 0.005);
    }
  }

  private triggerJerk(): void {
    this.isJerking = 350 + Math.random() * 250;
    this.tension = Math.min(TENSION_MAX + 20, this.tension + 22);
    if (this.svc.settings.state.screenShake) this.cameras.main.shake(180, 0.01);
    const splashTex = this.ensureDot("fx_jerk", 0xffd479);
    this.add.particles(this.bobberX, this.bobberY, splashTex, {
      lifespan: 280, speed: { min: 80, max: 180 }, quantity: 8, gravityY: 200, scale: { start: 1, end: 0 },
    }).setDepth(901);
  }

  // ── END STATES ──────────────────────────────────────────────
  private landFish(): void {
    if (!this.pick?.def) return;
    const w = this.svc.fishing.rollWeight(this.pick.def);
    const res = this.svc.fishing.resolveCatch(this.pick, w);
    this.showCatchCard(res);
  }

  /** Celebratory catch splash card with rarity feedback + popups. */
  private showCatchCard(res: CatchResult): void {
    this.phase = "done";
    const st = rarityStyle(res.rarity);
    this.svc.audio.playSfx(st.cardSfx);
    const key = res.isJunk ? `junk.${res.id}` : `fish.${res.id}`;
    if ((res.rarity === "legendary" || res.rarity === "rare") && this.svc.settings.state.screenShake) {
      this.cameras.main.shake(res.rarity === "legendary" ? 360 : 180, 0.01);
    }
    this.fx.catchCard({
      fishKey: this.textures.exists(key) ? key : undefined,
      name: res.name, rarity: res.rarity, weightKg: res.weightKg, value: res.value,
      isNewSpecies: res.isNewSpecies, isRecord: res.isRecord || res.isHeaviest,
      streak: res.streak, streakBonus: res.streakBonus,
      autoMs: res.rarity === "legendary" ? 2700 : res.isNewSpecies || res.isRecord ? 2200 : 1600,
      onDone: () => this.exitScene(),
    });
  }

  private snapLine(): void {
    if (!this.pick) return;
    this.svc.audio.playSfx(SFX.LineSnap);
    this.svc.fishing.resolveLost(this.pick, "snap");
    if (this.svc.settings.state.screenShake) this.cameras.main.shake(400, 0.018);
    this.endWithMessage("Line SNAPPED!");
  }

  private fishGotAway(msg: string): void {
    if (this.pick) this.svc.fishing.resolveLost(this.pick, "missed");
    this.endWithMessage(msg);
  }

  private flash(msg: string): void {
    const t = this.add.text(CANVAS_W / 2, 200, msg, { fontSize: "20px", color: "#ffe066", fontStyle: "bold" })
      .setOrigin(0.5).setDepth(960);
    this.tweens.add({ targets: t, alpha: 0, y: t.y - 30, duration: 900, onComplete: () => t.destroy() });
  }

  private endWithMessage(msg: string): void {
    this.phase = "done";
    const t = this.add.text(CANVAS_W / 2, CANVAS_H / 2, msg, {
      fontSize: "16px", color: "#ffffff", backgroundColor: "#000000aa", padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setDepth(2000);
    this.time.delayedCall(1200, () => { t.destroy(); this.exitScene(); });
  }

  private exitScene(): void {
    this.weatherFx?.destroy();
    this.scene.stop();
    this.scene.resume(SCENE.Overworld);
  }

  override update(_t: number, dt: number) {
    if (this.phase === "cast") this.updateCast(dt);
    else if (this.phase === "hook") this.updateHook(dt);
    else if (this.phase === "fight") this.updateFight(dt);
  }

  private ensureDot(key: string, color: number): string {
    if (this.textures.exists(key)) return key;
    const g = this.add.graphics();
    g.fillStyle(color, 1); g.fillCircle(2, 2, 2);
    g.generateTexture(key, 4, 4); g.destroy();
    return key;
  }
}
