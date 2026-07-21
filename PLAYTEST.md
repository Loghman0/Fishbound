# Playtest Checklist - v0.3.0 MVP

Run top-to-bottom after any non-trivial change. Stop on the first regression.

## Smoke (≤ 2 min)
- [ ] Main menu loads. "Continue" or "Save Slots" works.
- [ ] Music plays in main menu.
- [ ] Overworld renders, player can walk, HUD shows clock + money.
- [ ] Ambient sound starts and matches biome (water/birds/wind/steam).

## Fishing loop (≤ 5 min)
- [ ] Cast bar charges, lock works.
- [ ] Hook circle appears, space within window hooks.
- [ ] Fight: reel raises tension, easing lowers it.
- [ ] Snap on max tension shows "Line SNAPPED!" toast.
- [ ] Land a fish: it's added to inventory, money never goes negative on sell.
- [ ] Skill XP increments. Level up plays sound (if synthetic placeholder).

## Content
- [ ] Catch 10 different species across at least 2 biomes.
- [ ] Bestiary: discovered species show sprite + name, undiscovered show "???".
- [ ] Filter tabs switch biome view.
- [ ] Personal best weight populates after a catch.

## Story
- [ ] Visit Outflow → "Foul Water" quest claimable.
- [ ] Catch 5 Slimecarp → next step claimable.
- [ ] Catch 3 Ironback → "outflow_cleaned" flag set; Slag Sire reachable.
- [ ] 10 night catches → GraveRobber quest claimable.

## Weather / Time
- [ ] Phase tint changes (dawn/day/dusk/night).
- [ ] Rain produces particles. Storm flashes + (if shake on) shakes camera.
- [ ] Stormbass biting only in storms.

## Settings
- [ ] Master / Music / SFX / Ambient sliders apply immediately.
- [ ] Screen-shake toggle silences all shakes.
- [ ] Colorblind tab change applies and persists.
- [ ] Autosave toggle persists.

## Save / Load
- [ ] Save in slot 1 (F5), reload page, "Continue" picks it up.
- [ ] Save Slots scene shows playtime + last-played.
- [ ] Export downloads a JSON file; Import re-loads it.

## Endgame
- [ ] Upgrade to Frigate (boat 7) — Abyss portal becomes visible.
- [ ] Catch Moonfish, Tideking, Glacierjaw, Slagsire, Rainshaper.
- [ ] Survive a legendary fight in a storm (Stormbass or Moonfish at night).

## Build
- [ ] `npm run build` exits 0, `dist/` produced.
- [ ] `npm run preview` serves successfully.

## Mark complete
- All checked? Bump version in `package.json` + `MainMenuScene.ts` strapline
  + `CHANGELOG.md`, commit, ship.
