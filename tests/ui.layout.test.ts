import { describe, it, expect } from 'vitest';
import { computeLayout, rectsOverlap, joystickVector, keyVector, keyCommand, payloadFromData, CONTROL_IDS } from '../src/ui/layout';

describe.each([[390, 844], [844, 390], [640, 360]])('layout %ix%i', (w, h) => {
  const L = computeLayout(w, h);
  const ids = CONTROL_IDS.filter(i => i !== 'joystick');
  it('targets >=44px and inside viewport', () => {
    for (const id of CONTROL_IDS) {
      const r = L[id];
      expect(r.w).toBeGreaterThanOrEqual(44); expect(r.h).toBeGreaterThanOrEqual(44);
      expect(r.x).toBeGreaterThanOrEqual(0); expect(r.y).toBeGreaterThanOrEqual(0);
      expect(r.x + r.w).toBeLessThanOrEqual(w); expect(r.y + r.h).toBeLessThanOrEqual(h);
    }
  });
  it('no overlaps', () => {
    for (let i = 0; i < CONTROL_IDS.length; i++) for (let j = i + 1; j < CONTROL_IDS.length; j++)
      expect(rectsOverlap(L[CONTROL_IDS[i]], L[CONTROL_IDS[j]]), `${CONTROL_IDS[i]} vs ${CONTROL_IDS[j]}`).toBe(false);
    expect(ids.length).toBe(11);
  });
});

describe('joystick', () => {
  it('dead zone, clamp, scale', () => {
    expect(joystickVector(0, 0, 1, 0, 50).mag).toBe(0);
    const v = joystickVector(0, 0, 200, 0, 50);
    expect(v).toEqual({ dx: 1, dy: 0, mag: 1 });
    const h = joystickVector(0, 0, 0, -25, 50);
    expect(h.dy).toBeCloseTo(-0.5);
  });
  it('keys', () => {
    expect(keyVector(new Set(['KeyW', 'KeyD'])).dx).toBeCloseTo(Math.SQRT1_2);
    expect(keyVector(new Set(['KeyA', 'KeyD']))).toEqual({ dx: 0, dy: 0 });
  });
  it('key commands & payloads', () => {
    expect(keyCommand('Digit3', false, false)).toEqual({ id: 'party.switch', payload: { index: 2 } });
    expect(keyCommand('KeyZ', true, true)?.id).toBe('edit.redo');
    expect(payloadFromData('gacha.pull', { count: '10' })).toEqual({ count: 10 });
    expect(payloadFromData('party.reorder', { index: '1', to: '0' })).toEqual({ from: 1, to: 0 });
  });
});
