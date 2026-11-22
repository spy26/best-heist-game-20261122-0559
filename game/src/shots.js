// Staged scenes for screenshots: ?shot=start|play|alarm|win (with &seed=N).
// Each one poses the world mid-heist — real game state, real render — paints
// it twice and sets window.__shotReady so a screenshot tool knows it is done.
import { SCREEN_TITLE, SCREEN_PLAY, SCREEN_CAUGHT, SCREEN_WIN } from './render.js';

export function stageShot(name, world) {
  const th = world.thief;
  const g = world.guards;
  const level = world.level;
  if (name === 'start') {
    world.status = 'title';
    th.x = 340; th.y = 620; th.angle = -Math.PI / 2;
    g[0].x = 420; g[0].y = 200; g[0].angle = Math.PI / 2;
    g[1].x = 420; g[1].y = 520; g[1].angle = -Math.PI / 2;
    g[2].x = 900; g[2].y = 520; g[2].angle = Math.PI;
    world.cameras[0].angle = Math.PI / 2 + 0.3;
    world.cameras[1].angle = Math.PI - 0.4;
    return { screen: SCREEN_TITLE, best: 0 };
  }
  if (name === 'play') {
    world.status = 'play';
    // Mid-heist: thief crouched behind the Jade Vase pedestal, Opal glowing,
    // one side loot already taken, a guard sweeping past, alarm at 22%.
    th.x = 560; th.y = 250; th.angle = Math.PI / 4;
    th.coins = 2; th.smokes = 1;
    level.loot[2].taken = true; // Pearl Tiara already pocketed
    world.lootTaken = 1;
    world.lootValue = 900;
    world.alarm.value = 22;
    world.alarm.peak = 22;
    g[0].x = 500; g[0].y = 150; g[0].angle = Math.PI / 2; g[0].mood = 'patrol';
    g[1].x = 300; g[1].y = 600; g[1].angle = 0; g[1].mood = 'patrol';
    g[2].x = 860; g[2].y = 420; g[2].angle = -Math.PI / 2; g[2].mood = 'patrol';
    world.cameras[0].angle = Math.PI / 2 + 0.35;
    world.cameras[1].angle = Math.PI - 0.2;
    world.smokes.push({ x: 700, y: 380, t: 4, r: 95 });
    world.coins.push({ x: 760, y: 300, t: 1, life: 5 });
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'alarm') {
    world.status = 'play';
    // The near-miss: Viktor has the thief at the edge of his cone, alarm 78%,
    // Opal already taken, thief dashing for the exit.
    th.x = 900; th.y = 560; th.angle = Math.PI / 2;
    th.coins = 1; th.smokes = 0;
    level.loot[0].taken = true;
    level.loot[1].taken = true;
    world.opalTaken = true;
    world.lootTaken = 2;
    world.lootValue = 6200;
    world.alarm.value = 78;
    world.alarm.peak = 78;
    world.vaultOpen = true;
    g[0].x = 600; g[0].y = 400; g[0].angle = Math.PI / 4; g[0].mood = 'patrol';
    g[1].x = 500; g[1].y = 600; g[1].angle = 0; g[1].mood = 'suspicious';
    g[1].suspicion = 0.8; g[1].lookX = 900; g[1].lookY = 560;
    g[2].x = 900; g[2].y = 440; g[2].angle = Math.PI / 2; g[2].mood = 'chase';
    world.cameras[0].angle = Math.PI / 2;
    world.cameras[1].angle = Math.PI + 0.3;
    world.cameras[1].alert = true;
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'win') {
    world.status = 'win';
    th.x = 640; th.y = 660; th.angle = -Math.PI / 2;
    level.loot[0].taken = true;
    level.loot[1].taken = true;
    level.loot[3].taken = true;
    world.opalTaken = true;
    world.lootTaken = 3;
    world.lootValue = 6900;
    world.time = 74;
    world.timeBonus = 830;
    world.ghostBonus = 500;
    world.score = 8230;
    world.alarm.value = 12;
    world.alarm.peak = 41;
    world.vaultOpen = true;
    g[0].x = 300; g[0].y = 200; g[0].angle = 0; g[0].mood = 'patrol';
    g[1].x = 400; g[1].y = 550; g[1].angle = Math.PI; g[1].mood = 'patrol';
    g[2].x = 1000; g[2].y = 250; g[2].angle = -Math.PI / 2; g[2].mood = 'patrol';
    return { screen: SCREEN_WIN, best: 8230 };
  }
  return { screen: SCREEN_PLAY, best: 0 };
}
