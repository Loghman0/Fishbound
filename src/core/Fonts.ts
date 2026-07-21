/**
 * Fonts.ts — central font tokens used by every Phaser scene.
 *
 * Phase 4: crisp retro web fonts. Use FONT_TITLE for headings / buttons,
 * FONT_BODY for body text and tooltips. Always pass integer font sizes,
 * and never apply setScale() to Phaser Text — it blurs glyphs. Pair with
 * `resolution: TEXT_RESOLUTION` on every Text object for HiDPI sharpness.
 */

export const FONT_TITLE = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
export const FONT_BODY = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

/** Pixel-text resolution multiplier (HiDPI sharpness). */
export const TEXT_RESOLUTION = Math.max(1, Math.min(3, Math.round(
  typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1,
)));

/** Convenience colour tokens used by the retro UI kit. */
export const UI_COLORS = {
  bg: "#0b1416",
  panel: "#0e1a20",
  panelDeep: "#070d10",
  border: "#d4af37",
  borderSoft: "#7a6420",
  text: "#e6efe2",
  textDim: "#aab7bb",
  textMute: "#7d8a8e",
  accent: "#ffe066",
  accentSoft: "#ffd24a",
  good: "#6fb56e",
  warn: "#ffaa33",
  danger: "#ff4d4d",
  hover: "#1c2a30",
  active: "#2c4048",
} as const;
