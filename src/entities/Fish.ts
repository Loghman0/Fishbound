/**
 * Fish entity — purely a sprite holder for shop/inventory/bestiary previews.
 */
import Phaser from "phaser";
import { getCatch } from "../data/fishDefs";

export class Fish extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x: number, y: number, id: string) {
    const def = getCatch(id);
    super(scene, x, y, def?.icon ?? "");
    scene.add.existing(this);
  }
}
