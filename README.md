# AGF Mobile Prototype 01

A mobile-portrait 2D side-scroller prototype built on top of the
[Agent Game Forge (AGF)](https://github.com/0x0funky/agent-game-forge) side-scroll foundation seed.

- Canvas: 540 × 960 (9:16 portrait)
- Engine: vanilla JS + Canvas 2D (no build step, no framework)
- Art: **procedural** — every entity is drawn with Canvas2D primitives
  (`arc`, `fillRect`, quadratic curves). No PNGs are fetched at runtime,
  so there are no missing-asset errors and no image-gen API key is needed.
- Input: keyboard **and** touch (left half of canvas = D-pad, right half = jump)
- Levels driven by AGF-shaped JSON (`data/level_01.json`, `data/player-config.json`, …)

## Quick start

```bash
cd games/mobile-prototype-01

# Pick one (Python is already installed in the dev environment):
python -m http.server 5180
# or
npx --yes serve -l 5180 .
```

Then open <http://localhost:5180> in a desktop or mobile browser.

## Controls

| Action  | Keyboard        | Touch                                  |
| ------- | --------------- | -------------------------------------- |
| Move    | ← / →  or  A / D | Drag on the **left** half of the canvas |
| Jump    | Space  or  K    | Tap on the **right** half               |
| Start / restart | Enter   | Tap on the **right** half (title or gameover) |
| Pause   | P  or  Esc      | (not bound in v1)                      |

## Gameplay

- One main scene (`level_01`) — a 1620 × 960 cavern.
- One player (capsule), two slimes, two spike rows, four coins.
- HP 5, lives 3, score on coin pickup (+10).
- Restart on `lives = 0` by pressing Enter or tapping the right half.

## File layout

```
games/mobile-prototype-01/
├── index.html              # entry, script-tag loading
├── styles.css              # 540x960 portrait + touch-action
├── package.json            # npm scripts only
├── .gitignore
├── PROJECT_BRIEF.md        # project execution contract
├── progress.json           # Hermes execution state
├── src/                    # AGF-style modules (forked from side-scroll seed)
│   ├── constants.js
│   ├── state.js
│   ├── dom.js
│   ├── assets.js           # procedural:// short-circuit lives here
│   ├── config.js
│   ├── catalogs.js
│   ├── input.js            # keyboard + touch
│   ├── audio.js
│   ├── collision.js
│   ├── physics.js
│   ├── platforms.js
│   ├── parallax.js         # procedural gradient + stripes
│   ├── particles.js
│   ├── dialogue.js
│   ├── camera.js
│   ├── render.js           # procedural entity drawer
│   ├── hud.js              # portrait layout
│   ├── scene.js
│   ├── game.js             # boot + main loop
│   └── entities/
│       ├── player.js
│       ├── enemy.js
│       ├── attack.js       # stub (v1)
│       └── projectiles.js  # stub (v1)
├── data/
│   ├── levels.json
│   ├── level_01.json
│   ├── player-config.json
│   ├── physics-config.json
│   ├── camera-config.json
│   ├── audio-config.json
│   ├── hud-config.json
│   ├── enemies.json        # empty catalog (entries live in level JSON)
│   ├── pickups.json        # empty catalog
│   ├── hazards.json        # empty catalog
│   ├── projectiles.json    # empty catalog
│   └── items.json          # empty catalog
├── assets/                 # placeholder folders; not used in v1
│   ├── maps/
│   ├── sprites/
│   └── props/
└── tests/
    └── smoke.sh            # curl-based HTTP smoke test
```

## Why "forked from AGF"?

`games/mobile-prototype-01/src/*` is a direct copy-and-modify of
`apps/daemon/src/templates/foundation/side-scroll/seed/src/*` from the
AGF monorepo. The fork keeps the same module classification
(universal / starter / recipe-fillable) and the same data shape
(`data/<level>.json` with top-level `mapSize` and one of
`background` / `layers` / `props`). That way:

1. The AGF scene editor can still open the level file.
2. Future migrations to real sprite atlases via AGF's `generate2dsprite`
   skill only need to swap the JSON sprite paths — the runtime reads
   `procedural://` as a no-op and treats the rest normally.

## Verifying it works (smoke test)

```bash
bash tests/smoke.sh 5180
```

The script spins up `python -m http.server 5180` (or checks one already
running), `curl`s `/`, `/index.html`, every `src/*.js`, every `data/*.json`,
and `/styles.css`, and exits non-zero on any non-200.

## Known limitations (v1)

- No sound on first load (WebAudio starts on first key/pointer; the
  `musicGain` is muted by default to keep the prototype quiet).
- No second level, no boss, no ranged enemies.
- `assets/` folders exist for forward-compatibility but are empty in v1.
- gh CLI was not available in the dev environment, so the GitHub
  PR was not created via the `gh` CLI. See `PROJECT_BRIEF.md §5/§9`
  for the agreed workflow.
