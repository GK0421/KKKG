// 客栈夜雨 — 场景背景渲染器
// 职责: 渐变背景 + 油灯 glow + 雨丝 + 旧纸 grain (回忆用)

const rainState = {
  drops: [] // {x, y, vy, alpha, len}
};

function initRain(density) {
  rainState.drops = [];
  const targetCount = Math.floor(40 * density);
  for (let i = 0; i < targetCount; i++) {
    rainState.drops.push(spawnRainDrop(true));
  }
}

function spawnRainDrop(initial) {
  return {
    x: Math.random() * VIEW.w + state.camera.x * 0.3,
    y: initial ? Math.random() * VIEW.h : -10,
    vy: 360 + Math.random() * 120,
    alpha: 0.25 + Math.random() * 0.5,
    len: 6 + Math.random() * 10
  };
}

function updateRain(dt) {
  const camDx = state.camera.x * 0.3;
  for (const d of rainState.drops) {
    d.x = d.x - camDx * dt * 0.1; // 极轻的视差
    d.y += d.vy * dt;
    if (d.y > VIEW.h + 20) {
      d.y = -10;
      d.x = Math.random() * VIEW.w;
    }
  }
}

function drawBackground(ctx, sceneConfig) {
  // 1. 渐变
  const grad = ctx.createLinearGradient(0, 0, 0, VIEW.h);
  grad.addColorStop(0, sceneConfig.bg.colorTop);
  grad.addColorStop(1, sceneConfig.bg.colorBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);

  // 2. 油灯 glow (场景中心略偏下, 表示客栈内灯)
  if (sceneConfig.lampGlow && sceneConfig.lampGlow.enabled) {
    const cx = VIEW.w * 0.5;
    const cy = VIEW.h * 0.62;
    const r = sceneConfig.lampGlow.radius;
    const radial = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    radial.addColorStop(0, hexWithAlpha(sceneConfig.lampGlow.color, 0.28));
    radial.addColorStop(0.4, hexWithAlpha(sceneConfig.lampGlow.color, 0.12));
    radial.addColorStop(1, hexWithAlpha(sceneConfig.lampGlow.color, 0.0));
    ctx.save();
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, VIEW.w, VIEW.h);
    ctx.restore();
  }
}

function drawRain(ctx, sceneConfig) {
  if (!sceneConfig.rain || !sceneConfig.rain.enabled) return;
  const rainCfg = sceneConfig.rain;
  ctx.save();
  ctx.strokeStyle = hexWithAlpha(rainCfg.color, rainCfg.alpha);
  ctx.lineWidth = 1.2;
  ctx.lineCap = "round";
  for (const d of rainState.drops) {
    const sx = ((d.x % VIEW.w) + VIEW.w) % VIEW.w;
    ctx.globalAlpha = d.alpha;
    ctx.beginPath();
    ctx.moveTo(sx, d.y);
    ctx.lineTo(sx - 1.5, d.y + d.len);
    ctx.stroke();
  }
  ctx.globalAlpha = 1.0;
  ctx.restore();
}

function drawPaperGrain(ctx, sceneConfig) {
  if (!sceneConfig.paperGrain || !sceneConfig.paperGrain.enabled) return;
  // 用稀疏随机点模拟旧纸纹理 (静态,每帧重画但不重新计算)
  ctx.save();
  ctx.fillStyle = hexWithAlpha(sceneConfig.paperGrain.color, sceneConfig.paperGrain.alpha);
  // 用伪随机种子 (state.time 整数部分) 让纹理稳定
  const seed = Math.floor(state.time * 0.5);
  const rng = mulberry32(seed);
  for (let i = 0; i < 200; i++) {
    const x = rng() * VIEW.w;
    const y = rng() * VIEW.h;
    const r = rng() * 1.5;
    ctx.fillRect(x, y, r, r);
  }
  ctx.restore();
}

// Mulberry32: 稳定伪随机, 避免每帧都重新洗牌
function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function hexWithAlpha(hex, alpha) {
  // hex 形如 #rrggbb
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
