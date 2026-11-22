// Boot and the one loop: input is read every frame, the world advances in
// fixed 1/60 s steps (several in a slow frame, none in a fast one), and the
// renderer paints what is there. The game moves between five screens: title,
// play, paused, caught and win.
//
// ?seed=N fixes the layout seed. ?shot=start|play|alarm|win (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot. ?theme=midnight|ember|neon picks the
// art direction.
import { pickTheme, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, worldReset, updateWorld } from './world.js';
import { createInput } from './input.js';
import { createRenderer, SCREEN_TITLE, SCREEN_PLAY, SCREEN_PAUSED, SCREEN_CAUGHT, SCREEN_WIN } from './render.js';
import { createAudio } from './audio.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const themeName = params.get('theme') || 'midnight';
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const theme = pickTheme(themeName);
const world = createWorld(theme, seed);
const renderer = createRenderer(canvas);
const audio = createAudio();

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world, scene.screen);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let accumulator = 0;
  let last = performance.now();

  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    audio.unlock();
    worldReset(world);
    world.status = 'play';
    screen = SCREEN_PLAY;
    announce('Playing. Steal the Sun Opal, then reach the exit.');
  }

  function frame(now) {
    const elapsed = Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    if (screen === SCREEN_TITLE || screen === SCREEN_CAUGHT || screen === SCREEN_WIN) {
      const events = input.consume();
      if (events.confirm) startGame();
      if (screen === SCREEN_TITLE && events.clickAt) startGame();
    } else if (screen === SCREEN_PLAY) {
      accumulator += elapsed;
      while (accumulator >= STEP) {
        updateWorld(world, input, STEP, audio);
        accumulator -= STEP;
        if (world.status === 'caught') { screen = SCREEN_CAUGHT; announce(world.endReason); }
        if (world.status === 'win') { screen = SCREEN_WIN; announce('Clean getaway!'); }
        if (world.status === 'paused') { screen = SCREEN_PAUSED; announce('Paused.'); }
      }
    } else if (screen === SCREEN_PAUSED) {
      const events = input.consume();
      if (events.pause || events.confirm) {
        world.status = 'play';
        screen = SCREEN_PLAY;
      }
    }
    renderer.draw(world, screen);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
