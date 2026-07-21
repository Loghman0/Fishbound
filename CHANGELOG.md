# Changelog

## v0.5.0 — Phase B: Player Experience (2026-06-19)

Player-experience overhaul focused on reward loops, feedback and map
identity. **No content removed. Save format unchanged (v2) — all existing
saves load; new state is optional with safe defaults.**

### Critical fix (gameplay-blocking)
- **Movement no longer crashes.** `AnimationRegistry` passed `end: undefined`
  to `generateFrameNumbers`, producing zero-frame walk/row/etc. animations
  that threw `Cannot read properties of undefined (reading 'duration')` the
  instant the player moved. Frame config is now built without an undefined
  `end`, so Phaser falls back to "all frames" correctly.

### Catch & rarity presentation
- **Catch splash cards** — every landed fish/junk now shows a rarity-framed
  card with sprite, name, rarity, weight, value, particle burst, screen
  flash and a rarity-specific SFX cue.
- **NEW SPECIES popup** the first time a species is caught.
- **NEW RECORD popup** when a catch beats your personal/heaviest best.
- **Unified rarity palette** (`data/rarityDefs.ts`) — consistent colors,
  glow, particle tints and labels across catch cards, inventory, shop,
  bestiary and quests.
- **Fishing feedback polish** — tension bar now reads green→amber→red with a
  danger pulse and a tension warning cue (the old inverted color logic is
  fixed); rare/legendary lands add screen shake.

### Map identity & exploration
- **Per-map themes** (`data/mapThemes.ts`) — distinct land/water palettes,
  checkerboard tinting, scattered decoration (existing object art: trees,
  rocks, bushes, flowers, mushrooms, logs) and an ambient particle effect
  per biome (leaves, snow, embers, fireflies, pollen, mist, bubbles).
- Fishing screen water color now matches the current biome.
- **Exploration rewards** — first visit to a map grants coins + bait with a
  "New area discovered" celebration; every entry shows a location caption.

### UX improvements
- **Inventory** — rarity-colored borders + corner dots, capacity bar, total
  value, rarity/value sorting, hover tooltips with lore and personal best.
- **Shop** — sectioned layout, sell summary with rarity breakdown,
  current→next gear stats, boat icon, coin-burst purchase feedback.
- **Quest log** — grouped (claimable / active), per-quest progress bars,
  reward previews, explicit Claim-all with a completion celebration; an
  overworld "★ N quests ready" indicator.
- **Bestiary** — rarity-tinted discovered cards + glow, overall/per-biome
  discovery progress bar; now openable from the overworld with **J**.

### Progression / reward loops
- **Catch streaks** — consecutive landed fish build a small coin bonus shown
  on the catch card (resets on a lost fish); best streak tracked.
- Smoother early skill curve and a slightly lower junk rate to reduce
  repetitive dry spells.

### Files added
- `src/data/rarityDefs.ts`, `src/data/mapThemes.ts`, `src/ui/FeedbackOverlay.ts`

### Save compatibility
- New optional `PlayerState` fields (`exploredRewarded`, `catchStreak`,
  `bestStreak`) default safely; old v2 saves are normalized on load and never
  re-reward already-explored maps. `SAVE_VERSION` unchanged.


## v0.4.0 — Stage 4 Refactor (2026-06-19)

Phase A critical fixes + architecture refactor. **No gameplay content
removed. Save format unchanged (v2). All v2 saves continue to load.**

### Critical fixes
- **WASD movement** is now first-class alongside Arrow keys via the new
  central `InputManager` (single source of truth, both schemes always active).
- **Input conflicts**: scenes declare an input context (`overworld` /
  `fishing` / `menu`). Modal scenes (Inventory, Shop, Workbench, QuestLog,
  Settings) already paused the overworld; the new manager additionally
  ignores gameplay keys outside the active context, so leaks across scene
  boundaries can't fire stale actions.
- **Movement responsiveness**: diagonal movement is now normalized in
  `InputManager.axis()` (proper unit vector — previous code had a
  half-broken SQRT2 division) and `Player.move()` accepts a pre-normalized
  direction plus a speed scalar. Velocity-only; the per-frame `setPosition`
  back-off that fought Arcade Physics has been removed.
- **Physics & collision**: world bounds are set on the physics world AND
  on the player body (`setCollideWorldBounds`). Shop / workbench / home
  tiles, and water tiles when the boat tier is insufficient, are now real
  static Arcade colliders instead of position rollback.
- **Animation system**: new `AnimationRegistry` registers every spritesheet
  animation exactly once, idempotent across scene restarts. Fixes
  "anim already exists" warnings; supports new character prefixes via
  `registerGroup()`.
- **Asset loading**: new `AssetManager` wraps the Phaser loader with a
  declarative manifest derived from `data/`. Keys already in cache are
  skipped (safe on `scene.restart()`); load errors are now logged.
- **Tilemap rendering** confirmed clean: `pixelArt`, `roundPixels`,
  camera bounds, smoothed camera follow (`startFollow(..., 0.15, 0.15)`).
- **Memory leaks**: new `SceneLifecycle` helper auto-removes EventBus
  listeners, scene update callbacks, particle emitters, and weather FX on
  `SHUTDOWN`/`DESTROY`. `OverworldScene` and `FishingScene` now route
  cleanup through it. Weather emitter in `FishingScene` is also guarded
  by an explicit `SHUTDOWN` once-listener.
