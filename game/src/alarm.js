// The alarm meter: the game's heartbeat. It climbs while any guard or camera
// has eyes on the thief, falls when the thief breaks line of sight, and jumps
// when the vault glass is smashed. At 100 the gallery locks down — caught.
// The meter is always on screen, so the tension is readable at a glance.
import { ALARM_MAX, ALARM_GUARD_RATE, ALARM_CAMERA_RATE, ALARM_DECAY, ALARM_SMASH } from './config.js';

export function createAlarm() {
  return { value: 0, peak: 0, tripped: false };
}

export function updateAlarm(alarm, dt, guardSeen, cameraSeen) {
  let rate = 0;
  if (guardSeen) rate += ALARM_GUARD_RATE;
  if (cameraSeen) rate += ALARM_CAMERA_RATE;
  if (rate > 0) alarm.value += rate * dt;
  else alarm.value -= ALARM_DECAY * dt;
  alarm.value = Math.max(0, Math.min(ALARM_MAX, alarm.value));
  alarm.peak = Math.max(alarm.peak, alarm.value);
  if (alarm.value >= ALARM_MAX) alarm.tripped = true;
  return alarm;
}

export function smashAlarm(alarm) {
  alarm.value = Math.min(ALARM_MAX, alarm.value + ALARM_SMASH);
  alarm.peak = Math.max(alarm.peak, alarm.value);
  if (alarm.value >= ALARM_MAX) alarm.tripped = true;
}

export function alarmLevel(alarm) {
  if (alarm.value < 35) return 'calm';
  if (alarm.value < 70) return 'warm';
  return 'hot';
}
