// The world: one state object, one update step. Owns the thief, the guards,
// the cameras, the alarm, the loot, the smoke and coins, and the win/caught
// verdicts. The renderer only reads this state; it never mutates it.
import { buildLevel, levelSolids, levelMoveBlocks } from './level.js';
import { createThief, updateThief, tossCoin, dropSmoke, thiefNoiseRadius } from './player.js';
import { createGuards, updateGuards, guardSeesThief } from './guards.js';
import { createCameras, updateCameras } from './cameras.js';
import { createAlarm, updateAlarm, smashAlarm } from './alarm.js';
import { LOCKPICK_TIME, ALARM_MAX } from './config.js';
import { dist } from './vision.js';

export const EVENT_SPOTTED = 'spotted';
export const EVENT_CAUGHT = 'caught';
export const EVENT_WIN = 'win';

export function createWorld(theme, seed) {
  const level = buildLevel();
  return {
    theme, seed, level,
    thief: createThief(level.playerStart),
    guards: createGuards(level.guards),
    cameras: createCameras(level.cameras),
    alarm: createAlarm(),
    time: 0, lootValue: 0, lootTaken: 0, opalTaken: false,
    vaultOpen: false, vaultSmashed: false, gateOpen: false,
    coins: [], smokes: [], floating: [],
    status: 'title', // title | play | paused | caught | win
    caughtBy: null, endReason: '', score: 0,
    beepTimer: 0,
  };
}

export function worldReset(world) {
  const fresh = createWorld(world.theme, world.seed);
  fresh.status = 'play';
  Object.assign(world, fresh);
}

function addFloat(world, x, y, text, color) {
  world.floating.push({ x, y, text, color, t: 1.4 });
}

export function updateWorld(world, input, dt, audio) {
  if (world.status !== 'play') return;
  world.time += dt;
  const level = world.level;
  const solids = levelSolids(level, world.gateOpen);
  const moveBlocks = levelMoveBlocks(level, world.gateOpen);

  const events = input.consume();
  if (events.pause) { world.status = 'paused'; return; }
  if (events.clickAt) world.thief.clickTarget = events.clickAt;
  if (events.coinAt) {
    const c = tossCoin(world.thief, events.coinAt.x, events.coinAt.y);
    if (c) { world.coins.push(c); audio.coin(); }
  }
  if (events.smoke) {
    const s = dropSmoke(world.thief);
    if (s) { world.smokes.push(s); audio.coin(); }
  }

  let guardSpotted = false;
  let cameraSpotted = false;
  updateThief(world.thief, input, dt, moveBlocks, level.vault, level.gate, world.gateOpen, (ev) => {
    if (ev === 'vault-picked') {
      world.vaultOpen = true;
      audio.lockpick();
      addFloat(world, level.vault.cx, level.vault.cy - 70, 'VAULT OPEN — SILENT', '#7ee081');
    }
    if (ev === 'gate-picked') {
      world.gateOpen = true;
      audio.lockpick();
      addFloat(world, level.gate.x, level.gate.y - 20, 'GATE OPEN', '#7ee081');
    }
    if (ev === 'dash') audio.step();
  });

  // Smash the vault glass with a click on it? No — deliberate: press F near
  // the case to smash (fast, loud, +alarm). F is read here via input.pick2.
  if (input.smash && !world.vaultOpen && dist(world.thief.x, world.thief.y, level.vault.cx, level.vault.cy) < 110) {
    world.vaultOpen = true;
    world.vaultSmashed = true;
    smashAlarm(world.alarm);
    audio.smash();
    addFloat(world, level.vault.cx, level.vault.cy - 70, 'GLASS SMASHED! +ALARM', '#ff6b6b');
  }

  updateGuards(world.guards, world.thief, dt, solids, world.smokes, world.coins, (ev, g) => {
    if (ev === 'spotted') { guardSpotted = true; audio.spotted(); }
    if (ev === 'caught') {
      world.status = 'caught';
      world.caughtBy = g.name;
      world.endReason = `Caught by ${g.name} the guard`;
      audio.caught();
    }
  });
  updateCameras(world.cameras, world.thief, dt, world.time, solids, world.smokes, () => {
    cameraSpotted = true;
  });

  // Alarm: any live sighting counts, even in the same frame as the catch.
  for (const g of world.guards) {
    if (guardSeesThief(g, world.thief, solids, world.smokes) > 0) guardSpotted = true;
  }
  for (const c of world.cameras) if (c.alert) cameraSpotted = true;
  updateAlarm(world.alarm, dt, guardSpotted, cameraSpotted);
  if (world.alarm.tripped && world.status === 'play') {
    world.status = 'caught';
    world.caughtBy = 'ALARM';
    world.endReason = 'Alarm hit 100% — gallery lockdown';
    audio.caught();
  }
  if (world.alarm.value > 70) {
    world.beepTimer -= dt;
    if (world.beepTimer <= 0) { audio.alarmBeep(); world.beepTimer = 0.7; }
  }

  // Noise: dashing is heard; a guard in earshot comes to look.
  const noise = thiefNoiseRadius(world.thief);
  if (noise > 200) {
    for (const g of world.guards) {
      if (g.mood === 'patrol' && dist(g.x, g.y, world.thief.x, world.thief.y) < noise) {
        g.mood = 'suspicious';
        g.lookX = world.thief.x; g.lookY = world.thief.y; g.lookTime = 2.5;
      }
    }
  }

  // Loot pickup: walk over a loose piece; the Opal needs the vault open.
  for (const item of level.loot) {
    if (item.taken) continue;
    if (item.inVault && !world.vaultOpen) continue;
    if (dist(world.thief.x, world.thief.y, item.x, item.y) < 30) {
      item.taken = true;
      world.lootTaken += 1;
      world.lootValue += item.value;
      if (item.id === 'opal') world.opalTaken = true;
      audio.loot();
      addFloat(world, item.x, item.y - 24, `+$${item.value.toLocaleString()} ${item.name}`, '#f2c14e');
    }
  }

  // Win: Sun Opal in hand, reach the green EXIT door.
  const ex = level.exit;
  if (world.opalTaken && world.thief.x > ex.x - 10 && world.thief.x < ex.x + ex.w + 10
    && world.thief.y > ex.y - 24) {
    world.status = 'win';
    const timeBonus = Math.max(0, 1200 - Math.floor(world.time) * 5);
    const ghostBonus = world.alarm.peak < 50 ? 500 : 0;
    world.score = world.lootValue + timeBonus + ghostBonus;
    world.timeBonus = timeBonus;
    world.ghostBonus = ghostBonus;
    audio.win();
  }

  for (const c of world.coins) c.t += dt;
  world.coins = world.coins.filter((c) => c.t < c.life);
  for (const s of world.smokes) s.t -= dt;
  world.smokes = world.smokes.filter((s) => s.t > 0);
  for (const f of world.floating) f.t -= dt;
  world.floating = world.floating.filter((f) => f.t > 0);
  void LOCKPICK_TIME;
  void ALARM_MAX;
}
