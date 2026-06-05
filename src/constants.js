// AGF Mobile Prototype 01 — viewport + palette
// Forked from AGF side-scroll seed (apps/daemon/src/templates/foundation/side-scroll/seed).
// Change vs seed: VIEW is 540x960 (9:16 portrait) and palette is a bright, friendly arcade look.

const VIEW = Object.freeze({ w: 540, h: 960 });

const GAME = Object.freeze({
  title: "AGF Mobile Prototype 01",
  startScene: "level_01",
  startMode: "title"
});

const COLORS = Object.freeze({
  bgTop: "#0f1a2b",
  bgBottom: "#1f3358",
  ground: "#3a4a3a",
  groundTop: "#5b8b5b",
  platform: "#6a4a2a",
  platformTop: "#a07a4a",
  panel: "rgba(0, 0, 0, 0.55)",
  panelEdge: "#e5b84a",
  text: "#f2e7d0",
  muted: "#b49c7b",
  hp: "#d9362b",
  hpBack: "#39201c",
  gold: "#e5b84a",
  jade: "#2fa66a",
  player: "#4ea1ff",
  playerOutline: "#0e2a4d",
  enemy: "#9b4dca",
  enemyOutline: "#3b1a4d",
  coin: "#e5b84a",
  coinEdge: "#7a5a14",
  spike: "#d9362b",
  spikeEdge: "#5a1a18"
});

const DEFAULT_ANIM = Object.freeze({
  frameW: 64,
  frameH: 64,
  frames: 1,
  cols: 1,
  rows: 1,
  fps: 8
});
