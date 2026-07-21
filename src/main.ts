import Phaser from "phaser";
import { createGame } from "./core/Game";

// ── Global pixel-text defaults ─────────────────────────────────────────────
// Many `scene.add.text(...)` call sites omit a fontFamily and would otherwise
// fall back to the browser's default sans-serif — which looks blurry against
// the pixel-art canvas. Patch the GameObjectFactory once so every Text gets
// the retro VT323 family + a HiDPI resolution by default.
const FactoryProto: any = (Phaser.GameObjects as any).GameObjectFactory.prototype;
const originalText = FactoryProto.text;
FactoryProto.text = function (x: number, y: number, text: any, style: any = {}) {
  const s = { ...(style ?? {}) };
  if (!s.fontFamily && !s.fontStyle?.includes?.("px")) {
    s.fontFamily = '"VT323", ui-monospace, monospace';
  }
  if (s.resolution == null) s.resolution = 2;
  return originalText.call(this, x, y, text, s);
};

window.addEventListener("load", () => {
  createGame("game");
});
