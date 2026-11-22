// The thief: WASD/arrows to move, mouse click to walk there, right-click to
// toss a coin, Shift to dash (fast but noisy), Q for a smoke bomb, E held to
// pick a lock (vault case or service gate). Noise is a fair trade: every tool
// that saves you also risks being heard.
import {
  PLAYER_R, PLAYER_SPEED, DASH_SPEED, DASH_TIME, DASH_COOLDOWN,
  COIN_COUNT, SMOKE_COUNT, SMOKE_TIME, SMOKE_R, LOCKPICK_TIME,
} from './config.js';
import { resolveCircleRect, dist } from './vision.js';

export function createThief(start) {
  return {
    x: start.x, y: start.y, r: PLAYER_R, angle: -Math.PI / 2,
    vx: 0, vy: 0, dashTime: 0, dashCooldown: 0, moving: false,
    coins: COIN_COUNT, smokes: SMOKE_COUNT, lockpick: 0,
    lockTarget: null, hidden: false, clickTarget: null,
  };
}

export function thiefNoiseRadius(thief) {
  if (thief.dashTime > 0) return 260;
  if (thief.moving) return 70;
  return 0;
}

export function updateThief(thief, input, dt, moveBlocks, vault, gate, gateOpen, onEvent) {
  let mx = 0;
  let my = 0;
  if (input.left) mx -= 1;
  if (input.right) mx += 1;
  if (input.up) my -= 1;
  if (input.down) my += 1;
  if (mx === 0 && my === 0 && thief.clickTarget) {
    const d = dist(thief.x, thief.y, thief.clickTarget.x, thief.clickTarget.y);
    if (d > 6) {
      mx = (thief.clickTarget.x - thief.x) / d;
      my = (thief.clickTarget.y - thief.y) / d;
    } else {
      thief.clickTarget = null;
    }
  }
  const len = Math.hypot(mx, my);
  if (len > 0) { mx /= len; my /= len; }
  thief.moving = len > 0;

  thief.dashCooldown = Math.max(0, thief.dashCooldown - dt);
  if (input.dash && thief.dashCooldown <= 0 && thief.dashTime <= 0 && thief.moving) {
    thief.dashTime = DASH_TIME;
    thief.dashCooldown = DASH_COOLDOWN;
    onEvent('dash');
  }
  let speed = PLAYER_SPEED;
  if (thief.dashTime > 0) {
    thief.dashTime -= dt;
    speed = DASH_SPEED;
  }
  if (len > 0) thief.angle = Math.atan2(my, mx);
  thief.x += mx * speed * dt;
  thief.y += my * speed * dt;
  for (const b of moveBlocks) {
    const fixed = resolveCircleRect(thief.x, thief.y, thief.r, b);
    thief.x = fixed.x;
    thief.y = fixed.y;
  }

  // Lockpicking: hold E beside the vault case or the locked gate.
  const nearVault = dist(thief.x, thief.y, vault.cx, vault.cy) < 110;
  const nearGate = !gateOpen && dist(thief.x, thief.y, gate.x + 7, gate.y + 60) < 70;
  thief.lockTarget = nearVault ? 'vault' : nearGate ? 'gate' : null;
  if (input.pick && thief.lockTarget) {
    thief.lockpick += dt;
    if (thief.lockpick >= LOCKPICK_TIME) {
      thief.lockpick = 0;
      onEvent(thief.lockTarget === 'vault' ? 'vault-picked' : 'gate-picked');
    }
  } else {
    thief.lockpick = 0;
  }
  return thief;
}

// A tossed coin lands at (x,y); guards walk over to investigate the clink.
export function tossCoin(thief, x, y) {
  if (thief.coins <= 0) return null;
  thief.coins -= 1;
  return { x, y, t: 0, life: 5 };
}

export function dropSmoke(thief) {
  if (thief.smokes <= 0) return null;
  thief.smokes -= 1;
  return { x: thief.x, y: thief.y, t: SMOKE_TIME, r: SMOKE_R };
}
