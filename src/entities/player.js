// AGF Mobile Prototype 01 — player entity
// Forked from AGF side-scroll seed. Change vs seed:
//   * The seed expects multi-action sprite atlases; v1 only uses one
//     (idle) since all art is procedural.
//   * We disable double-jump and attack (combat_style = minimal).
//   * We honor input.actions.jump only on the rising edge so a held key
//     doesn't keep re-triggering jumps.
//   * Damage is applied via `takeDamage(amount, sourceX)` so knockback
//     has a direction.

function spawnPlayer(spawn) {
  const cfg = config.player;
  const p = {
    id: "player",
    kind: "player",
    x: spawn.x,
    y: spawn.y,
    vx: 0,
    vy: 0,
    w: cfg.size.w,
    h: cfg.size.h,
    bodyInsetX: cfg.bodyInsetX,
    bodyInsetY: cfg.bodyInsetY,
    maxHp: cfg.stats.maxHp,
    hp: cfg.stats.maxHp,
    lives: cfg.stats.lives,
    invuln: 0,
    facing: 1,
    grounded: false,
    jumpsLeft: cfg.movement.maxJumps,
    maxJumps: cfg.movement.maxJumps,
    anim: "idle",
    animations: {
      idle: { sprite: "procedural://player/idle", meta: { ...DEFAULT_ANIM }, image: null }
    },
    procedural: {
      shape: "capsule",
      body: COLORS.player,
      outline: COLORS.playerOutline,
      eye: "#ffffff"
    }
  };
  return p;
}

function updatePlayer(dt) {
  const p = state.player;
  if (!p) return;
  const cfg = config.player;
  const physics = config.physics;

  // Movement
  const moveAxis = input.actions.x;
  if (moveAxis !== 0) p.facing = moveAxis > 0 ? 1 : -1;
  const targetVx = moveAxis * cfg.movement.maxSpeed;
  const accel = p.grounded ? cfg.movement.accel : cfg.movement.airAccel;
  if (targetVx === 0) {
    p.vx = approachZero(p.vx, cfg.movement.friction * dt * 60);
  } else if (Math.sign(targetVx) === Math.sign(p.vx)) {
    p.vx = approachValue(p.vx, targetVx, accel * dt * 60);
  } else {
    p.vx = approachValue(p.vx, targetVx, (accel * 1.5) * dt * 60);
  }

  // Jump (single-jump in v1, double-jump disabled)
  if (wasPressed("jump") && (p.grounded || p.jumpsLeft > 0)) {
    p.vy = cfg.movement.jumpVelocity;
    p.grounded = false;
    p.jumpsLeft = Math.max(0, p.jumpsLeft - 1);
  }
  if (p.grounded) p.jumpsLeft = p.maxJumps;

  // Apply gravity + integrate
  applyGravity(p, dt);
  integrateEntity(p, dt, platformColliders(state.level));

  // Damage colliders (hazards / kill zones)
  for (const col of damageColliders(state.level)) {
    if (rectsOverlap(bodyRect(p), col)) {
      // Don't die from a kill zone if it would also be a one-shot
      // spike on the same frame — handled in updateHazards instead.
      if (col.type === "kill") {
        // kill zones kill instantly
        killPlayer();
      } else if (p.invuln <= 0) {
        damagePlayer(col.damage ?? 1, col.x + col.w / 2);
      }
    }
  }

  // Tick invulnerability
  if (p.invuln > 0) p.invuln = Math.max(0, p.invuln - dt);

  // Off the bottom of the world
  if (p.y > state.level.mapSize.height + 200) {
    killPlayer();
  }

  // Animation state
  p.anim = p.grounded ? (Math.abs(p.vx) > 5 ? "walk" : "idle") : "jump";
}

function approachValue(value, target, step) {
  if (value < target) return Math.min(target, value + step);
  if (value > target) return Math.max(target, value - step);
  return value;
}

function approachZero(value, step) {
  if (Math.abs(value) <= step) return 0;
  return value > 0 ? value - step : value + step;
}

function damagePlayer(amount, sourceX) {
  const p = state.player;
  if (!p || p.invuln > 0) return;
  p.hp -= amount;
  p.invuln = config.player.stats.invulnSec;
  // Knockback away from source
  const dir = p.x + p.w / 2 < sourceX ? -1 : 1;
  p.vx = dir * 220;
  p.vy = Math.min(p.vy, -180);
  screenshake(6, 0.18);
  spawnParticlesAt(p.x + p.w / 2, p.y + p.h / 2, "#ff6060", 14);
  if (p.hp <= 0) loseLife();
}

function killPlayer() {
  const p = state.player;
  if (!p) return;
  p.hp = 0;
  loseLife();
}

function loseLife() {
  const p = state.player;
  if (!p) return;
  p.lives -= 1;
  if (p.lives <= 0) {
    state.mode = "gameover";
    screenshake(10, 0.4);
    return;
  }
  // Respawn at level spawn with full HP and brief invuln
  const spawn = state.level.spawn || { x: 60, y: 200 };
  p.x = spawn.x;
  p.y = spawn.y;
  p.vx = 0;
  p.vy = 0;
  p.hp = p.maxHp;
  p.invuln = 1.5;
  spawnParticlesAt(p.x + p.w / 2, p.y + p.h / 2, "#ffe080", 18);
}
