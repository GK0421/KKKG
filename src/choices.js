// 客栈夜雨 — 选择点系统
// 显示选项,处理点击/键盘,跳转下一 scene

const choices = {
  active: null,        // 当前活跃的 branch_point 对象
  hoverIndex: -1,      // 鼠标悬停的选项 (0-based)
  layoutRects: []      // 每个选项的 rect,用于点击判定
};

function startChoice(branchPoint) {
  choices.active = branchPoint;
  choices.hoverIndex = -1;
  choices.layoutRects = [];
}

function clearChoice() {
  choices.active = null;
  choices.hoverIndex = -1;
  choices.layoutRects = [];
}

function pickOption(index) {
  if (!choices.active) return null;
  const opt = choices.active.options[index];
  if (!opt) return null;
  const nextSceneId = opt.next;
  clearChoice();
  return nextSceneId;
}

function updateChoicesPointer(clientX, clientY) {
  if (!choices.active) {
    choices.hoverIndex = -1;
    return;
  }
  let found = -1;
  for (let i = 0; i < choices.layoutRects.length; i++) {
    const r = choices.layoutRects[i];
    if (clientX >= r.x && clientX <= r.x + r.w && clientY >= r.y && clientY <= r.y + r.h) {
      found = i;
      break;
    }
  }
  choices.hoverIndex = found;
}

function updateChoicesClick(clientX, clientY) {
  if (!choices.active) return null;
  for (let i = 0; i < choices.layoutRects.length; i++) {
    const r = choices.layoutRects[i];
    if (clientX >= r.x && clientX <= r.x + r.w && clientY >= r.y && clientY <= r.y + r.h) {
      return pickOption(i);
    }
  }
  return null;
}

function drawChoicePanel(ctx) {
  if (!choices.active) return;
  const bp = choices.active;
  const pad = 24;
  const w = VIEW.w - pad * 2;
  const lineH = 28;
  const questionLines = wrapTextForCanvas(ctx, bp.question, w - 32);
  const qLines = countLines(questionLines);
  const optGap = 16;
  const optH = lineH * 1.4;
  const innerH = qLines * lineH + 24 + bp.options.length * (optH + optGap) - optGap + 32;
  const panelX = pad;
  const panelY = VIEW.h - innerH - 80;
  const panelH = innerH;

  // 背景
  ctx.save();
  ctx.fillStyle = "rgba(8, 6, 4, 0.78)";
  ctx.fillRect(panelX, panelY, w, panelH);
  ctx.strokeStyle = COLORS.choiceEdge;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(panelX + 0.5, panelY + 0.5, w, panelH);

  // 问题
  ctx.fillStyle = COLORS.name;
  ctx.font = `bold ${18}px ${FONT.family}`;
  ctx.textBaseline = "top";
  drawWrappedText(ctx, bp.question, panelX + 16, panelY + 16, w - 32, lineH);

  // 选项
  const optStartY = panelY + 16 + qLines * lineH + 24;
  choices.layoutRects = [];
  for (let i = 0; i < bp.options.length; i++) {
    const opt = bp.options[i];
    const oy = optStartY + i * (optH + optGap);
    const hover = i === choices.hoverIndex;
    ctx.fillStyle = hover ? COLORS.choiceBgHover : COLORS.choiceBg;
    ctx.fillRect(panelX + 12, oy, w - 24, optH);
    ctx.strokeStyle = hover ? COLORS.choiceEdgeHover : COLORS.choiceEdge;
    ctx.lineWidth = hover ? 2 : 1;
    ctx.strokeRect(panelX + 12.5, oy + 0.5, w - 24, optH);

    ctx.fillStyle = COLORS.text;
    ctx.font = `${20}px ${FONT.family}`;
    ctx.textBaseline = "middle";
    ctx.fillText(opt.label, panelX + 24, oy + optH / 2);
    choices.layoutRects.push({ x: panelX + 12, y: oy, w: w - 24, h: optH });
  }
  ctx.restore();
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
  const wrapped = wrapTextForCanvas(ctx, text, maxWidth);
  const lines = wrapped.split("\n");
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], x, y + i * lineHeight);
  }
}
