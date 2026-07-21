/**
 * InventoryGrid — reusable grid renderer used by InventoryScene (and later Shop).
 */
import Phaser from "phaser";
import type { InventoryEntry } from "../systems/InventorySystem";

export interface GridOptions {
  cols: number;
  cell: number;
  originX: number;
  originY: number;
}

export class InventoryGrid {
  constructor(private scene: Phaser.Scene, private opts: GridOptions) {}

  render(entries: InventoryEntry[]): Phaser.GameObjects.GameObject[] {
    const out: Phaser.GameObjects.GameObject[] = [];
    entries.forEach((e, i) => {
      const cx = this.opts.originX + (i % this.opts.cols) * this.opts.cell;
      const cy = this.opts.originY + Math.floor(i / this.opts.cols) * this.opts.cell;
      out.push(this.scene.add.rectangle(cx, cy, this.opts.cell - 6, this.opts.cell - 6, 0x1c2a30).setStrokeStyle(1, 0x2c4048));
      const iconKey =
        e.kind === "fish" ? `fish.${e.id}` :
        e.kind === "junk" ? `junk.${e.id}` : "ui.coin";
      if (this.scene.textures.exists(iconKey)) {
        out.push(this.scene.add.image(cx, cy - 4, iconKey).setScale(1.5));
      }
      out.push(this.scene.add.text(cx + 16, cy + 14, `×${e.qty}`, { fontSize: "10px", color: "#ffffff" }).setOrigin(1, 0.5));
    });
    return out;
  }
}
