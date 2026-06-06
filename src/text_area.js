// 客栈夜雨 — 文字主区渲染
// 简化版: 不堆叠,只显示"当前 active 行"和"最近 N 行已完成行"
// 排版: 文字从文字区顶部往下铺,最新行在最底

const TEXT_AREA = Object.freeze({
  x: 24,
  y: VIEW.h * 0.62,        // 596
  w: VIEW.w - 48,            // 492
  h: VIEW.h * 0.32,          // 307
  padding: 16,
  // 行高
  lineH: 32,
  // 名字 (speaker) 高度
  nameH: 22,
  // 最多显示已完成的行数
  maxCompletedLines: 6
});

function getLineStyle(line, character) {
  if (line.type === "narration") {
    return {
      font: `18px ${FONT.family}`,
      color: COLORS.textMuted,
      italic: false,
      showName: false
    };
  }
  if (line.type === "inner") {
    return {
      font: `italic 18px ${FONT.family}`,
      color: COLORS.textMuted,
      italic: true,
      showName: false
    };
  }
  if (line.type === "dialog") {
    return {
      font: `${(character && character.fontSize) || 22}px ${FONT.family}`,
      color: (character && character.color) || COLORS.text,
      italic: false,
      showName: true,
      nameText: (character && character.displayName) || line.speaker || "未知",
      nameColor: (character && character.nameColor) || COLORS.name
    };
  }
  return {
    font: `18px ${FONT.family}`,
    color: COLORS.text,
    italic: false,
    showName: false
  };
}

function drawTextArea(ctx) {
  if (isMemoryActive()) return; // 回忆独立渲染
  if (script.mode === "title") return; // 标题独立
  if (script.mode === "branch") return; // 选择独立

  // === DEBUG: 画一个红色边框,验证 drawTextArea 被调用 ===
  ctx.save();
  ctx.strokeStyle = "#ff0000";
  ctx.lineWidth = 2;
  ctx.strokeRect(2, 2, VIEW.w - 4, VIEW.h - 4);
  ctx.restore();

  // 文字区背景
  ctx.save();
  ctx.fillStyle = "rgba(8, 6, 4, 0.78)";
  ctx.fillRect(TEXT_AREA.x, TEXT_AREA.y, TEXT_AREA.w, TEXT_AREA.h);
  ctx.strokeStyle = "rgba(217, 168, 90, 0.45)";
  ctx.lineWidth = 1;
  ctx.strokeRect(TEXT_AREA.x + 0.5, TEXT_AREA.y + 0.5, TEXT_AREA.w, TEXT_AREA.h);

  // 文字区内部坐标系: 文字从 padX, padY 开始
  const padX = TEXT_AREA.x + TEXT_AREA.padding;
  const padY = TEXT_AREA.y + TEXT_AREA.padding;
  const innerW = TEXT_AREA.w - TEXT_AREA.padding * 2;
  const innerBottomY = TEXT_AREA.y + TEXT_AREA.h - TEXT_AREA.padding;
  const lineH = TEXT_AREA.lineH;

  // 先把"已完成行"（最多 6 条）拿出来,从最早的开始渲染
  const recentCompleted = typography.completed.slice(-TEXT_AREA.maxCompletedLines);

  // 累计 y (从顶部 padY 开始往下铺)
  let y = padY;

  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  // 1) 渲染"已完成"的行 (静态, 全部显示)
  for (const entry of recentCompleted) {
    const line = entry.line;
    const style = getLineStyle(line, state.characters[line.speaker]);
    y = renderOneLine(ctx, entry, line, style, padX, y, innerW, lineH, false);
    if (y > innerBottomY) break;
  }

  // === DEBUG: 在文字区右下角显示状态 ===
  ctx.save();
  ctx.fillStyle = "#00ff00";
  ctx.font = "12px monospace";
  ctx.textBaseline = "top";
  ctx.fillText("mode=" + script.mode, padX, innerBottomY - 60);
  ctx.fillText("active=" + (typography.active ? "Y" : "N"), padX, innerBottomY - 44);
  ctx.fillText("completed=" + typography.completed.length, padX, innerBottomY - 28);
  ctx.fillText("revealed=" + (typography.active ? typography.active.revealed : "-"), padX, innerBottomY - 12);
  ctx.restore();

  // 2) 渲染"当前 active"行 (如果还有空间)
  if (typography.active && y <= innerBottomY) {
    const entry = typography.active;
    const line = entry.line;
    const style = getLineStyle(line, state.characters[line.speaker]);
    y = renderOneLine(ctx, entry, line, style, padX, y, innerW, lineH, true);
  }

  ctx.restore();
}

function renderOneLine(ctx, entry, line, style, x, y, maxW, lineH, isActive) {
  // 名字行 (dialog only)
  if (style.showName && style.nameText) {
    ctx.fillStyle = style.nameColor;
    ctx.font = `bold 16px ${FONT.family}`;
    ctx.textBaseline = "top";
    ctx.fillText(style.nameText + "：", x, y);
    y += TEXT_AREA.nameH;
  }

  // 主体文字
  const fullText = entry.text || "";
  const shown = isActive ? fullText.substring(0, entry.revealed) : fullText;

  ctx.font = style.font;
  ctx.fillStyle = style.color;
  ctx.textBaseline = "top";

  if (style.italic) {
    // 斜体: 用 transform 偏置
    ctx.save();
    ctx.translate(x, y);
    ctx.transform(1, 0, -0.12, 1, 0, 0);
    drawWrappedText(ctx, shown, 0, 0, maxW, lineH);
    ctx.restore();
  } else {
    drawWrappedText(ctx, shown, x, y, maxW, lineH);
  }

  // 计算本行占用了几行 (wrap)
  const wrapped = wrapTextForCanvas(ctx, shown, maxW);
  const lines = countLines(wrapped);
  y += lines * lineH + 4; // 段间 4px

  return y;
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
  if (!text) return;
  const wrapped = wrapTextForCanvas(ctx, text, maxWidth);
  const lines = wrapped.split("\n");
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], x, y + i * lineHeight);
  }
}
