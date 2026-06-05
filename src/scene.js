// AGF Mobile Prototype 01 — scene / level loader
// Forked from AGF side-scroll seed. Change vs seed:
//   * The seed's scene.js is ~180 lines and wired to attack/projectile
//     systems. v1 drops those calls (the stubs above are no-ops) and
//     keeps just: load level, spawn player, spawn enemies from
//     `level.enemies[]`, spawn hazards from `level.hazards[]`, spawn
//     pickups from `level.pickups[]`, register procedural descriptors.
//   * The level format follows the AGF level schema: top-level `id`,
//     `mapSize`, and one of `background` / `layers` / `props`. We use
//     `layers[]` with procedural entries so the scene editor can still
//     browse the file.

async function loadGameData() {
  state.levels = await loadJSON("data/levels.json");
  state.pickupsCatalog = await loadJSON("data/pickups.json");
  state.hazardsCatalog = await loadJSON("data/hazards.json");
}

async function switchScene(levelId, opts = {}) {
  const entry = (state.levels.levels || []).find((lvl) => lvl.id === levelId);
  if (!entry) throw new Error("Level not found: " + levelId);
  const level = await loadJSON(entry.file);
  state.level = level;
  state.attacks = [];
  state.projectiles = [];
  state.particles = [];
  state.camera = { x: 0, y: 0, lookahead: 0, snapY: 0, shake: 0, shakeT: 0 };

  // Spawn player (always first)
  if (opts.newPlayer || !state.player) {
    state.player = spawnPlayer(level.spawn || { x: 60, y: 200 });
  } else {
    const spawn = level.spawn || { x: 60, y: 200 };
    state.player.x = spawn.x;
    state.player.y = spawn.y;
    state.player.vx = 0;
    state.player.vy = 0;
  }
  state.score = state.score || 0;
  if (opts.resetScore) state.score = 0;

  // Spawn enemies from level JSON
  state.enemies = (level.enemies || []).map((entry) => spawnEnemy(entry));

  // Spawn hazards from level JSON. We register both a top-level hazard
  // entry (for rendering) and a damage collider (so the physics step in
  // updatePlayer can read it).
  state.hazards = (level.hazards || []).map((entry) => ({
    id: entry.id,
    x: entry.x,
    y: entry.y,
    w: entry.w || 32,
    h: entry.h || 24,
    sprite: "procedural://" + (entry.kind || "spike") + "/sheet",
    procedural: {
      shape: entry.kind || "spike",
      body: entry.body || COLORS.spike,
      edge: entry.edge || COLORS.spikeEdge
    }
  }));
  // Also make the hazards readable as damage colliders. The seed uses
  // `level.colliders[]`; we synthesize it here so the player code can
  // stay schema-faithful.
  state.level.colliders = [
    ...(level.platforms || []).map((p) => ({ type: "platform", x: p.x, y: p.y, w: p.w, h: p.h })),
    ...(level.walls || []).map((p) => ({ type: "wall", x: p.x, y: p.y, w: p.w, h: p.h })),
    ...state.hazards.map((h) => ({ type: "hazard", id: h.id, x: h.x, y: h.y, w: h.w, h: h.h, damage: 1 }))
  ];

  // Spawn pickups
  state.pickups = (level.pickups || []).map((entry) => ({
    id: entry.id,
    x: entry.x,
    y: entry.y,
    w: entry.w || 24,
    h: entry.h || 24,
    collected: false,
    score: entry.score ?? 10,
    bobPhase: Math.random() * Math.PI * 2,
    procedural: {
      shape: "coin",
      body: COLORS.coin,
      edge: COLORS.coinEdge
    }
  }));

  state.mode = opts.keepMode ? state.mode : "playing";
}

function updateScene(dt) {
  if (state.mode !== "playing" && state.mode !== "title" && state.mode !== "gameover") return;
  if (state.mode === "playing") {
    updatePlayer(dt);
    updateEnemies(dt);
    enemyContactPlayer();
    updateCamera(dt);
    updatePickups(dt);
    updateAttackStubs(dt);
  }
}

function updatePickups(dt) {
  const p = state.player;
  if (!p) return;
  for (const pickup of state.pickups) {
    if (pickup.collected) continue;
    if (rectsOverlap(bodyRect(p), pickup)) {
      pickup.collected = true;
      state.score += pickup.score || 10;
      burstParticles(pickup.x + pickup.w / 2, pickup.y + pickup.h / 2, 10, COLORS.coin);
    }
  }
}

function updateAttackStubs(dt) {
  updateAttacks();
  updateProjectiles();
}

function startNewRun() {
  state.score = 0;
  state.mode = "playing";
  // Fire-and-forget; state.mode is already "playing" so the in-flight
  // call won't fight with the gameplay loop.
  switchScene(GAME.startScene, { newPlayer: true, keepMode: true }).catch((err) => {
    // Soft-fail: surface the error in the boot overlay via state.error.
    state.error = err;
  });
}

function spawnParticlesAt(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    spawnParticle(x, y, { color });
  }
}
