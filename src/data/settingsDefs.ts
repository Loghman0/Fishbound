/**
 * data/settingsDefs.ts — default user settings (override in PlayerState.settings).
 */
export interface GameSettings {
  master: number;
  music: number;
  sfx: number;
  ambient: number;
  screenShake: boolean;
  colorblind: "off" | "protanopia" | "deuteranopia" | "tritanopia";
  simplifiedFishing: boolean;
  autosave: boolean;
}

export const DEFAULT_SETTINGS: GameSettings = {
  master: 0.7, music: 0.6, sfx: 0.8, ambient: 0.5,
  screenShake: true, colorblind: "off", simplifiedFishing: false, autosave: true,
};
