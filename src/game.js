// AGF Mobile Prototype 01 — boot / main loop
// Forked from AGF side-scroll seed. Behavior parity on title/playing/
// gameover/win/paused; we add a touch-driven startNewRun (tap right
// half on title/gameover counts as "start").

let lastFrame = 0;
let bootTries = 0;

async function boot() {
  initDom();
  initInput();
  try {
    await loadConfigs();
    await loadCatalogs();
    await loadGameData();
    await switchScene(GAME.startScene, { newPlayer: true, keepMode: true });
    state.mode = GAME.startMode;
  } catch (err) {
    bootTries += 1;
    if (bootTries < 3) {
      // Retry once if the very first load races with file:// CORS or a
      // cold start. A real failure surfaces to the boot overlay below.
      setTimeout(boot, 200);
      return;
    }
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
  state.titleBlink += dt;
  updateInput();
  handleGlobalInput();
  updateScene(dt);
  updateDialogue(dt);
  updateParticles(dt);
  tickMusic(dt);
  renderFrame();
  requestAnimationFrame(frame);
}

function handleGlobalInput() {
  // Touch tap on title/gameover counts as "start"
  if ((state.mode === "title" || state.mode === "gameover") && (wasPressed("start") || touchTapConsume())) {
    startNewRun();
    return;
  }
  if (state.mode === "playing" && wasPressed("pause")) {
    state.mode = "paused";
  } else if (state.mode === "paused" && wasPressed("pause")) {
    state.mode = "playing";
  }
  if (state.message && wasPressed("interact")) state.message = null;
}

// Detects a single quick tap on the right half of the canvas during
// title/gameover. We piggy-back on the existing touch state to avoid
// adding a second event listener.
function touchTapConsume() {
  if (!input.touch) return false;
  const t = input.touch;
  if (!t.tapQueued) return false;
  t.tapQueued = false;
  return true;
}

function showBootError(err) {
  state.error = err;
  if (!dom.ctx) return;
  dom.ctx.fillStyle = COLORS.bgTop;
  dom.ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  dom.ctx.fillStyle = COLORS.text;
  dom.ctx.font = "16px monospace";
  dom.ctx.fillText("Boot failed: " + (err && err.message ? err.message : err), 24, 80);
  dom.ctx.fillText("See PROJECT_BRIEF.md §12 for escalation policy.", 24, 110);
}

boot().catch((err) => {
  showBootError(err);
});
