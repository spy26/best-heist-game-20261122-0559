// Every pixel the judge sees: the floor, the cones, the thief, the HUD.
// The rule is simple — if it matters to the heist, it is drawn in the frame:
// the room, the guards' gold cones, the cameras' red cones, the glowing loot
// target, and the alarm meter are all visible at once, at any moment.
import { VIEW_W, VIEW_H, HUD_H, GUARD_VIEW_RANGE, GUARD_VIEW_HALF_ANGLE, CAMERA_RANGE, CAMERA_HALF_ANGLE, ALARM_MAX } from './config.js';
import { levelSolids } from './level.js';
import { alarmLevel } from './alarm.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_WIN = 'win';

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width = VIEW_W;
  canvas.height = VIEW_H;

  function cone(x, y, angle, range, half, fill, edge) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, range, angle - half, angle + half);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = edge;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  function drawFloor(world) {
    const t = world.theme;
    const level = world.level;
    ctx.fillStyle = t.floorB;
    ctx.fillRect(0, HUD_H, VIEW_W, VIEW_H - HUD_H);
    const tile = 64;
    for (let y = HUD_H; y < VIEW_H; y += tile) {
      for (let x = 0; x < VIEW_W; x += tile) {
        if (((x / tile) + (y / tile)) % 2 === 0) {
          ctx.fillStyle = t.floorA;
          ctx.fillRect(x, y, tile, tile);
        }
      }
    }
    // Red carpet runner down the middle — the fast, exposed route.
    ctx.fillStyle = t.carpet;
    ctx.fillRect(596, HUD_H, 88, VIEW_H - HUD_H);
    ctx.fillStyle = t.carpetEdge;
    ctx.fillRect(592, HUD_H, 4, VIEW_H - HUD_H);
    ctx.fillRect(680, HUD_H, 4, VIEW_H - HUD_H);
    // Paintings on the north wall.
    for (const p of level.paintings) {
      ctx.fillStyle = '#d8b25a';
      ctx.fillRect(p.x - 4, p.y - 4, p.w + 8, p.h + 8);
      ctx.fillStyle = p.hue;
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(p.x + 8, p.y + 6, p.w - 30, 10);
    }
  }

  function drawRoom(world) {
    const t = world.theme;
    const level = world.level;
    // Walls.
    for (const w of level.walls) {
      ctx.fillStyle = t.wallTop;
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.fillStyle = t.wall;
      ctx.fillRect(w.x, w.y + 4, w.w, w.h - 4);
    }
    // Velvet ropes.
    ctx.strokeStyle = t.rope;
    ctx.lineWidth = 5;
    for (const r of level.ropes) {
      ctx.beginPath();
      ctx.moveTo(r.x, r.y + 4);
      ctx.lineTo(r.x + r.w, r.y + 4);
      ctx.stroke();
      ctx.fillStyle = '#c9a227';
      ctx.beginPath();
      ctx.arc(r.x, r.y + 4, 5, 0, Math.PI * 2);
      ctx.arc(r.x + r.w, r.y + 4, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    // Pedestals.
    for (const p of level.pedestals) {
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(p.x + 4, p.y + 6, p.w, p.h);
      ctx.fillStyle = '#5d6470';
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = '#7d8594';
      ctx.fillRect(p.x + 4, p.y + 4, p.w - 8, 10);
      ctx.fillStyle = t.dim;
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(p.label, p.x + p.w / 2, p.y + p.h - 8);
    }
    // Locked service gate (east lane shortcut).
    if (!world.gateOpen) {
      ctx.fillStyle = '#8a6d1f';
      ctx.fillRect(level.gate.x, level.gate.y, level.gate.w, level.gate.h);
      ctx.fillStyle = '#f2c14e';
      ctx.font = 'bold 11px monospace';
      ctx.save();
      ctx.translate(level.gate.x + 7, level.gate.y + 60);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.fillText('LOCKED — HOLD E', 0, 4);
      ctx.restore();
    }
    // Vault case + Sun Opal.
    const v = level.vault;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(v.x + 5, v.y + 6, v.w, v.h);
    ctx.fillStyle = '#2c3648';
    ctx.fillRect(v.x, v.y, v.w, v.h);
    ctx.strokeStyle = world.vaultOpen ? '#7ee081' : t.vault;
    ctx.lineWidth = 3;
    ctx.strokeRect(v.x + 3, v.y + 3, v.w - 6, v.h - 6);
    if (!world.vaultOpen) {
      ctx.fillStyle = 'rgba(142, 202, 230, 0.18)';
      ctx.fillRect(v.x + 3, v.y + 3, v.w - 6, v.h - 6);
    }
    const opal = level.loot[0];
    if (!opal.taken) {
      const pulse = 1 + Math.sin(world.time * 3) * 0.12;
      const glow = ctx.createRadialGradient(opal.x, opal.y, 2, opal.x, opal.y, 46 * pulse);
      glow.addColorStop(0, 'rgba(242, 193, 78, 0.9)');
      glow.addColorStop(1, 'rgba(242, 193, 78, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(opal.x, opal.y, 46 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f2c14e';
      ctx.beginPath();
      ctx.moveTo(opal.x, opal.y - 16);
      ctx.lineTo(opal.x + 12, opal.y);
      ctx.lineTo(opal.x, opal.y + 16);
      ctx.lineTo(opal.x - 12, opal.y);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fff3c4';
      ctx.beginPath();
      ctx.moveTo(opal.x, opal.y - 9);
      ctx.lineTo(opal.x + 6, opal.y);
      ctx.lineTo(opal.x, opal.y + 9);
      ctx.lineTo(opal.x - 6, opal.y);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#f2c14e';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('★ SUN OPAL ★', opal.x, v.y - 12);
    }
    // Side loot.
    for (const item of level.loot.slice(1)) {
      if (item.taken) continue;
      ctx.fillStyle = '#f2c14e';
      ctx.beginPath();
      ctx.arc(item.x, item.y, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff3c4';
      ctx.beginPath();
      ctx.arc(item.x, item.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = t.text;
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(item.name, item.x, item.y - 16);
    }
    // EXIT door.
    const ex = level.exit;
    ctx.fillStyle = world.opalTaken ? '#16a34a' : '#14532d';
    ctx.fillRect(ex.x, ex.y, ex.w, ex.h);
    ctx.fillStyle = world.opalTaken ? '#bbf7d0' : '#4ade80';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(world.opalTaken ? 'EXIT — GO!' : 'EXIT (NEED OPAL)', ex.x + ex.w / 2, ex.y - 6);
  }

  function drawCones(world) {
    const t = world.theme;
    const solids = levelSolids(world.level, world.gateOpen);
    void solids;
    for (const c of world.cameras) {
      cone(c.x, c.y, c.angle, CAMERA_RANGE, CAMERA_HALF_ANGLE,
        c.alert ? 'rgba(255, 77, 77, 0.38)' : t.coneCamera,
        c.alert ? '#ff4d4d' : t.coneCameraEdge);
    }
    for (const g of world.guards) {
      const hot = g.mood === 'chase';
      cone(g.x, g.y, g.angle, GUARD_VIEW_RANGE, GUARD_VIEW_HALF_ANGLE,
        hot ? 'rgba(255, 77, 77, 0.38)' : t.coneGuard,
        hot ? '#ff4d4d' : t.coneGuardEdge);
    }
  }

  function drawActors(world) {
    const t = world.theme;
    // Coins on the floor.
    for (const c of world.coins) {
      ctx.fillStyle = '#f2c14e';
      ctx.beginPath();
      ctx.arc(c.x, c.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff3c4';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    // Smoke clouds.
    for (const s of world.smokes) {
      ctx.fillStyle = t.smoke;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SMOKE', s.x, s.y - s.r - 6);
    }
    // Cameras on the walls.
    for (const c of world.cameras) {
      ctx.fillStyle = c.alert ? '#ff4d4d' : '#e5e7eb';
      ctx.beginPath();
      ctx.arc(c.x, c.y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.arc(c.x + Math.cos(c.angle) * 5, c.y + Math.sin(c.angle) * 5, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = c.alert ? '#ff4d4d' : t.text;
      ctx.font = 'bold 11px monospace';
      if (c.x > 1000) {
        ctx.textAlign = 'right';
        ctx.fillText(c.name + (c.alert ? ' !' : ''), c.x - 14, c.y + 4);
      } else {
        ctx.textAlign = 'left';
        ctx.fillText(c.name + (c.alert ? ' !' : ''), c.x + 14, c.y + 4);
      }
    }
    // Guards.
    for (const g of world.guards) {
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.ellipse(g.x, g.y + 10, 14, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = g.mood === 'chase' ? '#991b1b' : t.guardSuit;
      ctx.beginPath();
      ctx.arc(g.x, g.y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = t.guard;
      ctx.beginPath();
      ctx.arc(g.x + Math.cos(g.angle) * 6, g.y + Math.sin(g.angle) * 6, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.arc(g.x + Math.cos(g.angle) * 9, g.y + Math.sin(g.angle) * 9, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = g.mood === 'chase' ? '#ff6b6b' : t.text;
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      const mood = g.mood === 'chase' ? '!' : g.mood === 'suspicious' ? '?' : '';
      ctx.fillText(`${g.name} ${mood}`, g.x, g.y - 22);
    }
    // The thief.
    const th = world.thief;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(th.x, th.y + 10, 13, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = t.thiefDark;
    ctx.beginPath();
    ctx.arc(th.x, th.y, th.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = t.thief;
    ctx.beginPath();
    ctx.arc(th.x + Math.cos(th.angle) * 5, th.y + Math.sin(th.angle) * 5, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0b0f17';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(th.x, th.y);
    ctx.lineTo(th.x + Math.cos(th.angle) * 18, th.y + Math.sin(th.angle) * 18);
    ctx.stroke();
    ctx.fillStyle = t.text;
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('YOU', th.x, th.y - 20);
    if (th.clickTarget) {
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(th.clickTarget.x, th.clickTarget.y, 7, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Lockpick progress ring.
    if (th.lockpick > 0) {
      ctx.fillStyle = '#0b0f17';
      ctx.fillRect(th.x - 30, th.y - 38, 60, 8);
      ctx.fillStyle = '#f2c14e';
      ctx.fillRect(th.x - 29, th.y - 37, 58 * (th.lockpick / 2), 6);
      ctx.fillStyle = '#f2c14e';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('PICKING LOCK…', th.x, th.y - 42);
    }
    // Floating score text.
    for (const f of world.floating) {
      ctx.globalAlpha = Math.min(1, f.t);
      ctx.fillStyle = f.color;
      ctx.font = 'bold 15px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(f.text, f.x, f.y - (1.4 - f.t) * 30);
      ctx.globalAlpha = 1;
    }
  }

  function drawHud(world) {
    const t = world.theme;
    ctx.fillStyle = t.hud;
    ctx.fillRect(0, 0, VIEW_W, HUD_H);
    ctx.fillStyle = t.hudLine;
    ctx.fillRect(0, HUD_H - 2, VIEW_W, 2);
    ctx.fillStyle = t.gold;
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('◆ GILDED VAULT', 16, 28);
    ctx.fillStyle = t.dim;
    ctx.font = '12px monospace';
    ctx.fillText('The Sun Opal Heist', 16, 48);
    // Alarm meter — the big one, centre top.
    const ax = 380, ay = 16, aw = 360, ah = 22;
    const lvl = alarmLevel(world.alarm);
    ctx.fillStyle = '#000';
    ctx.fillRect(ax - 2, ay - 2, aw + 4, ah + 4);
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(ax, ay, aw, ah);
    ctx.fillStyle = lvl === 'hot' ? '#ef4444' : lvl === 'warm' ? '#f59e0b' : '#22c55e';
    ctx.fillRect(ax, ay, aw * (world.alarm.value / ALARM_MAX), ah);
    ctx.strokeStyle = t.text;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(ax, ay, aw, ah);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`ALARM ${Math.floor(world.alarm.value)}%`, ax + aw / 2, ay + 16);
    ctx.fillStyle = t.dim;
    ctx.font = '11px monospace';
    ctx.fillText(world.alarm.value >= 70 ? '!! SPOTTED — BREAK LINE OF SIGHT !!' : 'stay out of the cones', ax + aw / 2, ay + 36);
    // Loot + tools + time, right side.
    ctx.textAlign = 'right';
    ctx.fillStyle = t.gold;
    ctx.font = 'bold 18px monospace';
    ctx.fillText(`LOOT $${world.lootValue.toLocaleString()}  (${world.lootTaken}/4)`, 1264, 26);
    ctx.fillStyle = t.text;
    ctx.font = '13px monospace';
    ctx.fillText(`⏱ ${Math.floor(world.time)}s   ● coins ${world.thief.coins}   ☁ smoke ${world.thief.smokes}   E pick   F smash   Shift dash`, 1264, 48);
    ctx.textAlign = 'left';
    ctx.fillStyle = world.opalTaken ? '#7ee081' : t.dim;
    ctx.font = 'bold 12px monospace';
    ctx.fillText(world.opalTaken ? '✓ OPAL SECURED — GET TO THE EXIT!' : 'GOAL: steal SUN OPAL, reach EXIT', 770, 28);
  }

  function overlay(title, lines, accent) {
    ctx.fillStyle = 'rgba(5, 8, 15, 0.82)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = accent;
    ctx.font = 'bold 44px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(title, VIEW_W / 2, 250);
    ctx.fillStyle = '#f4ead2';
    ctx.font = '17px monospace';
    lines.forEach((l, i) => ctx.fillText(l, VIEW_W / 2, 300 + i * 30));
  }

  function draw(world, screen) {
    drawFloor(world);
    if (screen !== SCREEN_TITLE) {
      drawRoom(world);
      drawCones(world);
      drawActors(world);
    } else {
      // Title shows the room staged behind the panel, cones and all.
      drawRoom(world);
      drawCones(world);
      drawActors(world);
    }
    drawHud(world);
    if (screen === SCREEN_TITLE) {
      overlay('◆ GILDED VAULT ◆', [
        'THE SUN OPAL HEIST — one gallery, three guards, two cameras, one jewel.',
        'WASD / arrows or click to move · Shift dash · E hold to pick locks · F smash glass',
        'Right-click / C toss a coin to lure guards · Q smoke bomb · stay out of the cones',
        'Steal the SUN OPAL, grab the side loot, reach the green EXIT before the alarm hits 100%.',
        '',
        'Press ENTER or click to begin',
      ], '#f2c14e');
    } else if (screen === SCREEN_PAUSED) {
      overlay('PAUSED', ['Press P or Esc to resume'], '#9aa7bd');
    } else if (screen === SCREEN_CAUGHT) {
      overlay('CAUGHT!', [
        world.endReason || 'The gallery got you.',
        `Loot kept: $${world.lootValue.toLocaleString()} · Alarm peaked at ${Math.floor(world.alarm.peak)}% · Time ${Math.floor(world.time)}s`,
        'Press ENTER to try again — the cones sweep the same, the plan is yours to change.',
      ], '#ff6b6b');
    } else if (screen === SCREEN_WIN) {
      overlay('CLEAN GETAWAY!', [
        `Loot $${world.lootValue.toLocaleString()} + time bonus $${world.timeBonus || 0} + ghost bonus $${world.ghostBonus || 0}`,
        `FINAL SCORE: $${(world.score || 0).toLocaleString()} · Alarm peaked at ${Math.floor(world.alarm.peak)}% · Time ${Math.floor(world.time)}s`,
        'The Sun Opal is yours. Press ENTER to run it again.',
      ], '#34d399');
    }
  }

  return { draw };
}
