# AGF Mobile Prototype 01 — Project Brief

> Generated 2026-06-05 by Hermes for the GameForgeLab workstream.
> This file is **the project execution contract** for any agent (Claude Code / Codex) modifying the project. It is NOT a marketing document.

---

## 1. Identity

- **Project name (working)**: AGF Mobile Prototype 01
- **Engine target**: Web (vanilla JS + Canvas) — AGF default
- **Genre**: Side-scroll, mobile-portrait (9:16)
- **Art style**: Procedural / programmatic shapes (no external image assets). All entities are drawn by `Canvas2D` primitives. This is a deliberate choice to keep the prototype self-contained, runnable without any image-gen API key, and to satisfy the "no missing-asset" / "no red console error" acceptance gates.
- **Visual decisions** (mirrors `.ogf/spec.md §1` in side-scroll mode):
  - `genre`: side-scroll
  - `animation_richness`: lite (single-frame actions only — `frameW=64, frameH=64, frames=1, fps=8`)
  - `module_style`: simple (script-tag + globals, matches AGF `simple` mode)
  - `combat_style`: minimal (1 enemy type, 1 collectible type, score + HP + restart)
- **Out of scope** (per task spec): networking, IAP, ads, account, Unity/Godot migration, big third-party engines, framework rewrite, deleting AGF templates, overwriting user assets.

## 2. Hard constraints (NON-NEGOTIABLE)

1. **Do not modify the AGF workspace at the parent level.** The clone at `agent-game-forge-workspace/` is read-only for our purposes. All work lives under `games/mobile-prototype-01/`.
2. **Do not rewrite the AGF seed's framework files.** Use them as-is and *fork* by copying into our project's own `src/`. The seed's module classification (Universal vs Starter vs Recipe-fillable) is the contract.
3. **All sprites are procedural.** Sprite paths in JSON may point to placeholder files, but the runtime must short-circuit the image load and use the procedural renderer. No fetch of real PNGs is required.
4. **Mobile portrait, 540×960 logical viewport (9:16).** Canvas resolution locked; CSS aspect-ratio enforces portrait.
5. **No red console errors.** `console.error` is forbidden. `console.warn` is tolerated for soft fallbacks.
6. **No token, no API key, no `.env`** in the repo. `.gitignore` blocks all of these.
7. **No force-push. No global git config changes.** Local repo only.
8. **Do NOT write this PROJECT_BRIEF.md's parent task prompt into the project.** PR description must be authored from §10 below, not from the task chat.

## 3. Source of truth — project layout

```
mobile-prototype-01/
├── PROJECT_BRIEF.md          # this file
├── progress.json             # live execution state (pending/running/completed/failed/blocked/last_check)
├── README.md                 # run + dev instructions (public-facing, no prompt leak)
├── package.json              # dev server scripts only (no build step)
├── .gitignore
├── index.html                # single entry, canvas 540x960, portrait, script-tag loading
├── styles.css                # portrait layout, touch-friendly buttons
├── src/                      # forked from AGF side-scroll seed, adapted to 540x960 + touch
│   ├── constants.js          # VIEW = {w:540, h:960}; GAME.title/startScene; COLORS; DEFAULT_ANIM
│   ├── state.js              # global mutable state singleton
│   ├── dom.js                # canvas + ctx access
│   ├── assets.js             # loader; add procedural:// scheme short-circuit
│   ├── config.js             # cfg() loader
│   ├── catalogs.js           # byId() lookup
│   ├── input.js              # keyboard + **touch** (left/right half + jump button)
│   ├── audio.js              # WebAudio SFX (procedural)
│   ├── collision.js          # rectsOverlap, bodyRect, pointInRect
│   ├── physics.js            # gravity + 2-axis integrate/resolve
│   ├── platforms.js          # platformColliders, damageColliders
│   ├── parallax.js           # bg layer sort (procedural gradient — no PNG)
│   ├── camera.js             # follow + clamp + shake
│   ├── particles.js          # burstParticles
│   ├── dialogue.js           # unused (kept for seed parity, no-op when state.message null)
│   ├── hud.js                # HP bar + score + lives, mobile-portrait layout
│   ├── render.js             # scene draw orchestration; entity-shape drawer for procedural mode
│   ├── scene.js              # updateScene; load level JSON
│   ├── game.js               # boot/frame loop; handleGlobalInput; startNewRun
│   └── entities/
│       ├── player.js         # run + jump (touch or arrow); HP, lives
│       ├── enemy.js          # patrol + chase; simple AI
│       ├── attack.js         # not used in v1 (combat_style=minimal); kept as stub returning null
│       └── projectiles.js    # not used in v1; stub
├── data/                     # AGF-style structured data
│   ├── levels.json
│   ├── player-config.json
│   ├── enemies.json
│   ├── pickups.json
│   ├── hazards.json
│   ├── camera-config.json
│   ├── physics-config.json
│   ├── hud-config.json
│   ├── audio-config.json
│   └── level_01.json         # one main scene; mobile-portrait layout
├── assets/                   # empty (intentionally) — procedural mode; placeholder folders kept
│   ├── maps/                 # .gitkeep
│   ├── sprites/              # .gitkeep
│   └── props/                # .gitkeep
└── tests/                    # smoke test scripts
    └── smoke.sh              # curl the dev server, check 200 + body markers
```

