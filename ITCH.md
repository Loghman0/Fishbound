# itch.io Release Template

## Project page metadata

- **Title:** Fishbound 2
- **Tagline:** A cozy, tense pixel-art fishing adventure.
- **Genre:** Adventure, Simulation
- **Tags:** fishing, pixel-art, cozy, exploration, phaser, html5
- **Platform:** HTML5 (web)
- **Pricing:** Pay what you want (suggested $0)
- **Embed:** 640x480 (the game's canvas)

## Description

> Cast, hook, fight. Land 35 species across 8 biomes — from a quiet cove to
> the steamworks outflow, from a frozen lake to the abyss. Help SteamMan
> clean the runoff, hunt down the GraveRobber, master the storm.
> Cozy on the surface, tense in the line.

### Features
- Multi-phase fishing mini-game: cast accuracy, hook timing, fight tension.
- 35 fish, 9 maps, 8 biomes, day/night cycle, dynamic weather.
- 20 quests including a 4-step pollution clean-up arc and a night-theft mystery.
- Bestiary, achievements with cosmetic titles + permanent bonuses.
- 3 save slots, full JSON export/import, autosave, audio sliders,
  colorblind palette, simplified-fishing toggle.

## Build & upload

```bash
npm install
npm run build
cd dist && zip -r ../fishbound2-web.zip .
```

Upload `fishbound2-web.zip` to itch.io as "HTML5", set "This file will be played
in the browser", canvas 640x480, fullscreen allowed.

## Screenshots to take
1. Overworld with HUD visible.
2. Fight phase mid-tension.
3. Bestiary discovered + undiscovered cards.
4. Settings panel.
5. A storm scene with the lightning flash.

## Cover (630x500) and banner (960x540)
Pixel-art splash of the fisherman at dusk on the pier.