- **Mobile compatibility**: new `TouchControls` overlay — virtual joystick
  (left half of screen) + interact button (right) — auto-shown on touch
  devices, hidden on desktop. Both drive the same `InputManager` so no
  scene code needs to know. Phaser `scale.mode = FIT` retained.
  `AudioSystem.unlock()` resumes the WebAudio context on first pointerdown
  (mobile autoplay policy).

### Architecture
- New folders: `src/input/`, `src/assets/`. `src/core/` gains
  `SceneLifecycle`. `src/data/` gains `cosmeticDefs.ts`. `src/systems/`
  gains `WardrobeSystem`.
- `Player.setSkin(prefix, fallback)` lets cosmetics swap the animation
  prefix without scene-level branching.
- `GameServices.wardrobe` registered in `BootScene` and exposed
  through the existing service registry.
- Save schema: new optional `equippedCosmetic?: string` on `PlayerState`.
  Old saves load unchanged — defaults are filled by `makeFreshState()`
  overlay on `load()`, no SAVE_VERSION bump needed.

### Visual infrastructure
- `Player` now resolves its sprite via cosmetic (default `fisherman`),
  pulling existing PNGs in `public/assets/images/characters/`.
- `Boat` entity uses tier-driven sprite from `boatDefs` (already wired —
  retained; no change needed).
- `Fish` entity uses species sprite key from `fishDefs` (already wired).

### Files added
- `src/core/SceneLifecycle.ts`
- `src/input/InputManager.ts`, `src/input/TouchControls.ts`
- `src/assets/AssetManager.ts`, `src/assets/AnimationRegistry.ts`
- `src/data/cosmeticDefs.ts`
- `src/systems/WardrobeSystem.ts`

### Files changed
- `src/entities/Player.ts` — normalized-direction move(), `setSkin()`,
  world-bounds collide.
- `src/scenes/OverworldScene.ts` — uses `InputManager` + `TouchControls` +
  `SceneLifecycle`; static collider group for impassable tiles; cosmetic
  re-application on `wardrobe:changed`.
- `src/scenes/PreloadScene.ts` — delegates to `AssetManager` and
  `AnimationRegistry`; logs load errors.
- `src/scenes/FishingScene.ts` — explicit SHUTDOWN guard for weather FX.
- `src/scenes/BootScene.ts` — instantiates `WardrobeSystem`; unlocks
  audio on first pointerdown.
- `src/systems/AudioSystem.ts` — `unlock()` method.
- `src/systems/SaveSystem.ts` — optional `equippedCosmetic` field
  (back-compatible).
- `src/core/Game.ts` — `wardrobe` in `GameServices`.

### Extensibility (data-only adds going forward)
- More **maps**: add to `mapDefs.ts`.
- More **fish**: add to `fishDefs.ts` — rendering & loader pick up the
  sprite key automatically via `AssetManager`.
- More **quests**: add to `questDefs.ts`.
- More **NPCs**: extend existing `NPC` entity + add a registry entry.
- **Cosmetic wardrobe**: add to `cosmeticDefs.ts` + register a new
  animation group via `AnimationRegistry.registerGroup(scene, [...])`.

# Changelog

## v0.3.0 - Stage 3 MVP (2026-06-18)

### Added
- **35 fish** across 4 rarities with new fields: `biomeTags`, `baitPreference`,
  `lore`, `bestiaryHint`. 19 new fish including 5 new legendaries.
- **9 maps / 8 biomes**: pond, river, rainforest, cove, sea, abyss, frozen, outflow.
  3 new maps: rainforest_river, steamworks_outflow, frozen_lake.
- **Environmental narrative**: SteamMan pollution arc (4 quests, clearable) +
  GraveRobber night-theft arc (2 quests).
- **Bestiary scene** rewritten — biome filter tabs, silhouettes for undiscovered
  fish, lore + personal best weight in detail pane.
- **20 quests** including narrative chains, weight records, weather catches,
  exploration goals. New reward fields: permLuck, permTension, title, flag.
- **15 achievements** with bronze/silver/gold tiers, cosmetic titles, permanent bonuses.
- **AudioSystem** rewritten — per-category gain (sfx/music/ambient), crossfade
  music + ambient, ducking, settings-driven.
- **22 audio files** procedurally generated (CC0): 13 sfx, 5 ambient loops,
  4 music loops.
- **SettingsScene** — master/music/sfx/ambient volume sliders, screen-shake,
  simplified-fishing, autosave, colorblind palette.
- **SaveSlotsScene** — 3 slots with playtime, last-played, biome preview,
  export download / import file picker.
- Save format **v2** with one-step migration from v1 (settings, flags,
  flagCounters, bestWeight, heaviestKg, playtimeSec).
- HUD now shows active title.
- Weather visuals retained (rain, storm lightning, fog), tied to settings shake.

### Changed
- Music switches automatically per biome; legendary fights swap to `legendary` music.
- Ambient layer per map (water, birds, wind, steamworks, rain).
- Fishing screen now plays cast whoosh / splash / reel clicks / line snap / bite SFX.
- Screen shake everywhere now respects the Settings toggle.
- Heaviest catch + per-species personal bests tracked and shown in Bestiary.

### Files added
- `src/data/audioKeys.ts`, `src/data/settingsDefs.ts`
- `src/systems/SettingsSystem.ts`
- `src/scenes/SettingsScene.ts`, `src/scenes/SaveSlotsScene.ts`
- `public/assets/audio/{sfx,ambient,music}/*.wav`
- `BALANCE.md`, `PLAYTEST.md`, `ITCH.md`, `public/assets/audio/CREDITS.md`

## v0.1.0 - Stage 1 Foundation (2026-06-18)

(see prior Stage 1 notes)
