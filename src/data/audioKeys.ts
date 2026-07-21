/**
 * data/audioKeys.ts — placeholder keys kept so existing call sites compile.
 * Audio assets are intentionally removed; AudioSystem is a no-op. Re-populate
 * AUDIO_MANIFEST and the asset folder to re-enable sounds in the future.
 */
export const SFX = {
  CastWhoosh: "sfx.cast_whoosh",
  Splash: "sfx.splash",
  ReelClick: "sfx.reel_click",
  LineTension: "sfx.line_tension",
  LineSnap: "sfx.line_snap",
  ShopBell: "sfx.shop_bell",
  UiClick: "sfx.ui_click",
  Coin: "sfx.coin",
  FishStruggle: "sfx.fish_struggle",
  Bite: "sfx.bite",
  LevelUp: "sfx.levelup",
  Thunder: "sfx.thunder",
  StepGrass: "sfx.step_grass",
} as const;

export const AMB = {
  Water: "amb.water",
  Rain: "amb.rain",
  Wind: "amb.wind",
  Birds: "amb.birds",
  Steamworks: "amb.steamworks",
} as const;

export const MUSIC = {
  Calm: "mus.calm",
  Tense: "mus.tense",
  Village: "mus.village",
  Legendary: "mus.legendary",
} as const;

export interface AudioSpec { key: string; url: string }

/** Empty manifest — no audio assets ship with the build. */
export const AUDIO_MANIFEST: AudioSpec[] = [];
