// Gilded Vault — tuning constants and the three art-direction palettes.
// The theme is picked with ?theme=midnight|ember|neon (default midnight) so the
// three benchmark variants are the same game in different light.
export const VIEW_W = 1280;
export const VIEW_H = 720;
export const HUD_H = 64;
export const STEP = 1 / 60;
export const PLAYER_R = 13;
export const PLAYER_SPEED = 175;
export const DASH_SPEED = 430;
export const DASH_TIME = 0.16;
export const DASH_COOLDOWN = 1.4;
export const GUARD_SPEED = 82;
export const GUARD_CHASE_SPEED = 148;
export const GUARD_VIEW_RANGE = 235;
export const GUARD_VIEW_HALF_ANGLE = 0.61;
export const CAMERA_RANGE = 265;
export const CAMERA_HALF_ANGLE = 0.42;
export const ALARM_MAX = 100;
export const ALARM_GUARD_RATE = 26;
export const ALARM_CAMERA_RATE = 18;
export const ALARM_DECAY = 7;
export const ALARM_SMASH = 35;
export const LOCKPICK_TIME = 2.0;
export const SMOKE_TIME = 6;
export const SMOKE_R = 95;
export const COIN_COUNT = 3;
export const SMOKE_COUNT = 1;

export const LOOT_VALUES = { opal: 5000, scarab: 1200, tiara: 900, chalice: 700 };

// One palette per variant. Midnight (cold blue hall, gold loot) is the default.
export const THEMES = {
  midnight: {
    name: 'Midnight',
    floorA: '#232c3d', floorB: '#1c2431', carpet: '#7a1f2b', carpetEdge: '#c9a227',
    wall: '#3a4660', wallTop: '#4a5878', rope: '#a11e2e', gold: '#f2c14e',
    coneGuard: 'rgba(242, 193, 78, 0.20)', coneGuardEdge: 'rgba(242, 193, 78, 0.55)',
    coneCamera: 'rgba(255, 77, 77, 0.20)', coneCameraEdge: 'rgba(255, 77, 77, 0.60)',
    thief: '#2dd4bf', thiefDark: '#0f766e', guard: '#e8b4b8', guardSuit: '#5b2333',
    hud: '#0d1320', hudLine: '#c9a227', text: '#f4ead2', dim: '#9aa7bd',
    vault: '#8ecae6', exit: '#34d399', smoke: 'rgba(200, 210, 225, 0.55)',
  },
  ember: {
    name: 'Ember',
    floorA: '#33241c', floorB: '#2a1d16', carpet: '#5e1a12', carpetEdge: '#e07b39',
    wall: '#4d3226', wallTop: '#63463a', rope: '#c22e1f', gold: '#ffb347',
    coneGuard: 'rgba(255, 179, 71, 0.22)', coneGuardEdge: 'rgba(255, 179, 71, 0.55)',
    coneCamera: 'rgba(255, 92, 60, 0.22)', coneCameraEdge: 'rgba(255, 92, 60, 0.60)',
    thief: '#7ee081', thiefDark: '#2f7d32', guard: '#f0c297', guardSuit: '#6b2d1e',
    hud: '#1a100a', hudLine: '#e07b39', text: '#ffe8c9', dim: '#c2a284',
    vault: '#ffb347', exit: '#7ee081', smoke: 'rgba(220, 200, 180, 0.55)',
  },
  neon: {
    name: 'Neon',
    floorA: '#1b1030', floorB: '#150b26', carpet: '#3d1a5e', carpetEdge: '#22d3ee',
    wall: '#2c1b4d', wallTop: '#3d2a68', rope: '#d946ef', gold: '#facc15',
    coneGuard: 'rgba(34, 211, 238, 0.20)', coneGuardEdge: 'rgba(34, 211, 238, 0.60)',
    coneCamera: 'rgba(244, 114, 182, 0.22)', coneCameraEdge: 'rgba(244, 114, 182, 0.60)',
    thief: '#facc15', thiefDark: '#a16207', guard: '#fda4af', guardSuit: '#4c1d95',
    hud: '#0e0718', hudLine: '#22d3ee', text: '#e6f7ff', dim: '#a5b4d4',
    vault: '#22d3ee', exit: '#4ade80', smoke: 'rgba(190, 200, 255, 0.55)',
  },
};

export function pickTheme(name) {
  return THEMES[name] || THEMES.midnight;
}
