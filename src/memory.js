// 客栈夜雨 — 回忆碎片系统
// 在指定 trigger 处弹出回忆 (旧纸滤镜 + 斜体独白 + 渐入渐出)

const memory = {
  // 当前正在播放的回忆 (id 引用 script.json#memories[].id)
  active: null,
  // 0 = 未开始, 1 = 渐入中, 2 = 持续中, 3 = 渐出中, -1 = 完成
  phase: 0,
  phaseT: 0,
  alpha: 0
};

function triggerMemory(memoryId, memoryContent) {
  // 同一回忆只触发一次 (在当前游戏中)
  if (state.memoriesSeen.has(memoryId)) return false;
  state.memoriesSeen.add(memoryId);
  memory.active = { id: memoryId, content: memoryContent };
  memory.phase = 1;
  memory.phaseT = 0;
  memory.alpha = 0;
  return true;
}

function updateMemory(dt) {
  if (memory.phase <= 0 || memory.phase > 3) return;
  memory.phaseT += dt * 1000;
  if (memory.phase === 1) {
    memory.alpha = Math.min(1, memory.phaseT / ANIM_TIMING.memoryFadeInMs);
    if (memory.alpha >= 1) { memory.phase = 2; memory.phaseT = 0; }
  } else if (memory.phase === 2) {
    memory.alpha = 1;
    if (memory.phaseT >= ANIM_TIMING.memoryHoldMs) { memory.phase = 3; memory.phaseT = 0; }
  } else if (memory.phase === 3) {
    memory.alpha = Math.max(0, 1 - memory.phaseT / ANIM_TIMING.memoryFadeOutMs);
    if (memory.alpha <= 0) {
      memory.phase = -1;
      memory.active = null;
    }
  }
}

function isMemoryActive() {
  return memory.phase > 0 && memory.phase <= 3 && memory.active;
}

function drawMemory(ctx) {
  if (!isMemoryActive()) return;
  const m = memory.active;
  const overlay = state.memoryOverlay;
  // 旧纸背景
  ctx.save();
  ctx.globalAlpha = memory.alpha;
  drawBackground(ctx, overlay);
  drawPaperGrain(ctx, overlay);
  // 标题
  ctx.fillStyle = COLORS.name;
  ctx.font = `bold 22px ${FONT.family}`;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillText(m.content.title || "回忆", 32, 80);
  // 分隔线
  ctx.strokeStyle = COLORS.name;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(32, 120);
  ctx.lineTo(VIEW.w - 32, 120);
  ctx.stroke();
  // 内容 (斜体独白, 全部显示, 不逐字)
  ctx.font = `italic 18px ${FONT.family}`;
  ctx.fillStyle = COLORS.textMuted;
  let y = 144;
  const maxW = VIEW.w - 64;
  const lineH = 30;
  for (const line of m.content.lines) {
    if (line.type !== "inner" && line.type !== "narration") continue;
    const wrapped = wrapTextForCanvas(ctx, line.text || "", maxW);
    const linesArr = wrapped.split("\n");
    for (const sub of linesArr) {
      if (y > VIEW.h - 80) break;
      ctx.fillText(sub, 32, y);
      y += lineH;
    }
    y += 6;
  }
  ctx.restore();
}
