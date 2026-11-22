// Patrol guards: walk their waypoint loop, sweep their vision cone, and react
// in three moods — PATROL (calm loop), SUSPICIOUS (walk to the noise or the
// glimpse and look around), CHASE (thief fully seen: close in, alarm screams).
// A guard only ever sees what its cone and a clear line of sight allow, so
// pedestals and smoke are real cover, and a caught moment is always fair:
// the cone is drawn before it can catch you.
import { GUARD_SPEED, GUARD_CHASE_SPEED, GUARD_VIEW_RANGE, GUARD_VIEW_HALF_ANGLE } from './config.js';
import { angleTo, angleDiff, dist, hasLineOfSight } from './vision.js';

export function createGuards(defs) {
  return defs.map((d, i) => ({
    id: i, name: d.name, waypoints: d.waypoints,
    x: d.waypoints[0][0], y: d.waypoints[0][1],
    wp: 1, angle: 0, mood: 'patrol', suspicion: 0,
    lookX: 0, lookY: 0, lookTime: 0, caught: false,
  }));
}

export function guardSeesThief(guard, thief, solids, smokes) {
  const d = dist(guard.x, guard.y, thief.x, thief.y);
  if (d > GUARD_VIEW_RANGE) return 0;
  const a = angleTo(guard.x, guard.y, thief.x, thief.y);
  if (Math.abs(angleDiff(a, guard.angle)) > GUARD_VIEW_HALF_ANGLE) return 0;
  if (!hasLineOfSight(guard.x, guard.y, thief.x, thief.y, solids)) return 0;
  for (const s of smokes) {
    if (dist(thief.x, thief.y, s.x, s.y) < s.r) return 0;
  }
  // Closer and more centred in the cone reads as a stronger sighting.
  const centred = 1 - Math.abs(angleDiff(a, guard.angle)) / GUARD_VIEW_HALF_ANGLE;
  const near = 1 - d / GUARD_VIEW_RANGE;
  return 0.45 + 0.55 * (centred * 0.6 + near * 0.4);
}

export function updateGuards(guards, thief, dt, solids, smokes, coins, onEvent) {
  for (const g of guards) {
    const seen = guardSeesThief(g, thief, solids, smokes);
    if (seen > 0.85) {
      g.mood = 'chase';
      g.suspicion = 1;
      onEvent('spotted', g);
    } else if (seen > 0) {
      g.suspicion = Math.min(1, g.suspicion + seen * dt * 1.4);
      if (g.suspicion > 0.6) {
        g.mood = 'suspicious';
        g.lookX = thief.x; g.lookY = thief.y; g.lookTime = 3;
      }
    } else {
      g.suspicion = Math.max(0, g.suspicion - dt * 0.25);
      if (g.mood === 'suspicious' && g.suspicion < 0.15) g.mood = 'patrol';
      if (g.mood === 'chase' && g.suspicion <= 0) g.mood = 'suspicious';
    }

    // A coin clink pulls a patrolling guard over to investigate.
    if (g.mood === 'patrol' && coins.length) {
      const c = coins[coins.length - 1];
      if (dist(g.x, g.y, c.x, c.y) < 320) {
        g.mood = 'suspicious';
        g.lookX = c.x; g.lookY = c.y; g.lookTime = 4;
      }
    }

    let tx, ty, speed;
    if (g.mood === 'chase') {
      tx = thief.x; ty = thief.y; speed = GUARD_CHASE_SPEED;
    } else if (g.mood === 'suspicious') {
      tx = g.lookX; ty = g.lookY; speed = GUARD_SPEED * 1.15;
    } else {
      const wp = g.waypoints[g.wp];
      tx = wp[0]; ty = wp[1]; speed = GUARD_SPEED;
    }
    const d = dist(g.x, g.y, tx, ty);
    if (d > 4) {
      const step = Math.min(d, speed * dt);
      g.x += ((tx - g.x) / d) * step;
      g.y += ((ty - g.y) / d) * step;
      g.angle = angleTo(g.x, g.y, tx, ty);
    } else if (g.mood === 'patrol') {
      g.wp = (g.wp + 1) % g.waypoints.length;
    } else if (g.mood === 'suspicious') {
      g.lookTime -= dt;
      g.angle += dt * 1.8; // scans the room, then gives up
      if (g.lookTime <= 0) { g.mood = 'patrol'; g.suspicion = 0; }
    }
    if (dist(g.x, g.y, thief.x, thief.y) < 26) {
      g.caught = true;
      onEvent('caught', g);
    }
  }
}