## 4. Module fork policy (mirrored from AGF SEED.md, scoped to this project)

### Universal — copy verbatim from seed, only adjust viewport constants
`constants.js`, `state.js`, `dom.js`, `collision.js`, `physics.js`, `platforms.js`, `particles.js`, `dialogue.js`, `catalogs.js`, `parallax.js`, `camera.js`, `hud.js` (geometry), `audio.js`, `config.js`

### Starter — fork wholesale for this project
- `entities/player.js` — disable double-jump, simplify, add touch-friendly bounds
- `entities/enemy.js` — single enemy type, simple patrol, no ranged
- `entities/attack.js` — stub (combat_style=minimal, no player attack)
- `entities/projectiles.js` — stub

### Extended by this project (new behaviour)
- `input.js` — touch layer (pointerdown/pointermove/pointerup on canvas, virtual D-pad left half + jump button right half)
- `assets.js` — `procedural://` short-circuit: if sprite path starts with `procedural://`, skip `fetch`, mark image as a placeholder 1x1 transparent, set `anim.procedural = { kind, palette, w, h }` for the renderer
- `render.js` — when `anim.procedural` is set, draw with `ctx.fillStyle/arc/fillRect` instead of `drawImage`
- `hud.js` — portrait layout: HP bar top-left (full-width 80%), score top-right, lives bottom-center
- `scene.js` — restart: when `state.hp <= 0` or fall off bottom, transition to `mode=gameover` and let `game.js#startNewRun` reset on `start` press

## 5. Procedural drawing contract

Each entity declares a procedural descriptor instead of (or in addition to) a sprite path:

```json
{
  "id": "player",
  "kind": "player",
  "size": { "w": 48, "h": 64 },
  "procedural": {
    "shape": "capsule",
    "body": "#4ea1ff",
    "outline": "#0e2a4d",
    "eye": "#ffffff"
  }
}
```

`render.js` reads `procedural` and draws each entity shape at `(entity.x, entity.y)`. This satisfies the "no missing-asset" gate because no PNG fetch ever runs.

If JSON entries are kept with the AGF `animations.sprite` field for forward-compatibility, the path is `procedural://player/idle` and `assets.js` resolves it without a network call.

## 6. Game design (v1)

| Concern | Implementation |
|---|---|
| Player | 48×64 capsule, HP 3, lives 3, single jump, gravity-driven |
| Main scene | `data/level_01.json` — 1 platform, ground, 1 enemy spawn, 3 coin spawns |
| Enemy | "slime": 40×32, patrol 80px, contact = 1 HP damage, knockback |
| Collectible | "coin": 24×24, +10 score, sparkle particle on pickup |
| Hazard | "spike": 32×24 on ground, contact = 1 HP damage |
| Score | 0 → ∞; +10 per coin |
| HP / fail | HP=0 → 1 life lost, brief invuln; lives=0 → gameover mode → restart on start |
| Restart | `state.startNewRun()` resets score=0, hp=3, lives=3, respawns player at spawn |
| Controls | Keyboard (Arrow keys + Space) **and** touch (left half = move, right half = jump, tap-anywhere-restart on gameover) |
| Mobile portrait | Canvas 540×960, `aspect-ratio: 9/16`, no scroll, no zoom |

## 7. Acceptance gates (HARD)

