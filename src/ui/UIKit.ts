/**
 * UIKit — retro-styled panels, buttons, and menu lists shared by every menu
 * scene. Phase 4: clean dark inner panels with gold accents, hover/active
 * states, and crisp text using the central font tokens.
 */
import Phaser from "phaser";
import { FONT_TITLE, FONT_BODY, TEXT_RESOLUTION, UI_COLORS } from "../core/Fonts";

const hexToInt = (hex: string): number => parseInt(hex.replace("#", ""), 16);

export interface PanelOpts {
  /** Fill colour. Defaults to UI_COLORS.panel. */
  fill?: string;
  /** Border colour. Defaults to UI_COLORS.border. */
  border?: string;
  /** Optional title rendered along the panel's top edge. */
  title?: string;
  /** Outer drop shadow. Defaults to true. */
  shadow?: boolean;
  /** Override fill alpha (0..1). */
  alpha?: number;
}

/**
 * Build a retro panel: drop shadow, dark inner fill, 2px gold border, and
 * a subtle inner highlight. Returns a Container positioned at (x, y) and
 * sized (w, h).
 */
export function createPanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: PanelOpts = {},
): Phaser.GameObjects.Container {
  const fill = hexToInt(opts.fill ?? UI_COLORS.panel);
  const border = hexToInt(opts.border ?? UI_COLORS.border);
  const alpha = opts.alpha ?? 0.96;
  const c = scene.add.container(x, y);

  if (opts.shadow !== false) {
    const shadow = scene.add.rectangle(3, 4, w, h, 0x000000, 0.45).setOrigin(0);
    c.add(shadow);
  }
  const bg = scene.add.rectangle(0, 0, w, h, fill, alpha).setOrigin(0);
  const inner = scene.add.rectangle(2, 2, w - 4, h - 4, 0x000000, 0).setOrigin(0)
    .setStrokeStyle(1, 0xffffff, 0.06);
  const outline = scene.add.rectangle(0, 0, w, h, 0, 0).setOrigin(0)
    .setStrokeStyle(2, border, 1);
  c.add([bg, inner, outline]);

  if (opts.title) {
    const titleBg = scene.add.rectangle(0, 0, w, 22, fill, 1).setOrigin(0);
    const titleTxt = scene.add.text(w / 2, 11, opts.title, {
      fontFamily: FONT_TITLE,
      fontSize: "10px",
      color: UI_COLORS.accent,
      resolution: TEXT_RESOLUTION,
    }).setOrigin(0.5);
    const titleLine = scene.add.rectangle(0, 22, w, 1, border, 1).setOrigin(0);
    c.add([titleBg, titleTxt, titleLine]);
  }
  return c;
}

export interface ButtonOpts {
  width?: number;
  height?: number;
  fontSize?: number;
  fontFamily?: string;
  onClick?: () => void;
  onHover?: () => void;
  /** Sound key, played on click. */
  // (kept loose; the scene wires audio via onClick.)
}

export interface ButtonHandle {
  container: Phaser.GameObjects.Container;
  label: Phaser.GameObjects.Text;
  setLabel: (txt: string) => void;
  setEnabled: (v: boolean) => void;
  destroy: () => void;
}

/**
 * Pixel-font button with idle/hover/active states. Always at least
 * 44×44 so it satisfies mobile tap-target sizing.
 */
