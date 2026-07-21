# Balance Tuning

Every gameplay number lives in `src/core/Constants.ts` or `src/core/Balance.ts`.
Change a value, refresh, retest.

## Cast Phase
- `CAST_BAR_W = 360` — pixel width of cast bar.
- `CAST_CHARGE_RATE = 1.4` — power gain/sec while holding.
- `CAST_SWEET_SWEEP = 0.9` — sweet-spot drift speed (0..1 / sec).
- `CAST_SWEET_HALF = 0.08` — sweet-spot half-width.

## Hook Phase
- `HOOK_DEFAULT_MS = 700` — default reaction window.
- `HOOK_BASE_CHANCE = 0.85` — base hook chance before luck/accuracy.

## Fight Phase
- `TENSION_MAX = 100`, `TENSION_SNAP = 100`, `TENSION_SNAP_HOLD_MS = 700`.
- `TENSION_REEL_RAISE = 38` — per second while reeling AGAINST.
- `TENSION_DECAY = 22` — per second while easing.
- `REEL_PROGRESS_PER_SEC = 26`, `REEL_FISH_PUSHBACK = 18`,
  `FIGHT_DISTANCE = 100`.
- `STAMINA_REEL_DRAIN = 6` — per sec while reeling.

## Weather
- `WEATHER_TICK_MS = 60_000` — roll new weather every minute.
- `WEATHER_TRANSITIONS` — Markov chain controlling drift between states.

## Skill
- `SKILL_XP_PER_CATCH = { common 4, uncommon 9, rare 22, legendary 80, junk 1 }`
- `SKILL_XP_TO_LEVEL(lv) = 30 + lv*25`
- `SKILL_LUCK_PER_LEVEL = 0.01`
- `SKILL_TENSION_TOL_PER_LEVEL = 0.5`

## Inventory
- `BOAT_CAPACITY_KG = { 0:8, 1:18, 2:32, 3:55, 4:90, 5:140, 6:220, 7:360 }`

## Rod / Boat costs
- See `ROD_COSTS` / `BOAT_COSTS` in `Constants.ts`.

## Daily
- `DAILY_RESET_HOUR = 5` — when caughtToday resets.

## How to tune fight feel
- Fish too easy? Raise `pullStrength` in the species' `fightStats`, or
  raise `TENSION_REEL_RAISE`.
- Snap too fast? Lower `TENSION_REEL_RAISE` or raise rod `tensionTolerance`.
- Reel too slow? Raise `REEL_PROGRESS_PER_SEC` or rod `power`.
- Boring midfight? Raise the species' `jerkChance` / `escapeChance`.

## Saving + versioning
- `SAVE_VERSION = 2` — bump when adding/removing required PlayerState fields.
- Add migration in `src/systems/SaveSystem.ts` (`MIGRATIONS` map).
