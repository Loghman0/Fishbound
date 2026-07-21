/**
 * SettingsSystem — game settings, persisted via SaveSystem + mirrored to localStorage.
 */
import type { SaveSystem } from "./SaveSystem";
import type { AudioSystem } from "./AudioSystem";
import { DEFAULT_SETTINGS, type GameSettings } from "../data/settingsDefs";

const LS_KEY = "fishbound2.settings";

export class SettingsSystem {
  private current: GameSettings = { ...DEFAULT_SETTINGS };

  constructor(private save: SaveSystem, private audio: AudioSystem) {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      try { this.current = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }; }
      catch { /* keep defaults */ }
    }
    this.audio.setSettings(this.current);
  }

  get state(): GameSettings { return this.current; }

  syncFromSave(): void {
    const s = this.save.state.settings;
    if (s) this.apply({ ...DEFAULT_SETTINGS, ...s });
  }

  apply(next: GameSettings): void {
    this.current = next;
    this.save.state.settings = next;
    localStorage.setItem(LS_KEY, JSON.stringify(next));
    this.audio.setSettings(next);
  }

  patch(p: Partial<GameSettings>): void { this.apply({ ...this.current, ...p }); }
}