export function createButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  opts: ButtonOpts = {},
): ButtonHandle {
  const w = Math.max(44, opts.width ?? 200);
  const h = Math.max(44, opts.height ?? 36);
  const fontSize = opts.fontSize ?? 10;
  const fontFamily = opts.fontFamily ?? FONT_TITLE;

  const c = scene.add.container(x, y);
  const shadow = scene.add.rectangle(2, 3, w, h, 0x000000, 0.35).setOrigin(0.5);
  const bg = scene.add.rectangle(0, 0, w, h, hexToInt(UI_COLORS.panel), 1).setOrigin(0.5);
  const border = scene.add.rectangle(0, 0, w, h, 0, 0).setOrigin(0.5)
    .setStrokeStyle(2, hexToInt(UI_COLORS.borderSoft), 1);
  const inner = scene.add.rectangle(0, 0, w - 4, h - 4, 0, 0).setOrigin(0.5)
    .setStrokeStyle(1, 0xffffff, 0.05);
  const txt = scene.add.text(0, 0, label, {
    fontFamily,
    fontSize: `${fontSize}px`,
    color: UI_COLORS.text,
    resolution: TEXT_RESOLUTION,
    align: "center",
  }).setOrigin(0.5);

  c.add([shadow, bg, border, inner, txt]);

  let enabled = true;
  const hit = new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h);
  c.setSize(w, h).setInteractive(hit, Phaser.Geom.Rectangle.Contains, { useHandCursor: true } as any);

  const setIdle = () => {
    bg.setFillStyle(hexToInt(UI_COLORS.panel), 1);
    border.setStrokeStyle(2, hexToInt(UI_COLORS.borderSoft), 1);
    txt.setColor(enabled ? UI_COLORS.text : UI_COLORS.textMute);
  };
  const setHover = () => {
    bg.setFillStyle(hexToInt(UI_COLORS.hover), 1);
    border.setStrokeStyle(2, hexToInt(UI_COLORS.border), 1);
    txt.setColor(UI_COLORS.accent);
  };
  const setActive = () => {
    bg.setFillStyle(hexToInt(UI_COLORS.active), 1);
    border.setStrokeStyle(2, hexToInt(UI_COLORS.accentSoft), 1);
    txt.setColor(UI_COLORS.accent);
  };

  c.on("pointerover", () => { if (enabled) { setHover(); opts.onHover?.(); } });
  c.on("pointerout", () => { if (enabled) setIdle(); });
  c.on("pointerdown", () => { if (enabled) setActive(); });
  c.on("pointerup", () => {
    if (!enabled) return;
    setHover();
    opts.onClick?.();
  });

  setIdle();

  return {
    container: c,
    label: txt,
    setLabel: (s) => txt.setText(s),
    setEnabled: (v) => {
      enabled = v;
      c.setAlpha(v ? 1 : 0.55);
      setIdle();
    },
    destroy: () => c.destroy(),
  };
}

export interface MenuListItem {
  label: string;
  onSelect: () => void;
  enabled?: boolean;
}

/**
 * Vertical menu list of buttons centred at (cx, cy). Supports keyboard
 * navigation (Up/Down + Enter) in addition to mouse clicks.
 */
export function createMenuList(
  scene: Phaser.Scene,
  cx: number,
  topY: number,
  items: MenuListItem[],
  opts: { width?: number; gap?: number; buttonHeight?: number } = {},
): { buttons: ButtonHandle[]; destroy: () => void } {
  const width = opts.width ?? 220;
  const buttonHeight = opts.buttonHeight ?? 36;
  const gap = opts.gap ?? 10;
  const buttons: ButtonHandle[] = [];
  let cursor = 0;

  items.forEach((it, i) => {
    const y = topY + i * (buttonHeight + gap);
    const b = createButton(scene, cx, y, it.label, {
      width,
      height: buttonHeight,
      onClick: () => { if (it.enabled !== false) it.onSelect(); },
      onHover: () => { cursor = i; refresh(); },
    });
    if (it.enabled === false) b.setEnabled(false);
    buttons.push(b);
  });

  const refresh = () => {
    buttons.forEach((b, i) => {
      if (i === cursor) {
        b.label.setColor(UI_COLORS.accent);
      } else {
        b.label.setColor(items[i]?.enabled === false ? UI_COLORS.textMute : UI_COLORS.text);
      }
    });
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown") { cursor = (cursor + 1) % items.length; refresh(); }
    else if (e.key === "ArrowUp") { cursor = (cursor - 1 + items.length) % items.length; refresh(); }
    else if (e.key === "Enter") {
      const it = items[cursor];
      if (it && it.enabled !== false) it.onSelect();
    }
  };
  scene.input.keyboard?.on("keydown", onKey);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.input.keyboard?.off("keydown", onKey));

  refresh();
  return {
    buttons,
    destroy: () => buttons.forEach((b) => b.destroy()),
  };
}

/** Crisp pixel-font text helper. Always integer size, no scale. */
export function pixelText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  opts: {
    size?: number;
    color?: string;
    family?: string;
    align?: "left" | "center" | "right";
    bg?: string;
    padX?: number;
    padY?: number;
  } = {},
): Phaser.GameObjects.Text {
  const t = scene.add.text(x, y, text, {
    fontFamily: opts.family ?? FONT_BODY,
    fontSize: `${opts.size ?? 12}px`,
    color: opts.color ?? UI_COLORS.text,
    align: opts.align ?? "left",
    resolution: TEXT_RESOLUTION,
    ...(opts.bg
      ? { backgroundColor: opts.bg, padding: { x: opts.padX ?? 6, y: opts.padY ?? 3 } }
      : {}),
  });
  return t;
}

export { FONT_TITLE, FONT_BODY, UI_COLORS, TEXT_RESOLUTION };
