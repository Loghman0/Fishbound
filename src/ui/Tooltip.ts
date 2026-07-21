/**
 * Tooltip — small hover label. Helper for InventoryScene / Shop expansions.
 */
import Phaser from "phaser";

export class Tooltip {
  private text: Phaser.GameObjects.Text;
  private bg: Phaser.GameObjects.Rectangle;
  constructor(scene: Phaser.Scene) {
    this.bg = scene.add.rectangle(0, 0, 10, 10, 0x000000, 0.8).setOrigin(0).setVisible(false).setDepth(2000).setScrollFactor(0);
    this.text = scene.add.text(0, 0, "", { fontSize: "9px", color: "#ffffff" }).setVisible(false).setDepth(2001).setScrollFactor(0);
  }
  show(x: number, y: number, msg: string): void {
    this.text.setText(msg).setPosition(x + 6, y + 4).setVisible(true);
    this.bg.setPosition(x, y).setSize(this.text.width + 12, this.text.height + 8).setVisible(true);
  }
  hide(): void { this.text.setVisible(false); this.bg.setVisible(false); }
}
