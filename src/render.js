// AGF Mobile Prototype 01 — entity-level rendering
// Forked from AGF side-scroll seed. Change vs seed:
//   * `drawEntityAnimation` is the same as the seed, but it now consults
//     `entity.procedural` FIRST and uses Canvas2D primitives instead of
//     drawImage when a procedural descriptor is present. This is what
//     makes the prototype runnable with zero PNG assets.
//   * We drop boss / dialogue panel drawing — out of scope for v1.

function drawEntityAnimation(ctx, entity, animName, facing, fallbackColor) {
  const anim = entity.animations?.[animName] || entity.animations?.idle;
  const image = anim?.image || resolvedImage(anim?.sprite);
  const meta = anim?.meta || DEFAULT_ANIM;

  // Procedural path wins: draw with shapes, never call drawImage.
  if (entity.procedural) {
    drawProceduralEntity(ctx, entity, facing);
    return;
  }

  // Seed-equivalent: sprite path.
  const drawSize = entity.drawSize || meta.cellSize || (entity.kind === "boss" ? 170 : 128);
  const drawX = entity.x + entity.w / 2 - drawSize / 2;
  const drawY = entity.y + entity.h - drawSize;
  const sx = worldToScreenX(drawX);
  const sy = worldToScreenY(drawY);
  if (!image) {
    ctx.fillStyle = fallbackColor || COLORS.player;
    ctx.fillRect(worldToScreenX(entity.x), worldToScreenY(entity.y), entity.w, entity.h);
    return;
  }
  const frame = Math.floor(state.time * meta.fps) % Math.max(1, meta.frames);
  const col = frame % meta.cols;
  const row = Math.floor(frame / meta.cols);
  ctx.save();
  if (facing < 0) {
    ctx.translate(worldToScreenX(drawX + drawSize), sy);
    ctx.scale(-1, 1);
    ctx.drawImage(image, col * meta.frameW, row * meta.frameH, meta.frameW, meta.frameH, 0, 0, drawSize, drawSize);
  } else {
    ctx.drawImage(image, col * meta.frameW, row * meta.frameH, meta.frameW, meta.frameH, sx, sy, drawSize, drawSize);
  }
  ctx.restore();
}

function drawProceduralEntity(ctx, entity, facing) {
  const proc = entity.procedural;
  const x = worldToScreenX(entity.x);
  const y = worldToScreenY(entity.y);
  const w = entity.w;
  const h = entity.h;

  ctx.save();
  // Always flip procedural shapes on the X axis when facing left, so
  // eyes / details point the right way.
  if (facing < 0) {
    ctx.translate(x + w, y);
    ctx.scale(-1, 1);
    ctx.translate(-x, -y);
  }

  switch (proc.shape) {
    case "capsule":
      drawCapsule(ctx, x, y, w, h, proc.body, proc.outline, proc.eye);
      break;
    case "slime":
      drawSlime(ctx, x, y, w, h, proc.body, proc.outline, proc.eye);
      break;
    case "coin":
      drawCoin(ctx, x, y, w, h, proc.body, proc.edge);
      break;
    case "spike":
      drawSpike(ctx, x, y, w, h, proc.body, proc.edge);
      break;
    default:
      ctx.fillStyle = proc.body || "#888";
      ctx.fillRect(x, y, w, h);
  }
  ctx.restore();
}

function drawCapsule(ctx, x, y, w, h, body, outline, eye) {
  // Body
  ctx.fillStyle = body || COLORS.player;
  roundRect(ctx, x, y, w, h, Math.min(w, h) / 2);
  ctx.fill();
  // Outline
  ctx.lineWidth = 2;
  ctx.strokeStyle = outline || COLORS.playerOutline;
  ctx.stroke();
  // Eye(s)
  const eyeY = y + h * 0.35;
  const eyeR = Math.max(2, Math.round(h * 0.07));
  ctx.fillStyle = eye || "#ffffff";
  ctx.beginPath();
  ctx.arc(x + w * 0.62, eyeY, eyeR, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + w * 0.82, eyeY, eyeR, 0, Math.PI * 2);
  ctx.fill();
  // Pupil
  ctx.fillStyle = outline || COLORS.playerOutline;
  ctx.beginPath();
  ctx.arc(x + w * 0.66, eyeY + 1, eyeR * 0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + w * 0.86, eyeY + 1, eyeR * 0.45, 0, Math.PI * 2);
  ctx.fill();
}

function drawSlime(ctx, x, y, w, h, body, outline, eye) {
  // Wobbly bottom — uses a flat top + semicircle bottom for a slime look.
  const radius = w / 2;
  ctx.fillStyle = body || COLORS.enemy;
  ctx.beginPath();
  ctx.moveTo(x, y + h * 0.3);
  ctx.lineTo(x, y + h - radius);
  ctx.arc(x + radius, y + h - radius, radius, Math.PI, 0, false);
  ctx.lineTo(x + w, y + h * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = outline || COLORS.enemyOutline;
  ctx.stroke();
  // Eye
  const eyeR = Math.max(2, Math.round(h * 0.07));
  ctx.fillStyle = eye || "#ffffff";
  ctx.beginPath();
  ctx.arc(x + w * 0.38, y + h * 0.45, eyeR, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + w * 0.62, y + h * 0.45, eyeR, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = outline || COLORS.enemyOutline;
  ctx.beginPath();
  ctx.arc(x + w * 0.42, y + h * 0.45 + 1, eyeR * 0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + w * 0.66, y + h * 0.45 + 1, eyeR * 0.45, 0, Math.PI * 2);
  ctx.fill();
}

function drawCoin(ctx, x, y, w, h, body, edge) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const r = Math.min(w, h) / 2;
  // Edge ring
  ctx.fillStyle = edge || COLORS.coinEdge;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  // Body
  ctx.fillStyle = body || COLORS.coin;
  ctx.beginPath();
  ctx.arc(cx, cy, r - Math.max(2, r * 0.15), 0, Math.PI * 2);
  ctx.fill();
  // Inner mark
  ctx.fillStyle = edge || COLORS.coinEdge;
  ctx.font = "bold " + Math.round(r * 1.1) + "px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("+", cx, cy + 1);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

function drawSpike(ctx, x, y, w, h, body, edge) {
  ctx.fillStyle = body || COLORS.spike;
  ctx.beginPath();
  const spikes = Math.max(3, Math.floor(w / 10));
  const step = w / spikes;
  ctx.moveTo(x, y + h);
  for (let i = 0; i < spikes; i++) {
    const tipX = x + step * i + step / 2;
    ctx.lineTo(tipX, y);
    ctx.lineTo(x + step * (i + 1), y + h);
  }
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = edge || COLORS.spikeEdge;
  ctx.stroke();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawSpriteAspectFit(ctx, img, x, y, w, h) {
  // For non-square sprites in sprite-mode (kept for forward compatibility).
  const ratio = img.width / img.height;
  let dw = w;
  let dh = h;
  if (ratio > 1) dh = w / ratio;
  else dw = h * ratio;
  ctx.drawImage(img, x, y, dw, dh);
}
