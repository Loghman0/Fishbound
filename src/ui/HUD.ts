/**
 * HUD — top bar overlay: coins, rod tier, boat tier, stamina, clock.
 * Phase 4: crisp retro typography + "Resting" indicator next to stamina.
 */
import Phaser from "phaser";
import type { GameServices } from "../core/Game";
import { CANVAS_W } from "../core/Constants";
import { SKILL_XP_TO_LEVEL } from "../core/Balance";
import { FONT_BODY, FONT_TITLE, TEXT_RESOLUTION, UI_COLORS } from "../core/Fonts";
import { getMap } from "../data/mapDefs";

export class HUD {
  private text: Phaser.GameObjects.Text;
  private locText: Phaser.GameObjects.Text;
  private restingTxt: Phaser.GameObjects.Text;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    // Two-row HUD strip with a gold underline for a cleaner read.
    scene.add.rectangle(0, 0, CANVAS_W, 38, 0x070d10, 0.92)
      .setOrigin(0).setScrollFactor(0).setDepth(900);
    scene.add.rectangle(0, 38, CANVAS_W, 1, 0xd4af37, 0.55)
      .setOrigin(0).setScrollFactor(0).setDepth(900);

    this.text = scene.add.text(8, 4, "", {
      fontFamily: FONT_BODY,
      fontSize: "14px",
      color: UI_COLORS.text,
      resolution: TEXT_RESOLUTION,
    }).setScrollFactor(0).setDepth(901);

    this.locText = scene.add.text(8, 22, "", {
      fontFamily: FONT_TITLE,
      fontSize: "8px",
      color: UI_COLORS.accentSoft,
      resolution: TEXT_RESOLUTION,
    }).setScrollFactor(0).setDepth(901);

    this.restingTxt = scene.add.text(CANVAS_W - 8, 6, "", {
      fontFamily: FONT_TITLE,
      fontSize: "8px",
      color: UI_COLORS.accent,
      resolution: TEXT_RESOLUTION,
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(901).setVisible(false);
  }

  refresh(svc: GameServices, clock: string, resting = false): void {
    const s = svc.save.state;
    const cap = 50;
    const w = svc.inventory.totalWeight();
    const wt = svc.time.state.weather;
    const xpNeed = SKILL_XP_TO_LEVEL(s.skillLevel);
    const tod = this.scene.registry.get("timeOfDay") as string | undefined;
    const todLabel = tod === "evening" ? "Evening" : tod === "morning" ? "Morning" : "";
    this.text.setText(
      `${clock} ${wt}  ·  ${s.coins}¢  ·  Rod ${s.rod}  ·  Lv${s.skillLevel} (${s.skillXp}/${xpNeed})  ·  ${w.toFixed(1)}/${cap}kg  ·  Stam ${Math.floor(s.stamina)}/${s.maxStamina}`,
    );
    const map = getMap(s.mapId);
    this.locText.setText(`◆  ${map.name}${todLabel ? "  ·  " + todLabel : ""}`);
    this.restingTxt.setText("RESTING").setVisible(resting && s.stamina < s.maxStamina);
  }
}

