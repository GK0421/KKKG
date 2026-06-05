// 客栈夜雨 — 输入处理
// 键盘 + 触屏 (点击 = Space)

const input = {
  keys: new Set(),
  prev: {},
  actions: {}
};

const KEY_BINDINGS = {
  advance: ["Space", "Enter", "ArrowDown", "KeyJ"],
  choice1: ["Digit1", "KeyQ"],
  choice2: ["Digit2", "KeyW"],
  choice3: ["Digit3", "KeyE"]
};

let pendingTap = null;

function initInput() {
  window.addEventListener("keydown", (event) => {
    if (["Space", "ArrowDown", "ArrowUp"].includes(event.code)) event.preventDefault();
    input.keys.add(event.code);
    ensureAudio();
  });
  window.addEventListener("keyup", (event) => input.keys.delete(event.code));

  const canvas = document.getElementById("game");
  if (canvas) {
    canvas.addEventListener("pointerdown", (e) => {
      const rect = canvas.getBoundingClientRect();
      pendingTap = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
      // 让画布可触屏
      ensureAudio();
    });
    canvas.addEventListener("pointermove", (e) => {
      // 更新 choices hover
      const rect = canvas.getBoundingClientRect();
      updateChoicesPointer(e.clientX - rect.left, e.clientY - rect.top);
    });
  }
}

function updateInput() {
  input.prev = input.actions;
  const next = {};
  for (const name of Object.keys(KEY_BINDINGS)) {
    next[name] = KEY_BINDINGS[name].some((k) => input.keys.has(k));
  }
  input.actions = next;
}

function consumeTap() {
  const t = pendingTap;
  pendingTap = null;
  return t;
}

function wasPressed(action) {
  return Boolean(input.actions[action]) && !input.prev[action];
}
