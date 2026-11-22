// Wall cameras: mounted high, sweeping a red cone back and forth. A camera
// never moves and never chases — it just watches, and its cone is always drawn
// before it can raise the alarm, so dodging it is a timing puzzle, not luck.
import { CAMERA_RANGE, CAMERA_HALF_ANGLE } from './config.js';
import { angleTo, angleDiff, dist, hasLineOfSight } from './vision.js';

export function createCameras(defs) {
  return defs.map((d, i) => ({
    id: i, name: d.name, x: d.x, y: d.y,
    baseAngle: d.baseAngle, sweep: d.sweep, speed: d.speed,
    phase: i * 1.7, angle: d.baseAngle, alert: false,
  }));
}

export function updateCameras(cameras, thief, dt, time, solids, smokes, onEvent) {
  for (const c of cameras) {
    c.angle = c.baseAngle + Math.sin(time * c.speed + c.phase) * c.sweep;
    const d = dist(c.x, c.y, thief.x, thief.y);
    let sees = false;
    if (d < CAMERA_RANGE) {
      const a = angleTo(c.x, c.y, thief.x, thief.y);
      if (Math.abs(angleDiff(a, c.angle)) < CAMERA_HALF_ANGLE) {
        if (hasLineOfSight(c.x, c.y, thief.x, thief.y, solids)) {
          let smoked = false;
          for (const s of smokes) {
            if (dist(thief.x, thief.y, s.x, s.y) < s.r) smoked = true;
          }
          sees = !smoked;
        }
      }
    }
    if (sees && !c.alert) onEvent('camera-seen', c);
    c.alert = sees;
  }
}
