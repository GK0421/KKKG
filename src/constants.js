// 客栈夜雨 — 常量
// 沿用 AGF 命名风格 (VIEW, COLORS, DEFAULT_ANIM), 但 viewport 改为 portrait.

const VIEW = Object.freeze({ w: 540, h: 960 });

const COLORS = Object.freeze({
  // 背景渐变 (由 scene 配置驱动)
  bgTop: "#0d0a08",
  bgBottom: "#1a1208",

  // 文字
  text: "#f2e7d0",
  textMuted: "#b49c7b",
  textFaint: "#7a6a4a",
  name: "#e5b84a",
  nameNpc: "#d9a85a",

  // 雨
  rain: "#9aa6c0",
  rainAlpha: 0.35,

  // 油灯
  lamp: "#d9a85a",
  lampRadius: 220,

  // 回忆纸
  paper: "#3a2a1a",
  paperAlpha: 0.35,

  // 选择按钮
  choiceBg: "rgba(217, 168, 90, 0.12)",
  choiceBgHover: "rgba(217, 168, 90, 0.22)",
  choiceEdge: "#d9a85a",
  choiceEdgeHover: "#e5b84a",

  // 状态
  panel: "rgba(0, 0, 0, 0.55)",
  panelEdge: "#e5b84a"
});

const FONT = Object.freeze({
  // 中文衬线优先 — 古风 + 阅读
  family: '"Songti SC", "STSong", "Noto Serif CJK SC", "FangSong", "STFangsong", "STKaiti", "KaiTi", serif',
  // 系统等宽用于 HUD 数字
  familyMono: '"SF Mono", "Cascadia Mono", "Consolas", "Menlo", monospace',
  // 节奏
  charDelayMs: 45,        // 逐字显示速度
  lineSpacing: 8,         // 行间留白
  paragraphSpacing: 24,   // 段间留白
  // 进度
  blinkPeriodMs: 1200
});

const ANIM_TIMING = Object.freeze({
  sceneFadeMs: 600,
  memoryFadeInMs: 300,
  memoryHoldMs: 800,
  memoryFadeOutMs: 400,
  // 雨丝
  rainSpawnPerFrame: 4
});

const SCRIPT = Object.freeze({
  startScene: "scene_01",
  title: "客栈夜雨",
  subtitle: "Inn at Dusk"
});
