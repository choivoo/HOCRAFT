import { createEngine } from './core/index';
import type { CommandId } from './commands';
import { Renderer } from './ui/render';
import { Hud } from './ui/hud';
import { joystickVector, keyVector, keyCommand, payloadFromData } from './ui/layout';

const SAVE_KEY = 'kairoa-save', AUTO_KEY = 'kairoa-autosave';
const store = {
  get(k: string): string | null { try { return localStorage.getItem(k); } catch { return null; } },
  set(k: string, v: string) { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
};
const seedParam = Number(new URLSearchParams(location.search).get('seed'));
const engine = createEngine(Number.isFinite(seedParam) && seedParam > 0 ? seedParam : 1, store.get(AUTO_KEY) ?? undefined);
(window as unknown as { __kairoa: typeof engine }).__kairoa = engine;

const send = (id: CommandId, payload: unknown) => (engine.dispatch as (i: CommandId, p: unknown) => void)(id, payload);
const canvas = document.getElementById('game') as HTMLCanvasElement;
const renderer = new Renderer(canvas);
const hud = new Hud(engine);

const run = (id: CommandId, payload: unknown) => {
  if (id === 'file.load') {
    const json = store.get(SAVE_KEY) ?? store.get(AUTO_KEY);
    if (!json) { hud.toast('저장 데이터가 없습니다'); return; }
    send(id, { json });
    hud.toast('불러왔습니다');
    return;
  }
  send(id, payload);
  if (id === 'file.save') { store.set(SAVE_KEY, engine.serialize()); hud.toast('저장했습니다'); }
};

// --- movement input state ---
const keys = new Set<string>();
let joy = { dx: 0, dy: 0 };
let joyId = -1, joyCx = 0, joyCy = 0;
let sprintBtn = false, sprintKey = false, sprintSent = false;
const JOY_R = 56;
const joyEl = document.getElementById('joystick') as HTMLElement, knob = document.getElementById('knob') as HTMLElement;
let joyOffX = 0, joyOffY = 0;

function joyStart(ev: PointerEvent) {
  const onZone = ev.currentTarget === joyEl;
  if (joyId !== -1 || engine.state.paused || (!onZone && ev.clientX > innerWidth * 0.5)) return;
  joyId = ev.pointerId; (ev.currentTarget as HTMLElement).setPointerCapture(ev.pointerId);
  joyCx = ev.clientX; joyCy = ev.clientY;
  const r = joyEl.getBoundingClientRect();
  joyOffX = joyCx - (r.left + r.width / 2); joyOffY = joyCy - (r.top + r.height / 2);
  joyMove(ev);
}
function joyMove(ev: PointerEvent) {
  if (ev.pointerId !== joyId) return;
  const v = joystickVector(joyCx, joyCy, ev.clientX, ev.clientY, JOY_R);
  joy = { dx: v.dx, dy: v.dy };
  const m = Math.min(JOY_R, Math.hypot(ev.clientX - joyCx, ev.clientY - joyCy)), ang = Math.atan2(ev.clientY - joyCy, ev.clientX - joyCx);
  knob.style.transform = `translate(${joyOffX + Math.cos(ang) * m}px, ${joyOffY + Math.sin(ang) * m}px)`;
}
function joyEnd(ev: PointerEvent) {
  if (ev.pointerId !== joyId) return;
  joyId = -1; joy = { dx: 0, dy: 0 }; knob.style.transform = '';
}
for (const t of [canvas, joyEl]) {
  t.addEventListener('pointerdown', joyStart);
  t.addEventListener('pointermove', joyMove);
  t.addEventListener('pointerup', joyEnd);
  t.addEventListener('pointercancel', joyEnd);
}
canvas.addEventListener('contextmenu', e => e.preventDefault());

// --- command buttons (delegated). Gameplay buttons fire on pointerdown, everything else on click. ---
function fromEl(el: HTMLElement) {
  const cmd = el.dataset.cmd as CommandId;
  return { cmd, payload: payloadFromData(cmd, { index: el.dataset.index, count: el.dataset.count, to: el.dataset.to }) };
}
document.addEventListener('pointerdown', ev => {
  const el = (ev.target as HTMLElement).closest<HTMLElement>('.game[data-cmd]');
  if (!el) return;
  ev.preventDefault();
  const { cmd, payload } = fromEl(el);
  if (cmd === 'player.sprint') { sprintBtn = true; return; }
  run(cmd, payload);
});
const sprintUp = () => { sprintBtn = false; };
document.addEventListener('pointerup', sprintUp);
document.addEventListener('pointercancel', sprintUp);
document.addEventListener('click', ev => {
  const el = (ev.target as HTMLElement).closest<HTMLElement>('[data-cmd]');
  if (!el || el.classList.contains('game') || el.id === 'joystick') return;
  const { cmd, payload } = fromEl(el);
  run(cmd, payload);
});

// --- keyboard ---
addEventListener('keydown', ev => {
  if ((ev.target as HTMLElement).tagName === 'INPUT' && ev.code !== 'Escape') return;
  if (ev.code === 'ShiftLeft' || ev.code === 'ShiftRight') { sprintKey = true; return; }
  const act = keyCommand(ev.code, ev.ctrlKey || ev.metaKey, ev.shiftKey);
  if (act) { ev.preventDefault(); if (!ev.repeat) run(act.id as CommandId, act.payload); return; }
  keys.add(ev.code);
});
addEventListener('keyup', ev => {
  if (ev.code === 'ShiftLeft' || ev.code === 'ShiftRight') sprintKey = false;
  keys.delete(ev.code);
});
addEventListener('blur', () => { keys.clear(); sprintKey = false; sprintBtn = false; });

// --- layout / loop ---
const resize = () => { renderer.resize(innerWidth, innerHeight); hud.applyLayout(innerWidth, innerHeight); };
addEventListener('resize', resize); addEventListener('orientationchange', resize);
resize();

let last = performance.now(), lastMv = { dx: 0, dy: 0 }, autoT = 0;
function frame(now: number) {
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  if (!engine.state.paused) {
    const mv = joyId !== -1 ? joy : keyVector(keys);
    if (mv.dx !== lastMv.dx || mv.dy !== lastMv.dy || mv.dx !== 0 || mv.dy !== 0) send('player.move', { dx: mv.dx, dy: mv.dy });
    lastMv = { dx: mv.dx, dy: mv.dy };
    const sp = sprintBtn || sprintKey;
    if (sp !== sprintSent) { send('player.sprint', { on: sp }); sprintSent = sp; }
  }
  engine.step(dt);
  renderer.draw(engine.state, dt);
  hud.applyLayout(innerWidth, innerHeight);
  renderer.drawMinimap(document.getElementById('minimap')!.firstElementChild as HTMLCanvasElement, engine.state);
  hud.update(engine.state, dt, sprintBtn || sprintKey);
  autoT += dt;
  if (autoT > 5) { autoT = 0; store.set(AUTO_KEY, engine.serialize()); }
  requestAnimationFrame(frame);
}
addEventListener('pagehide', () => store.set(AUTO_KEY, engine.serialize()));
document.addEventListener('visibilitychange', () => { if (document.hidden) store.set(AUTO_KEY, engine.serialize()); });
hud.toast('카이로아 들판');
requestAnimationFrame(frame);
