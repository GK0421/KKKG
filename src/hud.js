// AGF Mobile Prototype 01 — HUD (mobile-portrait layout)
// Forked from AGF side-scroll seed. Change vs seed:
//   * The seed positions HP/score panels in the top-left of a 1280x720
//     canvas with absolute pixel coordinates. We re-derive the layout
//     from VIEW.w / VIEW.h so it stays correct on the 540x960 portrait.

function drawHud(ctx) {
  if (!state.player) return;
  const p = state.player;
  const hud = cfg("hud");
  ctx.save();

  // Top status bar — full width minus padding.
  const barW = VIEW.w - 32;
  const barX = 16;
  const barY = 16;
  const barH = 60;
  ctx.fillStyle = COLORS.panel;
  ctx.fillRect(barX, barY, barW, barH);
  ctx.strokeStyle = COLORS.panelEdge;
  ctx.strokeRect(barX + 0.5, barY + 0.5, barW, barH);

  // HP bar (top row)
  const hpBarW = barW - 24;
  const hpBarX = barX + 12;
  const hpBarY = barY + 12;
  const hpBarH = 14;
  ctx.fillStyle = COLORS.hpBack;
  ctx.fillRect(hpBarX, hpBarY, hpBarW, hpBarH);
  ctx.fillStyle = COLORS.hp;
  ctx.fillRect(hpBarX, hpBarY, hpBarW * (p.hp / p.maxHp), hpBarH);
  ctx.strokeStyle = COLORS.text;
  ctx.strokeRect(hpBarX + 0.5, hpBarY + 0.5, hpBarW, hpBarH);

  // HP / Score / Lives row
  ctx.fillStyle = COLORS.text;
  ctx.font = "16px monospace";
  ctx.fillText("HP", hpBarX, hpBarY + 28);
  ctx.fillStyle = COLORS.gold;
  ctx.fillText("Score " + (state.score || 0), hpBarX + 60, hpBarY + 28);
  ctx.fillText("Lives " + p.lives, hpBarX + 220, hpBarY + 28);

  // Bottom touch hint, only while in playing mode
  if (state.mode === "playing") {
    drawTouchHint(ctx);
  }

  if (state.mode === "paused") drawCenteredPanel(ctx, "PAUSED", "Press P or Esc to resume");
  if (state.mode === "gameover") drawCenteredPanel(ctx, "GAME OVER", "Tap or press Enter to restart");
  if (state.mode === "title") drawCenteredPanel(ctx, GAME.title, "Tap right side or press Enter to start");
  drawMessage(ctx);
  ctx.restore();
}

function drawTouchHint(ctx) {
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = COLORS.muted;
  ctx.font = "12px monospace";
  ctx.textAlign = "center";
  ctx.fillText("← drag left half to move · tap right half to jump →", VIEW.w / 2, VIEW.h - 16);
  ctx.textAlign = "left";
  ctx.restore();
}

function drawMessage(ctx) {
  if (!state.message) return;
  const pad = 16;
  const w = VIEW.w - 32;
  const h = 60;
  const x = pad;
  const y = VIEW.h - h - 80;
  ctx.fillStyle = COLORS.panel;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = COLORS.panelEdge;
  ctx.strokeRect(x + 0.5, y + 0.5, w, h);
  ctx.fillStyle = COLORS.text;
  ctx.font = "16px monospace";
  wrapText(ctx, state.message.text, x + 16, y + 28, w - 32, 22);
}

function drawCenteredPanel(ctx, title, subtitle) {
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  const pw = VIEW.w - 80;
  const ph = 200;
  const px = (VIEW.w - pw) / 2;
  const py = (VIEW.h - ph) / 2;
  ctx.fillStyle = COLORS.panel;
  ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = COLORS.panelEdge;
  ctx.strokeRect(px + 0.5, py + 0.5, pw, ph);
  ctx.fillStyle = COLORS.gold;
  ctx.font = "bold 28px monospace";
  ctx.textAlign = "center";
  ctx.fillText(title, VIEW.w / 2, py + 80);
  ctx.fillStyle = COLORS.text;
  ctx.font = "16px monospace";
  ctx.fillText(subtitle, VIEW.w / 2, py + 130);
  ctx.textAlign = "left";
  ctx.restore();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text).split(" ");
  let line = "";
  for (const word of words) {
    const test = line ? line + " " + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = word;
      y += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, y);
}
