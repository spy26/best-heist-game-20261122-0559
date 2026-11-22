// The Gilded Vault: one grand gallery, three ways to the Sun Opal.
//   (a) the red carpet straight up the middle — fast, fully exposed;
//   (b) the west gallery hugging the left wall — one camera, one guard;
//   (c) the east lane behind the pedestals — a locked gate (lockpick it)
//       skips the vault guard's patrol.
// Walls and pedestals block movement AND sight; velvet ropes block movement
// only; the smoke cloud blocks sight only. All coordinates are canvas pixels.
import { LOOT_VALUES } from './config.js';

export const ROOM = { x: 24, y: 80, w: 1232, h: 624 };

export function buildLevel() {
  const walls = [
    { x: ROOM.x, y: ROOM.y, w: ROOM.w, h: 14 }, // north
    { x: ROOM.x, y: ROOM.y + ROOM.h - 14, w: ROOM.w, h: 14 }, // south
    { x: ROOM.x, y: ROOM.y, w: 14, h: ROOM.h }, // west
    { x: ROOM.x + ROOM.w - 14, y: ROOM.y, w: 14, h: ROOM.h }, // east
  ];
  // Display pedestals: solid cover that breaks vision cones.
  const pedestals = [
    { x: 300, y: 180, w: 90, h: 60, label: 'Marble Bust' },
    { x: 300, y: 480, w: 90, h: 60, label: 'Bronze Horse' },
    { x: 620, y: 180, w: 90, h: 60, label: 'Jade Vase' },
    { x: 620, y: 500, w: 90, h: 60, label: 'Porcelain Crane' },
    { x: 1030, y: 150, w: 80, h: 60, label: 'Silver Mirror' },
  ];
  // Velvet ropes: low barriers, movement only, never sight.
  const ropes = [
    { x: 180, y: 268, w: 380, h: 8 },
    { x: 700, y: 268, w: 150, h: 8 },
    { x: 180, y: 452, w: 380, h: 8 },
    { x: 700, y: 452, w: 150, h: 8 },
  ];
  // The vault case holding the Sun Opal, centre-east.
  const vault = { x: 880, y: 300, w: 120, h: 90, cx: 940, cy: 345 };
  // Locked service gate: the east-lane shortcut, opened by lockpick.
  const gate = { x: 972, y: 420, w: 14, h: 120 };
  const loot = [
    { id: 'opal', name: 'Sun Opal', x: vault.cx, y: vault.cy, value: LOOT_VALUES.opal, inVault: true, taken: false },
    { id: 'scarab', name: 'Jade Scarab', x: 345, y: 168, value: LOOT_VALUES.scarab, inVault: false, taken: false },
    { id: 'tiara', name: 'Pearl Tiara', x: 150, y: 205, value: LOOT_VALUES.tiara, inVault: false, taken: false },
    { id: 'chalice', name: 'Silver Chalice', x: 1150, y: 620, value: LOOT_VALUES.chalice, inVault: false, taken: false },
  ];
  const guards = [
    { name: 'Marco', waypoints: [[200, 150], [600, 150], [600, 320], [200, 320]] },
    { name: 'Iris', waypoints: [[200, 600], [700, 600], [700, 450], [200, 450]] },
    { name: 'Viktor', waypoints: [[860, 180], [860, 560], [1080, 560], [1080, 180]] },
  ];
  const cameras = [
    { name: 'CAM-1', x: 640, y: 96, baseAngle: Math.PI / 2, sweep: 0.55, speed: 0.45 },
    { name: 'CAM-2', x: 1240, y: 400, baseAngle: Math.PI, sweep: 0.5, speed: 0.6 },
  ];
  const exit = { x: 600, y: 690, w: 80, h: 14 };
  const playerStart = { x: 120, y: 640 };
  const paintings = [
    { x: 120, y: 96, w: 90, h: 56, hue: '#c96f4a' },
    { x: 420, y: 96, w: 90, h: 56, hue: '#4a7dc9' },
    { x: 900, y: 96, w: 90, h: 56, hue: '#7dc94a' },
    { x: 1100, y: 96, w: 90, h: 56, hue: '#c94a8a' },
  ];
  return { walls, pedestals, ropes, vault, gate, loot, guards, cameras, exit, playerStart, paintings };
}

// Solid blocks for movement + sight (gate included only while locked).
export function levelSolids(level, gateOpen) {
  const solids = [...level.walls, ...level.pedestals, level.vault];
  if (!gateOpen) solids.push(level.gate);
  return solids;
}

// Movement-only blocks (ropes never block sight).
export function levelMoveBlocks(level, gateOpen) {
  return [...levelSolids(level, gateOpen), ...level.ropes];
}
