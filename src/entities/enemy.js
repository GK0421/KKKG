// AGF Mobile Prototype 01 — enemy entity (single type: slime)
// Forked from AGF side-scroll seed. Change vs seed:
//   * Simplified to a single "slime" archetype defined inline in the
//     level JSON (no `enemies.json` catalog needed for v1).
//   * Patrol-only AI with a small jump arc so it stays on its platform.
//   * No projectiles, no ranged behavior, no boss.

function spawnEnemy(entry) {
  const enemy = {
    id: entry.id || "slime",
    kind: "enemy",
    archetype: entry.archetype || "slime",
    x: entry.x,
    y: entry.y,
    w: entry.w || 40,
    h: entry.h || 32,
    vx: 0,
    vy: 0,
    bodyInsetX: 6,
    bodyInsetY: 4,
    facing: -1,
    grounded: false,
    patrolMin: entry.patrolMin ?? entry.x - 80,
    patrolMax: entry.patrolMax ?? entry.x + 80,
    speed: entry.speed ?? 60,
    contactDamage: entry.contactDamage ?? 1,
    anim: "walk",
    animations: {
      walk: { sprite: "procedural://slime/walk", meta: { ...DEFAULT_ANIM }, image: null },
      idle: { sprite: "procedural://slime/idle", meta: { ...DEFAULT_ANIM }, image: null }
    },
    procedural: {
      shape: "slime",
      body: COLORS.enemy,
      outline: COLORS.enemyOutline,
      eye: "#ffffff"
    }
  };
  return enemy;
}

function updateEnemies(dt) {
  for (const e of state.enemies) {
    // Patrol between min/max X. Reverses at the edge.
    if (e.x <= e.patrolMin) {
      e.facing = 1;
    } else if (e.x + e.w >= e.patrolMax) {
      e.facing = -1;
    }
    e.vx = e.facing * e.speed;
    applyGravity(e, dt);
    integrateEntity(e, dt, platformColliders(state.level));
    if (e.grounded && Math.random() < 0.01) {
      // Occasional small hop so the slime feels alive.
      e.vy = -260;
    }
  }
}

function enemyContactPlayer() {
  const p = state.player;
  if (!p || p.invuln > 0) return;
  for (const e of state.enemies) {
    if (rectsOverlap(bodyRect(p), bodyRect(e))) {
      damagePlayer(e.contactDamage, e.x + e.w / 2);
      return;
    }
  }
}
