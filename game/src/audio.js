// Synthesized sound: every effect is built with the Web Audio API, no audio
// files, no network. Audio starts only after the player's first gesture, so
// the game stays silent (and error-free) on the title screen and in screenshots.
export function createAudio() {
  let ctx = null;
  function ensure() {
    if (ctx) return ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
    } catch { ctx = null; }
    return ctx;
  }
  function tone(freq, dur, type, gain, slideTo) {
    const c = ensure();
    if (!c) return;
    try {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, c.currentTime);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + dur);
      g.gain.setValueAtTime(gain, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
      o.connect(g);
      g.connect(c.destination);
      o.start();
      o.stop(c.currentTime + dur);
    } catch { /* audio is decoration, never fatal */ }
  }
  return {
    unlock() { ensure(); },
    step() { tone(180, 0.05, 'sine', 0.03); },
    coin() { tone(1320, 0.12, 'triangle', 0.08, 1760); },
    loot() { tone(660, 0.18, 'sine', 0.09, 990); setTimeout(() => tone(990, 0.25, 'sine', 0.09, 1320), 90); },
    smash() { tone(220, 0.3, 'sawtooth', 0.12, 60); },
    alarmBeep() { tone(880, 0.12, 'square', 0.05, 880); },
    spotted() { tone(440, 0.25, 'square', 0.07, 660); },
    caught() { tone(330, 0.5, 'sawtooth', 0.12, 110); },
    win() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.3, 'sine', 0.09), i * 110)); },
    lockpick() { tone(980, 0.06, 'triangle', 0.05); },
  };
}
