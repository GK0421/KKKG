// 客栈夜雨 — 主循环
// AGF seed game.js 改造: 没有物理/平台, 主循环只是 typography + script + render

let lastFrame = 0;

async function boot() {
  initDom();
  initInput();
  try {
    state.scriptData = await loadJSON("data/script.json");
    state.scenesConfig = await loadJSON("data/scenes.json");
    state.characters = (await loadJSON("data/characters.json")).characters;
    state.memoryOverlay = (await loadJSON("data/scenes.json")).memory_overlay;
    state.memoriesSeen = new Set();
    state.camera = { x: 0, y: 0 };
    returnToTitle();
  } catch (err) {
    showBootError(err);
    return;
  }
  requestAnimationFrame(frame);
}

function frame(nowMs) {
  const now = nowMs / 1000;
  const dt = Math.min(0.05, lastFrame ? now - lastFrame : 0);
  lastFrame = now;
  state.time += dt;
  updateInput();
  handleInput();
  updateTypography(dt);
  updateMemory(dt);
  updateRain(dt);
  renderFrame();
  requestAnimationFrame(frame);
}

function handleInput() {
  // Space 推进
  if (wasPressed("advance")) {
    if (script.mode === "title") {
      loadScene(SCRIPT.startScene);
      return;
    }
    playerAdvance();
  }
  // 触屏点击
  const tap = consumeTap();
  if (tap) {
    if (script.mode === "title") {
      loadScene(SCRIPT.startScene);
      return;
    }
    if (script.mode === "branch") {
      const nextId = updateChoicesClick(tap.x, tap.y);
      if (nextId) loadScene(nextId);
      return;
    }
    // 普通推进
    playerAdvance();
  }
  // 选择键 1/2/3
  if (script.mode === "branch") {
    for (let i = 0; i < 3; i++) {
      if (wasPressed("choice" + (i + 1))) {
        playerPickChoice(i);
        break;
      }
    }
  }
}

function renderFrame() {
  const ctx = dom.ctx;
  ctx.clearRect(0, 0, VIEW.w, VIEW.h);
  if (state.currentSceneCfg) {
    drawBackground(ctx, state.currentSceneCfg);
    drawRain(ctx, state.currentSceneCfg);
    drawPaperGrain(ctx, state.currentSceneCfg);
  } else {
    ctx.fillStyle = COLORS.bgTop;
    ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  }
  if (isMemoryActive()) {
    drawMemory(ctx);
  } else {
    drawTextArea(ctx);
    drawChoicePanel(ctx);
  }
  drawHud(ctx);
}

function showBootError(err) {
  if (!dom.ctx) return;
  dom.ctx.fillStyle = COLORS.bgTop;
  dom.ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  dom.ctx.fillStyle = COLORS.text;
  dom.ctx.font = "16px " + FONT.family;
  dom.ctx.textBaseline = "top";
  dom.ctx.fillText("Boot failed: " + (err && err.message ? err.message : err), 24, 80);
  dom.ctx.fillText("See PROJECT_BRIEF.md §3 for file layout.", 24, 110);
}

boot().catch(showBootError);
