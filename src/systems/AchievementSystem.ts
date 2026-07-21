/**
 * AchievementSystem — checked after every event; unlocks grant permanent
 * stat boosts persisted on PlayerState.
 */

import type { SaveSystem } from "./SaveSystem";
import { ACHIEVEMENT_DEFS } from "../data/achievementDefs";
import { EventBus } from "../core/EventBus";

export class AchievementSystem {
  constructor(private save: SaveSystem) {
    const recheck = () => this.recheck();
    EventBus.on("fish:caught", recheck);
    EventBus.on("shop:sold", recheck);
    EventBus.on("skill:level", recheck);
    EventBus.on("area:entered", recheck);
  }

  recheck(): string[] {
    const s = this.save.state;
    const newly: string[] = [];
    for (const a of ACHIEVEMENT_DEFS) {
      if (s.unlockedAchievements.includes(a.id)) continue;
      if (a.check(s)) {
        s.unlockedAchievements.push(a.id);
        if (a.reward?.coins) s.coins += a.reward.coins;
        if (a.reward?.luckBonus) s.permLuck += a.reward.luckBonus;
        if (a.reward?.tensionBonus) s.permTension += a.reward.tensionBonus;
        if (a.reward?.title && !s.titles.includes(a.reward.title)) s.titles.push(a.reward.title);
        EventBus.emit("achievement:unlock", a.id);
        newly.push(a.title);
      }
    }
    return newly;
  }
}
