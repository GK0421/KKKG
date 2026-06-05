// 客栈夜雨 — 文字排版引擎
// 核心: 逐字显示 (typewriter) + 自动换行 + 留白节奏 + 段落/对话/独白/旁白四种样式

const typography = {
  // 当前正在逐字显示的行
  active: null,
  // 已完成的行堆叠
  completed: [],
  // 闪烁的"按任意键继续"提示
  promptBlinkT: 0,
  promptVisible: true,
  // 等待 Space 推进
  waitingForAdvance: false,
  // pause 类型行的剩余 ms
  pauseT: 0
};

function pushLine(line) {
  // 新一段进来,清空之前正在显示的(如果它没读完)。
  typography.active = {
    line,
    text: line.text || "",
    revealed: 0,    // 已揭示的字符数
    charTimer: 0,   // 距下一字显示的累加器
    done: false
  };
  typography.completed = [];
  typography.waitingForAdvance = false;
}

function completeActiveLine() {
  // 把 active 行的 revealed 推到全文,标记完成,等待玩家推进
  if (!typography.active) return;
  typography.active.revealed = typography.active.text.length;
  typography.active.done = true;
  typography.waitingForAdvance = true;
}

function commitActiveLine() {
  // 玩家按下 Space (行已读完): 把 active 推到 completed 堆
  if (!typography.active) return;
  typography.completed.push(typography.active);
  typography.active = null;
  typography.waitingForAdvance = false;
}

function updateTypography(dt) {
  if (typography.pauseT > 0) {
    typography.pauseT -= dt * 1000;
    if (typography.pauseT < 0) typography.pauseT = 0;
  }
  if (typography.active && !typography.active.done) {
    typography.active.charTimer += dt * 1000;
    while (
      typography.active.charTimer >= FONT.charDelayMs &&
      typography.active.revealed < typography.active.text.length
    ) {
      typography.active.charTimer -= FONT.charDelayMs;
      typography.active.revealed += 1;
    }
    if (typography.active.revealed >= typography.active.text.length) {
      typography.active.done = true;
      typography.waitingForAdvance = true;
    }
  }
  typography.promptBlinkT += dt * 1000;
  if (typography.promptBlinkT > FONT.blinkPeriodMs) {
    typography.promptBlinkT -= FONT.blinkPeriodMs;
    typography.promptVisible = !typography.promptVisible;
  }
}

function isWaitingForAdvance() {
  return typography.waitingForAdvance;
}

function isInPause() {
  return typography.pauseT > 0;
}

function isTyping() {
  return typography.active && !typography.active.done;
}

// 给一段文字做"自动换行"预处理。
// 中文按 1 字 / 视觉宽度单位,英文按 0.5 字。简化处理: 我们测量每加一字后宽度,
// 若超过 maxWidth 就回退,在上一字处插入 \n。
function wrapTextForCanvas(ctx, text, maxWidth) {
  if (!text) return "";
  let result = "";
  let line = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const test = line + ch;
    const w = ctx.measureText(test).width;
    if (w > maxWidth && line.length > 0) {
      result += line + "\n";
      line = ch;
    } else {
      line = test;
    }
  }
  result += line;
  return result;
}

function countLines(wrappedText) {
  if (!wrappedText) return 0;
  let n = 1;
  for (let i = 0; i < wrappedText.length; i++) {
    if (wrappedText.charCodeAt(i) === 10) n += 1;
  }
  return n;
}
