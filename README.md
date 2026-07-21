# Fishbound 2 - v0.3.0 (Stage 3 MVP)

A cozy / tense pixel-art fishing adventure. Vite + TypeScript + Phaser 3.80.

> **Status:** Stage 3 / v2 MVP. 35 fish, 9 maps across 8 biomes, full
> fishing mini-game, audio system, day/night & weather, 20 quests with
> narrative chains, bestiary, settings, save slots. Ready for itch.io.

---

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build to dist/
npm run preview  # serve the built dist/
```

## Controls

| Key                  | Action                                |
| -------------------- | ------------------------------------- |
| **WASD / Arrows**    | Move                                  |
| **E / Space**        | Interact (fish water, open shop)      |
| **I**                | Open inventory                        |
| **B**                | Open shop                             |
| **Q**                | Open quest log                        |
| **F5**               | Quick-save to active slot             |
| **F9**               | Quick-load active slot                |
| **Esc**              | Close menus / cancel fishing          |

## What's in v0.3.0

- **35 fish** with lore, behaviors, weight ranges, bait preferences,
  biome tags, weather/time biases, fight stats.
- **9 maps / 8 biomes**: Quiet Cove, Willow Pond, Mossy River, Hidden Cove,
  Sunset Sea, The Abyss, **Rainforest River**, **Steamworks Outflow**,
  **Frozen Lake**.
- **Story arcs**:
  - *SteamMan* runs the polluted Outflow. Three-step quest chain to clean
    it up; the Slag Sire legendary only appears after.
  - *GraveRobber* steals night catches. Catch 10 fish at night to draw him
    out, then bring a legendary as proof.
- **Bestiary** with silhouettes, biome filter tabs, lore, personal best weight.
- **Audio**: cast whoosh, splash, reel clicks, line tension/snap, shop bell,
  UI clicks, coin, thunder, ambient water/rain/wind/birds/steam,
  4 music tracks (calm explore, tense fight, warm village, legendary epic).
- **Settings**: master/music/sfx/ambient sliders, screen-shake toggle,
  simplified fishing, autosave, colorblind palette.
- **Save**: 3 slots with playtime / last-played / biome preview;
  versioned v2 format; full export-as-download / import-from-file JSON.
- Weather visuals: rain particles, storm lightning + screen shake,
  per-phase camera tint, fog overlay support.

## How to add things

### A new fish

1. Drop the PNG into `public/assets/images/fish/<id>.png` (32x16-ish recommended).
2. Add an entry to `FISH_DEFS` in `src/data/fishDefs.ts`:

   ```ts
   Sunbass: {
     id: "Sunbass", name: "Sun Bass", price: 28, rarity: "common",
     icon: "assets/images/fish/sunbass.png",
     weightKg: [0.3, 1.2], biomeTags: ["cove", "sea"],
     activeWindows: ["day"], lore: "Yellow as a coin in summer.",
     bestiaryHint: "Coastal water at midday.",
   },
   ```
3. Add the id to the relevant biome pool in `src/data/mapDefs.ts`.
   The Bestiary, Inventory, Fishing rolls, and save format all update automatically.

### A new map / biome

1. Add a `MapDef` entry to `src/data/mapDefs.ts` with `biome`, `ambientKey`,
   `musicKey`, `fish[]`, `rare[]`, optional `legendary[]`, portals, and modifiers.
2. The Overworld auto-renders procedurally; ambient + music start on entry.

### A new quest

Add to `QUEST_DEFS` in `src/data/questDefs.ts`. Supported kinds:
`catchSpecies`, `catchInBiome`, `catchRarity`, `sellValue`, `explore`,
`craftBait`, `rodTier`, `boatTier`, `skillLevel`, `totalCaught`, `weightOver`,
`weatherCatch`, `narrative`. Rewards: coins, bait, baitItem, skillXp,
permLuck, permTension, title, flag.

### A new audio cue

Add an entry to `AUDIO_MANIFEST` in `src/data/audioKeys.ts`. Call
`svc.audio.playSfx("your.key")` anywhere; `playAmbient` and `playMusic`
crossfade.

## Itch.io release

See `ITCH.md` for the description template, build steps, and recommended
itch.io metadata fields.

## Tuning

All gameplay numbers live in `src/core/Balance.ts` and `src/core/Constants.ts`.
`BALANCE.md` documents every knob with current value + effect.

## Playtesting

`PLAYTEST.md` has the ordered "MVP checklist" — run it after every
non-trivial change to confirm nothing regressed.

## Known issues

- A few new fish reuse existing PNG art as placeholders (Mudbarb, Reedbass,
  Frostperch, Tinker, Slimecarp, Stormbass, Goldbarb, Crystaltrout,
  Ironback, Tideking, Glacierjaw, Slagsire, Rainshaper). Replace by
  adding new PNGs at the path listed in `FISH_DEFS[...].icon`.
- Audio is procedurally generated (placeholder). See
  `public/assets/audio/CREDITS.md` for high-quality CC0 sources to drop in.
- Tile maps for the 3 new biomes use the procedural overworld renderer
  rather than authored Tiled JSON; the JSON loader path is wired and ready
  for hand-authored maps when art is available.

## Credits

Original Fishbound2 modules, sprites, and design © original author.
Stage 1-3 port and modernisation by the Fishbound 2 v2 dev. Procedurally
synthesised audio is CC0.
