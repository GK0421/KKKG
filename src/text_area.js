// 客栈夜雨 — 文字主区渲染 (在背景之上, 在 HUD 之下, 在选择/回忆之下)
// 旁白/对话/独白/pause 共用同一块文字区域。

const TEXT_AREA = Object.freeze({
  x: 24,
  y: VIEW.h * 0.6,
  w: VIEW.w - 48,
  h: VIEW.h * 0.32,
  padding: 16
});

function getLineStyle(line, character) {
  if (line.type === "narration") {
    return {
      font: `${COLORS && "narrator"} ${18}px ${FONT.family}`,
      color: COLORS.textMuted,
      align: "left",
      italic: false,
      showName: false
    };
  }
  if (line.type === "inner") {
    return {
      font: `italic 18px ${FONT.family}`,
      color: COLORS.textMuted,
      align: "left",
      italic: true,
      showName: false
    };
  }
  if (line.type === "dialog") {
    const charColor = (character && character.color) || COLORS.text;
    const charNameColor = (character && character.nameColor) || COLORS.name;
    return {
      font: `${character && character.fontSize ? character.fontSize : 22}px ${FONT.family}`,
      color: charColor,
      align: "left",
      italic: false,
      showName: true,
      nameText: (character && character.displayName) || line.speaker,
      nameColor: charNameColor
    };
  }
  return {
    font: `18px ${FONT.family}`,
    color: COLORS.text,
    align: "left",
    italic: false,
    showName: false
  };
}

function drawTextArea(ctx) {
  if (isMemoryActive()) return; // 回忆独立渲染
  if (script.mode === "title") return; // 标题独立
  if (script.mode === "branch") return; // 选择独立

  // 文字区背景
  ctx.save();
  ctx.fillStyle = "rgba(8, 6, 4, 0.62)";
  ctx.fillRect(TEXT_AREA.x, TEXT_AREA.y, TEXT_AREA.w, TEXT_AREA.h);
  ctx.strokeStyle = "rgba(217, 168, 90, 0.32)";
  ctx.lineWidth = 1;
  ctx.strokeRect(TEXT_AREA.x + 0.5, TEXT_AREA.y + 0.5, TEXT_AREA.w, TEXT_AREA.h);

  // 把已完成的行 + 当前正在显示的行堆在一起渲染
  const linesToShow = [...typography.completed];
  if (typography.active) linesToShow.push(typography.active);

  // 倒序从下往上,最新行在最底
  const lineH = 30;
  const padX = TEXT_AREA.x + TEXT_AREA.padding;
  const padY = TEXT_AREA.y + TEXT_AREA.padding;
  const bottomY = TEXT_AREA.y + TEXT_AREA.h - TEXT_AREA.padding;

  let y = bottomY;
  for (let i = linesToShow.length - 1; i >= 0; i--) {
    const entry = linesToShow[i];
    const line = entry.line;
    const style = getLineStyle(line, state.characters[line.speaker]);
    ctx.font = style.font;
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = style.align || "left";
    ctx.fillStyle = style.color;
    if (style.italic) {
      // 斜体: ctx.font 已含 italic, 但有时浏览器渲染会失效
      // 用 transform 微调
      ctx.save();
      ctx.translate(padX, y);
      ctx.transform(1, 0, -0.12, 1, 0, 0);
      drawOneLine(ctx, entry, line, style, 0, 0, lineH);
      ctx.restore();
    } else {
      drawOneLine(ctx, entry, line, style, padX, y, lineH);
    }
    y -= lineH;
    if (style.showName) y -= 8; // 名字上方留空
    if (y < padY - lineH) break; // 超出区
  }
  ctx.restore();
}

function drawOneLine(ctx, entry, line, style, x, y, lineH) {
  if (style.showName && style.nameText) {
    ctx.fillStyle = style.nameColor;
    ctx.font = `bold 16px ${FONT.family}`;
    ctx.fillText(style.nameText + "：", x, y);
    ctx.font = style.font;
    ctx.fillStyle = style.color;
  }
  // 已揭示文本
  const fullText = entry.text || "";
  const revealed = entry.revealed;
  const shown = fullText.substring(0, revealed);
  // 简单换行
  const wrapped = wrapTextForCanvas(ctx, shown, TEXT_AREA.w - TEXT_AREA.padding * 2);
  const arr = wrapped.split("\n");
  let yy = y;
  for (let k = 0; k < arr.length; k++) {
    ctx.fillText(arr[k], x, yy);
    yy += lineH;
  }
  // 闪烁光标
  if (!entry.done && typography.active === entry) {
    const lastLine = arr[arr.length - 1] || "";
    const w = ctx.measureText(lastLine).width;
    if (Math.floor(typography.promptBlinkT / 600) % 2 === 0) {
      ctx.fillRect(x + w + 2, y - 16, 2, 20);
    }
  }
}
