/**
 * NPC — stub for shopkeepers and quest givers. Stage 1: just a label.
 */
import Phaser from "phaser";

export interface NPCDef {
  id: string;
  name: string;
  x: number;
  y: number;
  role: "shopkeeper" | "questgiver" | "villager";
}

export class NPC extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, public def: NPCDef) {
    super(scene, def.x, def.y);
    const dot = scene.add.rectangle(0, 0, 16, 16, 0xffe066);
    const label = scene.add.text(0, -14, def.name, {
      fontSize: "8px", color: "#ffffff", backgroundColor: "#00000088", padding: { x: 2, y: 1 },
    }).setOrigin(0.5);
    this.add([dot, label]);
    scene.add.existing(this);
  }
}
