/**
 * QuestLogScene — Phase B: grouped quests (claimable / active / locked),
 * progress bars, reward previews and an explicit claim with celebration.
 */
import Phaser from "phaser";
import { SCENE, CANVAS_W, CANVAS_H } from "../core/Constants";
import { SERVICE_REGISTRY_KEY } from "../core/Game";
import { SFX } from "../data/audioKeys";
import type { GameServices } from "../core/Game";
import type { QuestReward } from "../data/questDefs";
import { FeedbackOverlay } from "../ui/FeedbackOverlay";

export class QuestLogScene extends Phaser.Scene {
  private svc!: GameServices;
  private fx!: FeedbackOverlay;

  constructor() { super(SCENE.QuestLog); }

  private rewardText(r: QuestReward): string {
    const p: string[] = [];
    if (r.coins) p.push(`${r.coins}¢`);
    if (r.bait) p.push(`${r.bait} bait`);
    if (r.baitItem) p.push(`${r.baitItem.qty}× ${r.baitItem.id.replace("bait_", "")} bait`);
    if (r.skillXp) p.push(`${r.skillXp} XP`);
    if (r.permLuck) p.push(`+luck`);
    if (r.permTension) p.push(`+line`);
    if (r.title) p.push(`title: ${r.title}`);
    return p.join(", ") || "—";
  }

  create() {
    this.svc = this.registry.get(SERVICE_REGISTRY_KEY) as GameServices;
    this.input.topOnly = true;
    this.fx = new FeedbackOverlay(this);
    this.svc.audio.playSfx(SFX.UiClick);
    this.render();
    this.input.keyboard!.once("keydown-ESC", () => {
      this.scene.stop();
      this.scene.resume(SCENE.Overworld);
    });
  }

  private render() {
    this.children.removeAll();
    this.add.rectangle(0, 0, CANVAS_W, CANVAS_H, 0x0b1416, 0.96).setOrigin(0);
    this.add.text(CANVAS_W / 2, 22, "Quest Log", { fontSize: "20px", color: "#e6efe2" }).setOrigin(0.5);

    const all = this.svc.quests.list();
    const claimable = all.filter((q) => q.claimable);
    const active = all.filter((q) => !q.completed && !q.locked && !q.claimable);
    const completed = all.filter((q) => q.completed).length;
    const locked = all.filter((q) => q.locked).length;

    // Claim-all button
    if (claimable.length > 0) {
      const btn = this.add.text(CANVAS_W / 2, 48, `★ Claim ${claimable.length} reward${claimable.length > 1 ? "s" : ""}`, {
        fontSize: "12px", color: "#0b1416", backgroundColor: "#ffe066", fontStyle: "bold", padding: { x: 12, y: 5 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      btn.on("pointerover", () => btn.setBackgroundColor("#fff0a0"));
      btn.on("pointerout", () => btn.setBackgroundColor("#ffe066"));
      btn.on("pointerdown", () => this.claim());
    } else {
      this.add.text(CANVAS_W / 2, 48, "No rewards waiting — keep questing!", { fontSize: "10px", color: "#7d8a8e" }).setOrigin(0.5);
    }

    let y = 76;
    const drawRow = (q: typeof all[number], accent: string) => {
      this.add.text(40, y, `${q.def.title}`, { fontSize: "11px", color: accent, fontStyle: "bold" });
      this.add.text(CANVAS_W - 40, y, this.rewardText(q.def.reward), { fontSize: "9px", color: "#ffd479" }).setOrigin(1, 0);
      this.add.text(40, y + 14, q.def.desc, { fontSize: "9px", color: "#aab7bb", wordWrap: { width: CANVAS_W - 200 } });
      // progress bar
      const ratio = q.goal > 0 ? Math.min(1, q.progress / q.goal) : 0;
      const bw = CANVAS_W - 80;
      this.add.rectangle(40, y + 30, bw, 6, 0x22343a).setOrigin(0, 0.5);
      this.add.rectangle(40, y + 30, Math.max(2, bw * ratio), 6, q.claimable ? 0xffe066 : 0x6fb56e).setOrigin(0, 0.5);
      this.add.text(CANVAS_W - 40, y + 26, `${Math.min(q.progress, q.goal)}/${q.goal}`, { fontSize: "8px", color: "#7d8a8e" }).setOrigin(1, 0);
      y += 44;
    };

    if (claimable.length) {
      this.add.text(40, y, "READY TO CLAIM", { fontSize: "9px", color: "#ffe066", fontStyle: "bold" }); y += 16;
      for (const q of claimable) { if (y > CANVAS_H - 90) break; drawRow(q, "#ffe066"); }
    }
    if (active.length && y < CANVAS_H - 90) {
      this.add.text(40, y, "ACTIVE", { fontSize: "9px", color: "#9ccf86", fontStyle: "bold" }); y += 16;
      for (const q of active) { if (y > CANVAS_H - 60) break; drawRow(q, "#d6e2e6"); }
    }

    this.add.text(CANVAS_W / 2, CANVAS_H - 36, `Completed ${completed}  ·  Locked ${locked}`, {
      fontSize: "10px", color: "#6f8a90",
    }).setOrigin(0.5);
    this.add.text(CANVAS_W / 2, CANVAS_H - 18, "ESC to close", { fontSize: "10px", color: "#7d8a8e" }).setOrigin(0.5);
  }

  private claim() {
    const claimed = this.svc.quests.claimAllReady();
    if (!claimed.length) return;
    this.svc.audio.playSfx(SFX.LevelUp);
    this.fx.flash(0xffe066, 0.25);
    this.fx.burst(CANVAS_W / 2, CANVAS_H / 2, 0xffe066, 22, 240);
    this.fx.banner("✓ QUEST COMPLETE", "#ffe066", CANVAS_H / 2 - 60, 20);
    claimed.slice(0, 3).forEach((q, i) =>
      this.time.delayedCall(150 * i, () => this.fx.toast(`${q.title} — ${this.rewardText(q.reward)}`, "#9ccf86")),
    );
    this.time.delayedCall(700, () => this.render());
  }
}
