/** Pure UI helpers: layout rects and input vector math. No DOM. */
export interface Rect { x: number; y: number; w: number; h: number }
export interface Insets { t: number; r: number; b: number; l: number }
export const CONTROL_IDS = [
  'pause', 'minimap', 'joystick', 'attack', 'skill', 'burst', 'sprint', 'interact',
  'p0', 'p1', 'p2', 'p3',
] as const;
export type ControlId = (typeof CONTROL_IDS)[number];

export function computeLayout(w: number, h: number, ins: Insets = { t: 0, r: 0, b: 0, l: 0 }): Record<ControlId, Rect> {
  const m = 12, big = 76, sm = 56, gap = 10, pw = 56, ph = 62;
  const R = w - ins.r - m, B = h - ins.b - m, L = ins.l + m, T = ins.t + m;
  const rect = (x: number, y: number, ww: number, hh: number): Rect => ({ x, y, w: ww, h: hh });
  const pause = rect(R - 48, T, 48, 48);
  const portraitX = R - pw;
  const out = {} as Record<ControlId, Rect>;
  out.pause = pause;
  out.minimap = rect(L, T, 84, 84);
  out.joystick = rect(L, B - 132, 132, 132);
  const clusterR = portraitX - 12;
  const attack = rect(clusterR - big, B - big, big, big);
  out.attack = attack;
  out.skill = rect(attack.x - sm - gap, B - sm, sm, sm);
  out.burst = rect(out.skill.x, out.skill.y - sm - gap, sm, sm);
  out.sprint = rect(attack.x + (big - sm) / 2, attack.y - sm - gap, sm, sm);
  out.interact = rect(out.sprint.x, out.sprint.y - sm - gap, sm, sm);
  for (let i = 0; i < 4; i++) out[`p${i}` as ControlId] = rect(portraitX, pause.y + pause.h + 8 + i * (ph + 6), pw, ph);
  return out;
}

export function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

/** Joystick: pointer offset from base center -> unit-clamped vector. mag in 0..1 (far drag = faster). */
export function joystickVector(cx: number, cy: number, px: number, py: number, radius: number, dead = 0.12): { dx: number; dy: number; mag: number } {
  const ox = px - cx, oy = py - cy;
  const d = Math.hypot(ox, oy);
  if (d === 0 || radius <= 0) return { dx: 0, dy: 0, mag: 0 };
  const mag = Math.min(1, d / radius);
  if (mag < dead) return { dx: 0, dy: 0, mag: 0 };
  return { dx: (ox / d) * mag, dy: (oy / d) * mag, mag };
}

/** Keyboard WASD/arrows -> normalised vector. */
export function keyVector(down: ReadonlySet<string>): { dx: number; dy: number } {
  let dx = 0, dy = 0;
  if (down.has('KeyA') || down.has('ArrowLeft')) dx -= 1;
  if (down.has('KeyD') || down.has('ArrowRight')) dx += 1;
  if (down.has('KeyW') || down.has('ArrowUp')) dy -= 1;
  if (down.has('KeyS') || down.has('ArrowDown')) dy += 1;
  const d = Math.hypot(dx, dy);
  return d > 0 ? { dx: dx / d, dy: dy / d } : { dx: 0, dy: 0 };
}

export type KeyAction = { id: string; payload?: unknown; hold?: 'sprint' };
/** Key (event.code) -> command, for non-movement keys. */
export function keyCommand(code: string, ctrl: boolean, shift: boolean): KeyAction | null {
  if (ctrl) {
    if (code === 'KeyZ') return { id: shift ? 'edit.redo' : 'edit.undo', payload: {} };
    if (code === 'KeyS') return { id: 'file.save', payload: {} };
    return null;
  }
  switch (code) {
    case 'KeyJ': return { id: 'combat.attack', payload: {} };
    case 'KeyK': return { id: 'combat.skill', payload: {} };
    case 'KeyL': return { id: 'combat.burst', payload: {} };
    case 'KeyE': return { id: 'world.interact', payload: {} };
    case 'Escape': return { id: 'menu.toggle', payload: {} };
    case 'Digit1': case 'Digit2': case 'Digit3': case 'Digit4':
      return { id: 'party.switch', payload: { index: Number(code.slice(5)) - 1 } };
    default: return null;
  }
}

/** Build a command payload from a control's data attributes. */
export function payloadFromData(cmd: string, d: { index?: string; count?: string; to?: string }): unknown {
  switch (cmd) {
    case 'party.switch': return { index: Number(d.index ?? 0) };
    case 'party.reorder': return { from: Number(d.index ?? 0), to: Number(d.to ?? 0) };
    case 'gacha.pull': return { count: Number(d.count) === 10 ? 10 : 1 };
    default: return {};
  }
}
