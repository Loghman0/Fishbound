/**
 * InputManager — unified keyboard + virtual-joystick input with context stack.
 *
 * Why: previously every scene wired its own raw keyboard handlers, which made
 * WASD/Arrow parity, mobile touch, and modal pause-time input conflicts each
 * a per-scene bug. This single class owns it.
 *
 * Contexts ("overworld" | "fishing" | "menu") let scenes declare what role
 * input plays right now. axis()/action()/justPressed() always return 0/false
 * when the active context doesn't match the requested one, so you can write:
 *
 *   if (input.justPressed("interact", "overworld")) ...
 *
 * without checking whether a modal is open.
 */
import Phaser from "phaser";

export type InputContext = "overworld" | "fishing" | "menu";

export type InputAction =
  | "interact" | "back" | "inventory" | "shop" | "quests" | "bestiary"
  | "wardrobe" | "pause"
  | "quickSave" | "quickLoad" | "primary";

const KEY_MAP: Record<InputAction, string[]> = {
  interact:  ["E", "SPACE"],
  back:      ["ESC"],
  pause:     ["ESC"],
  inventory: ["I"],
  shop:      ["B"],
  quests:    ["Q"],
  bestiary:  ["J", "N"],
  wardrobe:  ["C"],
  quickSave: ["F5"],
  quickLoad: ["F9"],
  primary:   ["SPACE"],
};

const AXIS_KEYS = {
  up:    ["W", "UP"],
  down:  ["S", "DOWN"],
  left:  ["A", "LEFT"],
  right: ["D", "RIGHT"],
} as const;

interface VirtualState {
  ax: number;
  ay: number;
  actions: Set<InputAction>;
  justActions: Set<InputAction>;
}

export class InputManager {
  private keys: Record<string, Phaser.Input.Keyboard.Key> = {};
  private ctxStack: InputContext[] = ["overworld"];
  private vstate: VirtualState = { ax: 0, ay: 0, actions: new Set(), justActions: new Set() };

  constructor(private scene: Phaser.Scene) {
    const kb = scene.input.keyboard;
    if (!kb) return;
    const all = new Set<string>();
    Object.values(AXIS_KEYS).forEach((arr) => arr.forEach((k) => all.add(k)));
    Object.values(KEY_MAP).forEach((arr) => arr.forEach((k) => all.add(k)));
    for (const k of all) this.keys[k] = kb.addKey(k);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      for (const k of Object.values(this.keys)) k.destroy();
      this.keys = {};
    });
  }

  /** Push a context onto the stack (e.g. when a modal opens). */
  pushContext(ctx: InputContext): void { this.ctxStack.push(ctx); }
  /** Pop the top context (e.g. when a modal closes). */
  popContext(): void { if (this.ctxStack.length > 1) this.ctxStack.pop(); }
  setContext(ctx: InputContext): void { this.ctxStack = [ctx]; }
  get context(): InputContext { return this.ctxStack[this.ctxStack.length - 1] ?? "overworld"; }

  /** Normalized 2D axis from keyboard + virtual joystick. */
  axis(forCtx?: InputContext): { x: number; y: number } {
    if (forCtx && forCtx !== this.context) return { x: 0, y: 0 };
    let x = 0, y = 0;
    if (this.isAnyDown(AXIS_KEYS.left))  x -= 1;
    if (this.isAnyDown(AXIS_KEYS.right)) x += 1;
    if (this.isAnyDown(AXIS_KEYS.up))    y -= 1;
    if (this.isAnyDown(AXIS_KEYS.down))  y += 1;
    x += this.vstate.ax; y += this.vstate.ay;
    const len = Math.hypot(x, y);
    if (len > 1) { x /= len; y /= len; }
    return { x, y };
  }

  /** True while any binding for `action` is held. */
  action(action: InputAction, forCtx?: InputContext): boolean {
    if (forCtx && forCtx !== this.context) return false;
    if (this.vstate.actions.has(action)) return true;
    return this.isAnyDown(KEY_MAP[action]);
  }

  /** True for one frame on the press edge. */
  justPressed(action: InputAction, forCtx?: InputContext): boolean {
    if (forCtx && forCtx !== this.context) return false;
    if (this.vstate.justActions.has(action)) { this.vstate.justActions.delete(action); return true; }
    for (const k of KEY_MAP[action]) {
      const key = this.keys[k]; if (!key) continue;
      if (Phaser.Input.Keyboard.JustDown(key)) return true;
    }
    return false;
  }

  /** Virtual joystick / touch button drivers. */
  setVirtualAxis(x: number, y: number): void { this.vstate.ax = x; this.vstate.ay = y; }
  pressVirtual(action: InputAction): void { this.vstate.actions.add(action); this.vstate.justActions.add(action); }
  releaseVirtual(action: InputAction): void { this.vstate.actions.delete(action); }

  private isAnyDown(keys: readonly string[]): boolean {
    for (const k of keys) if (this.keys[k]?.isDown) return true;
    return false;
  }
}
