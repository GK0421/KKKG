// 客栈夜雨 — HUD
// 顶部: 场景名 + 进度点; 底部: 推进提示 (闪烁)

function drawHud(ctx) {
  if (script.mode === "title") {
    drawTitleScreen(ctx);
    return;
  }
  // 顶部: 场景名
  const sceneCfg = state.currentSceneCfg;
  const title = (script.current && script.current.title) || (script.currentEnding && script.currentEnding.title) || "";
  if (title) {
    ctx.save();
    ctx.fillStyle = "rgba(8, 6, 4, 0.55)";
    ctx.fillRect(0, 0, VIEW.w, 56);
    ctx.fillStyle = COLORS.name;
    ctx.font = `bold 18px ${FONT.family}`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText(title, 24, 28);
    // 进度点 (在右侧)
    const totalScenes = state.scriptData.scenes.length;
    const currentIdx = state.scriptData.scenes.findIndex((s) => s.id === (script.current && script.current.id));
    const dotsTotal = totalScenes;
    const dotsW = dotsTotal * 8;
    const dotsStartX = VIEW.w - 24 - dotsW;
    for (let i = 0; i < dotsTotal; i++) {
      ctx.fillStyle = i === currentIdx ? COLORS.name : COLORS.textFaint;
      ctx.beginPath();
      ctx.arc(dotsStartX + i * 8 + 4, 28, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 底部: 推进提示 (仅在非 pause / 非回忆 / 非选择 时闪烁)
  if (
    script.mode !== "branch" &&
    !isMemoryActive() &&
    !isInPause() &&
    isWaitingForAdvance() &&
    typography.promptVisible
  ) {
    ctx.save();
    ctx.fillStyle = "rgba(8, 6, 4, 0.45)";
    ctx.fillRect(0, VIEW.h - 50, VIEW.w, 50);
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = `14px ${FONT.familyMono}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("按 Space 继续", VIEW.w / 2, VIEW.h - 25);
    ctx.restore();
  }
}

function drawTitleScreen(ctx) {
  const sceneCfg = state.currentSceneCfg || state.scenesConfig.scenes.scene_01;
  // 大字标题居中
  ctx.save();
  ctx.fillStyle = COLORS.name;
  ctx.font = `bold 56px ${FONT.family}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(SCRIPT.title, VIEW.w / 2, VIEW.h * 0.42);
  ctx.fillStyle = COLORS.textMuted;
  ctx.font = `italic 20px ${FONT.family}`;
  ctx.fillText(SCRIPT.subtitle, VIEW.w / 2, VIEW.h * 0.42 + 48);
  // 闪烁提示
  if (typography.promptVisible) {
    ctx.fillStyle = COLORS.text;
    ctx.font = `18px ${FONT.family}`;
    ctx.fillText("按 Space 开始", VIEW.w / 2, VIEW.h * 0.62);
  }
  // 底部
  ctx.fillStyle = COLORS.textFaint;
  ctx.font = `12px ${FONT.familyMono}`;
  ctx.fillText("古龙式 · 留白 · 独白", VIEW.w / 2, VIEW.h * 0.78);
  ctx.restore();
}
