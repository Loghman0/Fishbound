/**
 * AudioSystem — no-op stub. All audio assets have been removed; this class
 * exists so existing call sites compile and execute silently. Re-introduce
 * implementations when audio assets return.
 */
import type Phaser from "phaser";
import type { GameSettings } from "../data/settingsDefs";
import { DEFAULT_SETTINGS } from "../data/settingsDefs";

export type AudioCategory = "sfx" | "music" | "ambient";

export class AudioSystem {
  private settings: GameSettings = { ...DEFAULT_SETTINGS };

  attach(_game: Phaser.Game): void { /* no-op */ }
  unlock(): void { /* no-op */ }
  setSettings(s: GameSettings): void { this.settings = s; }
  setCategory(_c: AudioCategory, _v: number): void { /* no-op */ }
  setMaster(_v: number): void { /* no-op */ }
  playSfx(_key: string, _opts?: { volume?: number; rate?: number; detune?: number }): void { /* no-op */ }
  playMusic(_key: string): void { /* no-op */ }
  stopMusic(): void { /* no-op */ }
  playAmbient(_key: string): void { /* no-op */ }
  stopAmbient(): void { /* no-op */ }
  duck(_ms?: number, _factor?: number): void { /* no-op */ }
}
