// AGF Mobile Prototype 01 — parallax background
// Forked from AGF side-scroll seed. Change vs seed:
//   * When a layer is `procedural: true`, we draw a vertical gradient via
//     Canvas2D instead of waiting on a PNG. The seed's drawImage path is
//     kept intact for layers that have a real image path.

function drawParallax(ctx, level) {
  const layers = (level.layers || []).slice().sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
  for (const layer of layers) {
    const scroll = layer.parallax ?? 1;
    ctx.save();
    ctx.globalAlpha = layer.opacity ?? 1;

    if (layer.procedural) {
      drawProceduralLayer(ctx, layer, scroll);
      ctx.restore();
      continue;
    }

    const img = assetCache.images.get(layer.image);
    if (!img || img instanceof Promise) {
      // No image — fall back to solid color so the screen isn't black.
      ctx.fillStyle = layer.fallback || COLORS.bgBottom;
      ctx.fillRect(0, 0, VIEW.w, VIEW.h);
      ctx.restore();
      continue;
    }
    if (layer.repeatX) {
      const offset = -((state.camera.x * scroll) % img.width);
      for (let x = offset - img.width; x < VIEW.w + img.width; x += img.width) {
        ctx.drawImage(img, Math.round(x), 0, img.width, VIEW.h);
      }
    } else {
      ctx.drawImage(img, worldToScreenX(0, scroll), worldToScreenY(0, scroll), level.mapSize.width, level.mapSize.height);
    }
    ctx.restore();
  }
}

function drawProceduralLayer(ctx, layer, scroll) {
  const kind = layer.procedural;
  const offsetX = -((state.camera.x * scroll) % VIEW.w);
  if (kind === "gradient") {
    // Vertical gradient anchored to the world (so scrolling doesn't
    // shift the sky).
    const grad = ctx.createLinearGradient(0, 0, 0, VIEW.h);
    const top = layer.colorTop || COLORS.bgTop;
    const bottom = layer.colorBottom || COLORS.bgBottom;
    grad.addColorStop(0, top);
    grad.addColorStop(1, bottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, VIEW.w, VIEW.h);
    // Decorative stars or stripes if requested.
    if (layer.stripeColor) {
      ctx.fillStyle = layer.stripeColor;
      const yTop = Math.round(VIEW.h * 0.18);
      ctx.fillRect(0, yTop, VIEW.w, 2);
    }
  } else if (kind === "stripes") {
    ctx.fillStyle = layer.color || "#1a2a3a";
    const stripeH = layer.stripeH || 24;
    const offsetY = -((state.camera.y * scroll) % (stripeH * 2));
    for (let y = offsetY - stripeH; y < VIEW.h + stripeH; y += stripeH * 2) {
      ctx.fillRect(0, y, VIEW.w, stripeH);
    }
  } else {
    ctx.fillStyle = layer.fallback || COLORS.bgBottom;
    ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  }
  // Reference offsetX so future star fields can scroll horizontally.
  void offsetX;
}
