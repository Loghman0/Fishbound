/**
 * AssetManager — declarative wrapper around the Phaser loader.
 *
 * PreloadScene calls registerAll() to enqueue everything declared in the
 * data/ manifests. Keys that are already in the texture/audio cache are
 * skipped so scene restarts don't re-download.
 */
import Phaser from "phaser";
import { FISHERMAN_SHEETS, IMG } from "../data/assetKeys";
import { FISH_DEFS, JUNK_DEFS } from "../data/fishDefs";
import { ROD_DEFS } from "../data/rodDefs";
import { MAP_DEFS } from "../data/mapDefs";
import { AUDIO_MANIFEST } from "../data/audioKeys";
import { DECOR_IMAGES } from "../data/assetKeys";

export class AssetManager {
  constructor(private scene: Phaser.Scene) { }

  registerAll(): void {
    this.loadSpritesheets();
    this.loadImages();
    this.loadMaps();
    this.loadAudio();
  }

  private loadSpritesheets(): void {
    for (const s of FISHERMAN_SHEETS) {
      if (this.scene.textures.exists(s.key)) continue;
      this.scene.load.spritesheet(s.key, s.url, { frameWidth: s.frameW, frameHeight: s.frameH });
    }
  }

  private loadImages(): void {
    const queue: Array<[string, string]> = [];
    // UI images
    queue.push(["ui.esc_menu", "assets/images/ui/esc_menu.png"]);
    for (const [key, url] of DECOR_IMAGES) queue.push([key, url]);
    for (const f of Object.values(FISH_DEFS)) queue.push([`fish.${f.id}`, f.icon]);
    for (const j of Object.values(JUNK_DEFS)) queue.push([`junk.${j.id}`, j.icon]);
    for (const r of Object.values(ROD_DEFS)) if (r.icon) queue.push([`rod.${r.id}`, r.icon]);
    for (const [key, url] of queue) {
      if (this.scene.textures.exists(key)) continue;
      this.scene.load.image(key, url);
    }
  }

  private loadMaps(): void {
    const mapDef = MAP_DEFS.xerite;
    if (mapDef?.tilemapKey && !this.scene.cache.tilemap.exists(mapDef.tilemapKey)) {
      this.scene.load.tilemapTiledJSON(mapDef.tilemapKey, "assets/maps/xerite.json");
    }
    const ts = [
      { key: "ts.Tilesets and props Demo", path: "assets/images/tilesets/Tilesets and props Demo.png" },
      { key: "ts.water", path: "assets/images/tilesets/water.png" },
      { key: "ts.water_anim", path: "assets/images/tilesets/water_anim.png" },
      { key: "ts.quest", path: "assets/images/tilesets/quest.png" },
      { key: "ts.shop", path: "assets/images/tilesets/shop.png" },
      { key: "ts.house", path: "assets/images/tilesets/house.png" },
      { key: "ts.collision", path: "assets/images/tilesets/collision.png" }
    ];
    for (const t of ts) {
      if (!this.scene.textures.exists(t.key)) {
        this.scene.load.image(t.key, t.path);
      }
    }
  }

  private loadAudio(): void {
    for (const a of AUDIO_MANIFEST) {
      if (this.scene.cache.audio.exists(a.key)) continue;
      this.scene.load.audio(a.key, a.url);
    }
  }
}
