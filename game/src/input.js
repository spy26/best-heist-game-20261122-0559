// Keyboard + mouse, in one place. WASD/arrows move, Shift dashes, E (hold)
// picks locks, Q drops smoke, C tosses a coin at the cursor, right-click does
// the same, left-click walks there. P/Esc pauses, Enter confirms on menus.
export const ACTION_CONFIRM = 'confirm';
export const ACTION_PAUSE = 'pause';

export function createInput(canvas) {
  const keys = new Set();
  const input = {
    left: false, right: false, up: false, down: false,
    dash: false, pick: false, smoke: false, smash: false, coinAt: null, clickAt: null,
    confirm: false, pause: false,
  };
  function sync() {
    input.left = keys.has('ArrowLeft') || keys.has('a') || keys.has('A');
    input.right = keys.has('ArrowRight') || keys.has('d') || keys.has('D');
    input.up = keys.has('ArrowUp') || keys.has('w') || keys.has('W');
    input.down = keys.has('ArrowDown') || keys.has('s') || keys.has('S');
    input.dash = keys.has('Shift');
    input.pick = keys.has('e') || keys.has('E');
    input.smash = keys.has('f') || keys.has('F');
  }
  function toGame(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * 1280,
      y: ((e.clientY - r.top) / r.height) * 720,
    };
  }
  window.addEventListener('keydown', (e) => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) e.preventDefault();
    if (e.key === 'Enter' || e.key === ' ') input.confirm = true;
    if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') input.pause = true;
    if (e.key === 'q' || e.key === 'Q') input.smoke = true;
    if (e.key === 'c' || e.key === 'C') input.coinAt = input.mouse || null;
    keys.add(e.key.length === 1 ? e.key.toLowerCase() : e.key);
    if (e.key.length === 1) keys.add(e.key);
    sync();
  });
  window.addEventListener('keyup', (e) => {
    keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key);
    keys.delete(e.key);
    sync();
  });
  canvas.addEventListener('mousemove', (e) => { input.mouse = toGame(e); });
  canvas.addEventListener('mousedown', (e) => {
    const p = toGame(e);
    input.mouse = p;
    if (e.button === 0) input.clickAt = p;
    if (e.button === 2) input.coinAt = p;
  });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  input.consume = function consume() {
    const out = {
      confirm: input.confirm, pause: input.pause,
      smoke: input.smoke, coinAt: input.coinAt, clickAt: input.clickAt,
    };
    input.confirm = false; input.pause = false;
    input.smoke = false; input.coinAt = null; input.clickAt = null;
    return out;
  };
  return input;
}