These map 1:1 to the task's phase-6 checklist. **All must pass** for the prototype to ship.

1. `npm install` (or `npx serve` etc.) succeeds
2. Project start command succeeds and serves HTTP 200
3. The HTML returns 200 with the canvas + script tags present (smoke test)
4. No missing-asset error (i.e. no 404 for any of our refs in DevTools network)
5. No red console error (`grep -E 'console\\.error|Uncaught' smoke.log` returns 0)
6. Game enters main scene (state.mode === "playing" after start)
7. Player can be controlled (input.actions.x !== 0 OR touch.active)
8. Score + HP + restart at least 2/3 — we implement all 3
9. README.md has run instructions
10. `git status` clean
11. GitHub remote exists (push OK or clear "gh not logged in" note)
12. PR exists OR clear note that gh was not authenticated

## 8. Run / dev commands

```bash
# from this directory
npx --yes serve -l 5180 .          # static-serve the folder
# open http://localhost:5180

# or, with Python 3:
python3 -m http.server 5180
```

Why not a heavy Vite setup? The task forbids big third-party engines and the AGF runtime is pure browser vanilla JS. `serve` is a one-line static server with no build step.

## 9. Git / GitHub workflow (this project's local rules)

- Repo root: `E:/GameForgeLab/agent-game-forge-workspace` (NOT inside the AGF clone's own .git — that is the upstream). We'll create a **separate** git repo for the GameForgeLab work root, OR init a fresh repo inside `games/mobile-prototype-01/`. We choose the latter (cleaner isolation).
- Branches: `main` (initial empty stub), then `feature/mobile-prototype-v1` for all v1 work.
- Commit messages: `chore: …`, `feat: …`, `fix: …`, `docs: …` — short English, no prompt leakage.
- `.gitignore` blocks: `node_modules`, `dist`, `build`, `.env`, `.env.*`, `*.log`, `.DS_Store`, `.cache`, `tmp`, `temp`, plus AGF's own `apps/*/dist`, `apps/*/node_modules`.
- Remote: `https://github.com/GK0421/agent-game-forge-mobile-prototype.git` (assumed GitHub user `GK0421` from global git config; the user will be asked to confirm before push).
- Default branch: `main`; development branch: `feature/mobile-prototype-v1`.
- No force-push. No global config changes.

## 10. PR description template (no prompt leakage)

```markdown
# Add AGF mobile game prototype v1

## Implemented features
- Mobile-portrait (540x960) 2D side-scroller
- Player capsule: run, jump, HP, lives, restart
- One enemy type (slime): patrol + contact damage
- One collectible (coin): score +10
- One hazard (spike): contact damage
- Score, HP, lives, gameover + restart
- Touch controls (left/right halves + jump) and keyboard (arrows + space)

## How to run
\`\`\`
cd games/mobile-prototype-01
npx --yes serve -l 5180 .
# open http://localhost:5180 on desktop or mobile
\`\`\`

## Validation results
- Static server returns 200 on /, /index.html, /styles.css, all /src/*.js, all /data/*.json
- No missing-asset errors (procedural rendering — no PNGs fetched)
- No red console errors during boot or gameplay
- Player responds to keyboard and touch input
- Score increments on coin pickup; HP decrements on enemy/hazard contact
- Gameover triggers on lives=0; restart restores initial state

## Known issues
- gh CLI was not installed in the WSL environment; the GitHub remote/PR was created via direct `git push` over HTTPS using the credential helper, OR a clear note is included if push was blocked
- All sprites are procedural; adding real art via `generate2dsprite` is the next milestone

## Next steps
- Replace procedural shapes with sprite sheets from the AGF sprite skill
- Add parallax background and a second level
- Add sound-on-event polish and gamepad support
```

## 11. Progress state (this file's companion: `progress.json`)

`progress.json` is the single machine-readable state for all delegated subtasks. Hermes updates it after every round. Fields: `pending`, `running`, `completed`, `failed`, `blocked`, `last_check`.

## 12. Escalation policy

- After 2 consecutive failed rounds on the same target, mark `failed` in `progress.json` with reason and stop that branch.
- Do not pile on cosmetic robustness — the prototype is for verification, not for production polish.
- If a tool (`npm install`, `npx serve`, `git push`) is unavailable, record `blocked` and ask the user — do not install global tools.
