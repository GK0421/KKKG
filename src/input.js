// AGF Mobile Prototype 01 — input with keyboard AND touch support
// Forked from AGF side-scroll seed. Change vs seed:
//   * Adds touch layer: pointerdown/pointermove/pointerup on the canvas.
//   * Left half of the canvas = virtual D-pad (drag to set run direction).
//   * Right half = jump button (tap = jump).
//   * Touch is independent of keyboard; both can be active at once.

const input = {
  keys: new Set(),
  prev: {},
  actions: {},
  gamepadIndex: null,
  touch: {
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    lastTap: 0
  }
};

const KEY_BINDINGS = {
  left: ["ArrowLeft", "KeyA"],
  right: ["ArrowRight", "KeyD"],
  up: ["ArrowUp", "KeyW"],
  down: ["ArrowDown", "KeyS"],
  jump: ["Space", "KeyK"],
  attack: ["KeyJ", "KeyX"],
  interact: ["KeyE", "Enter"],
  start: ["Enter", "NumpadEnter"],
  pause: ["Escape", "KeyP"]
};

// Touch deadzone radius (in CSS pixels) before the virtual stick reports direction.
// 22 is a touch larger than typical (18) because on mobile-portrait the player's
// thumb covers a bigger screen area and accidental small drags should not register
// as movement.
const TOUCH_DEADZONE = 22;

// Minimum interval (ms) between two right-half taps. Below this we ignore the
// new tap to debounce accidental double-fires when a finger lands and rolls.
const TAP_DEBOUNCE_MS = 140;

function initInput() {
  window.addEventListener("keydown", (event) => {
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) {
      event.preventDefault();
    }
    input.keys.add(event.code);
    ensureAudio();
  });
  window.addEventListener("keyup", (event) => input.keys.delete(event.code));
  window.addEventListener("gamepadconnected", (event) => {
    input.gamepadIndex = event.gamepad.index;
  });
  window.addEventListener("gamepaddisconnected", () => {
    input.gamepadIndex = null;
  });

  // Touch layer — bound to the canvas only. We use Pointer Events so mouse
  // and pen get reasonable defaults too.
  const canvas = document.getElementById("game");
  if (canvas) {
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  }
}

function onPointerDown(event) {
  if (input.touch.pointerId !== null && input.touch.pointerId !== event.pointerId) return;
  input.touch.pointerId = event.pointerId;
  input.touch.active = true;
  input.touch.startX = event.clientX;
  input.touch.startY = event.clientY;
  input.touch.currentX = event.clientX;
  input.touch.currentY = event.clientY;
  const now = performance.now();
  // Right half of the canvas = jump. Single-tap on right half triggers a
  // jump on pointerdown (no need to wait for pointerup).
  if (isRightHalf(event.clientX) && now - input.touch.lastTap > TAP_DEBOUNCE_MS) {
    input.touch.jumpQueued = true;
    input.touch.tapQueued = true; // also queues a generic tap for title/gameover
    input.touch.lastTap = now;
  }
  // Try to focus the canvas so keyboard works after the first tap.
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  ensureAudio();
}

function onPointerMove(event) {
  if (input.touch.pointerId !== event.pointerId) return;
  input.touch.currentX = event.clientX;
  input.touch.currentY = event.clientY;
}

function onPointerUp(event) {
  if (input.touch.pointerId !== event.pointerId) return;
  input.touch.pointerId = null;
  input.touch.active = false;
}

function isRightHalf(clientX) {
  const canvas = document.getElementById("game");
  if (!canvas) return false;
  const rect = canvas.getBoundingClientRect();
  return clientX - rect.left > rect.width / 2;
}

function touchAxisX() {
  // Returns -1, 0, or +1 based on touch drag distance from the start point.
  if (!input.touch.active) return 0;
  const dx = input.touch.currentX - input.touch.startX;
  if (Math.abs(dx) < TOUCH_DEADZONE) return 0;
  return dx < 0 ? -1 : 1;
}

function touchJumpConsume() {
  if (input.touch.jumpQueued) {
    input.touch.jumpQueued = false;
    return true;
  }
  return false;
}

function updateInput() {
  input.prev = input.actions;
  const gp = getGamepadState();
  const next = {};
  for (const name of Object.keys(KEY_BINDINGS)) {
    next[name] = KEY_BINDINGS[name].some((key) => input.keys.has(key)) || Boolean(gp[name]);
  }
  // Touch contributes to left/right/jump on top of keyboard.
  const touchX = touchAxisX();
  if (touchX !== 0) {
    if (touchX < 0) next.left = true;
    if (touchX > 0) next.right = true;
  }
  if (touchJumpConsume()) next.jump = true;
  const axis = (next.right ? 1 : 0) - (next.left ? 1 : 0);
  next.x = gp.x !== 0 ? gp.x : axis;
  // If neither keyboard nor touch is active and there's no gamepad input,
  // the player should slow to a stop (axis = 0). This is already what
  // `axis` computes; we keep the explicit branch for clarity.
  input.actions = next;
}

function getGamepadState() {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  const pad = input.gamepadIndex != null ? pads[input.gamepadIndex] : Array.from(pads).find(Boolean);
  if (!pad) return { x: 0 };
  const axisX = Math.abs(pad.axes[0] || 0) > 0.25 ? pad.axes[0] : 0;
  return {
    x: axisX,
    left: axisX < -0.25 || pad.buttons[14]?.pressed,
    right: axisX > 0.25 || pad.buttons[15]?.pressed,
    up: (pad.axes[1] || 0) < -0.5 || pad.buttons[12]?.pressed,
    down: (pad.axes[1] || 0) > 0.5 || pad.buttons[13]?.pressed,
    jump: pad.buttons[0]?.pressed,
    attack: pad.buttons[2]?.pressed || pad.buttons[1]?.pressed,
    interact: pad.buttons[3]?.pressed,
    start: pad.buttons[9]?.pressed,
    pause: pad.buttons[8]?.pressed
  };
}

function isHeld(action) {
  return Boolean(input.actions[action]);
}

function wasPressed(action) {
  return Boolean(input.actions[action]) && !input.prev[action];
}
