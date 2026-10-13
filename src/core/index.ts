import type { CommandId, CommandPayload } from '../commands';
import type { Character, Element, Enemy, Engine, GameState, Vec } from './types';
import { CHARACTERS, ENEMIES, EQUIPPABLE, EQUIP_ATTACK_BONUS, GACHA, generateMap, mulberry } from '../data';

export type { Engine, GameState } from './types';
export const WALK_SPEED = 4, SPRINT_SPEED = 7, SPAWN_HP_FRAC = 0.5;
const SWITCH_CD = 1, ATTACK_CD = 0.5, STAMINA_DRAIN = 20, STAMINA_REGEN = 15;

function canon(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(canon);
  if (v && typeof v === 'object') {
    const o: Record<string, unknown> = {};
    for (const k of Object.keys(v as object).sort()) o[k] = canon((v as Record<string, unknown>)[k]);
    return o;
  }
  return v;
}
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const dist = (a: Vec, b: Vec) => Math.hypot(a.x - b.x, a.y - b.y);

type Edit = { t: 'reorder'; from: number; to: number } | { t: 'equip'; c: string; prev: string | null; next: string | null };

function initialState(seed: number): GameState {
  const m = generateMap(seed);
  const party: Character[] = CHARACTERS.map(c => ({ id: c.id, name: c.name, element: c.element, rarity: c.rarity, maxHp: c.maxHp, hp: c.maxHp, energy: 0, maxEnergy: c.maxEnergy, attack: c.attack, skillCd: c.skillCd, skillCdLeft: 0 }));
  return {
    format: 'kairoa-save', version: 1, tick: 0, paused: false, seed,
    map: { w: m.w, h: m.h, solid: m.solid },
    player: { pos: { ...m.spawn }, facing: { x: 0, y: 1 }, stamina: 100, maxStamina: 100, sprinting: false, attackCd: 0, switchCd: 0, move: { x: 0, y: 0 } },
    party, active: 0,
    enemies: m.enemies.map((e, i) => ({ id: i + 1, kind: e.kind, pos: { ...e.pos }, hp: ENEMIES[e.kind].maxHp, maxHp: ENEMIES[e.kind].maxHp, aura: null, frozenFor: 0, atkCd: 0 })),
    chests: m.chests.map((c, i) => ({ id: i + 1, pos: { ...c.pos }, opened: false, loot: c.loot })),
    inventory: { potion: 2, oak_blade: 1 },
    gems: 1600, pity: 0, owned: CHARACTERS.map(c => c.id),
    equipment: {}, lastPull: [], rng: (seed ^ 0x5bd1e995) >>> 0,
    extra: {},
  };
}

export function createEngine(seed: number, saveJson?: string): Engine {
  const state = initialState(seed);
  let unknown: Record<string, unknown> = {};
  let undoS: Edit[] = [], redoS: Edit[] = [];
  const subs = new Set<() => void>();
  const notify = () => subs.forEach(f => f());
  const KNOWN = new Set(Object.keys(state));

  const rand = () => { const r = mulberry(state.rng); const v = r(); state.rng = (state.rng + 0x6d2b79f5) >>> 0; return v; };
  const isSolid = (x: number, y: number) => {
    const { w, h, solid } = state.map; const i = Math.floor(x), j = Math.floor(y);
    return i < 0 || j < 0 || i >= w || j >= h || solid[j * w + i] === 1;
  };
  const act = () => state.party[state.active];
  const alive = (c: Character) => c.hp > 0;
  const defeated = () => state.party.every(c => !alive(c));
  const effAttack = (c: Character) => c.attack + (state.equipment[c.id] ? EQUIP_ATTACK_BONUS : 0);

  function tryMove(p: Vec, dx: number, dy: number) {
    if (!isSolid(p.x + dx, p.y)) p.x += dx;
    if (!isSolid(p.x, p.y + dy)) p.y += dy;
  }

  function hit(e: Enemy, dmg: number, el: Element | null) {
    let mult = 1;
    if (el) {
      const a = e.aura;
      if (a && a !== el) {
        const s = [a, el];
        if (s.includes('gale')) {
          const other = a === 'gale' ? el : a;
          for (const n of state.enemies) if (n !== e && n.hp > 0 && dist(n.pos, e.pos) <= 3) { n.hp -= Math.round(dmg * 0.5); n.aura = other; }
          e.aura = null;
        } else if (s.includes('ember') && s.includes('tide')) { mult = 1.5; e.aura = null; }
        else if (s.includes('frost') && s.includes('tide')) { e.frozenFor = 2; e.aura = null; }
        else if (s.includes('ember') && s.includes('frost')) { mult = 1.8; e.aura = null; }
        else e.aura = el;
      } else e.aura = el;
    }
    e.hp -= Math.round(dmg * mult);
  }
  const cull = () => { state.enemies = state.enemies.filter(e => e.hp > 0); };
  const inFront = (e: Enemy, range: number, cos: number) => {
    const d = dist(e.pos, state.player.pos);
    if (d > range) return false;
    if (d < 0.01) return true;
    const f = state.player.facing;
    return ((e.pos.x - state.player.pos.x) * f.x + (e.pos.y - state.player.pos.y) * f.y) / d >= cos;
  };
  const gain = (c: Character, n: number) => { c.energy = Math.min(c.maxEnergy, c.energy + n); };

  function applyEdit(ed: Edit, fwd: boolean) {
    if (ed.t === 'reorder') {
      const [from, to] = fwd ? [ed.from, ed.to] : [ed.to, ed.from];
      const id = act().id;
      const [c] = state.party.splice(from, 1); state.party.splice(to, 0, c);
      state.active = state.party.findIndex(x => x.id === id);
    } else {
      const [from, to] = fwd ? [ed.prev, ed.next] : [ed.next, ed.prev];
      if (to) { if ((state.inventory[to] ?? 0) > 0 && !(--state.inventory[to])) delete state.inventory[to]; }
      if (from) state.inventory[from] = (state.inventory[from] ?? 0) + 1;
      if (to) state.equipment[ed.c] = to; else delete state.equipment[ed.c];
    }
  }
  function record(ed: Edit) { undoS.push(ed); redoS = []; }

  function rollRarity(): 5 | 4 | 3 {
    const p = state.pity;
    if (p >= GACHA.hardPity - 1) return 5;
    const rate = p >= GACHA.softPity ? GACHA.baseRate5 + (p - GACHA.softPity + 1) * 0.06 : GACHA.baseRate5;
    const r = rand();
    if (r < rate) return 5;
    return r < rate + GACHA.rate4 ? 4 : 3;
  }

  function load(json: string): boolean {
    let o: any;
    try { o = JSON.parse(json); } catch { return false; }
    if (!o || o.format !== 'kairoa-save' || o.version !== 1 || !o.map || !Array.isArray(o.party) || !o.player) return false;
    const fresh = initialState(0);
    const unk: Record<string, unknown> = {};
    for (const k of Object.keys(o)) if (!KNOWN.has(k)) unk[k] = o[k];
    const next: any = { ...fresh };
    for (const k of KNOWN) if (k in o) next[k] = o[k];
    next.player = { ...fresh.player, ...o.player };
    for (const k of Object.keys(state)) delete (state as any)[k];
    Object.assign(state, clone(next));
    unknown = clone(unk); undoS = []; redoS = [];
    return true;
  }

  const handlers: { [C in CommandId]: (p: CommandPayload[C]) => void } = {
    'player.move': ({ dx, dy }) => {
      if (state.paused) return;
      const l = Math.hypot(dx, dy);
      const m = l > 1 ? { x: dx / l, y: dy / l } : { x: dx || 0, y: dy || 0 };
      state.player.move = m;
      if (l > 0.001) state.player.facing = { x: dx / l, y: dy / l };
    },
    'player.sprint': ({ on }) => { if (!state.paused) state.player.sprinting = on && state.player.stamina > 0; },
    'combat.attack': () => {
      const p = state.player; if (state.paused || p.attackCd > 0 || !alive(act())) return;
      p.attackCd = ATTACK_CD;
      for (const e of state.enemies) if (inFront(e, 1.8, 0.3)) hit(e, effAttack(act()), null);
      gain(act(), 3); cull();
    },
    'combat.skill': () => {
      const c = act(); if (state.paused || c.skillCdLeft > 0 || !alive(c)) return;
      c.skillCdLeft = c.skillCd;
      for (const e of state.enemies) if (inFront(e, 3, 0)) hit(e, effAttack(c) * 1.5, c.element);
      gain(c, 15); cull();
    },
    'combat.burst': () => {
      const c = act(); if (state.paused || !alive(c) || c.energy < c.maxEnergy) return;
      c.energy = 0;
      for (const e of [...state.enemies]) if (dist(e.pos, state.player.pos) <= 4) hit(e, effAttack(c) * 4, c.element);
      cull();
    },
    'party.switch': ({ index }) => {
      const t = state.party[index];
      if (state.paused || !t || index === state.active || !alive(t) || state.player.switchCd > 0) return;
      state.active = index; state.player.switchCd = SWITCH_CD;
    },
    'world.interact': () => {
      if (state.paused) return;
      let best: (typeof state.chests)[number] | null = null;
      for (const c of state.chests) if (!c.opened && dist(c.pos, state.player.pos) <= 1.5 && (!best || dist(c.pos, state.player.pos) < dist(best.pos, state.player.pos))) best = c;
      if (!best) return;
      best.opened = true; state.inventory[best.loot] = (state.inventory[best.loot] ?? 0) + 1;
    },
    'game.respawn': () => {
      if (!defeated()) return;
      const m = generateMap(state.seed);
      state.player.pos = { ...m.spawn }; state.player.move = { x: 0, y: 0 }; state.player.sprinting = false;
      for (const c of state.party) c.hp = Math.ceil(c.maxHp * SPAWN_HP_FRAC);
      state.active = 0; state.paused = false;
    },
    'gacha.pull': ({ count }) => {
      const n = count === 10 ? 10 : 1;
      if (state.gems < GACHA.cost * n) return;
      state.gems -= GACHA.cost * n; state.lastPull = [];
      for (let i = 0; i < n; i++) {
        const rar = rollRarity();
        const pool = rar === 5 ? GACHA.five : rar === 4 ? GACHA.four : GACHA.three;
        const id = pool[Math.floor(rand() * pool.length)];
        state.pity = rar === 5 ? 0 : state.pity + 1;
        state.lastPull.push(id);
        state.inventory[id] = (state.inventory[id] ?? 0) + 1;
        if (CHARACTERS.some(c => c.id === id) && !state.owned.includes(id)) state.owned.push(id);
      }
    },
    'file.save': () => { engine.lastSave = serialize(); },
    'file.load': ({ json }) => { load(json); },
    'edit.undo': () => { const e = undoS.pop(); if (e) { applyEdit(e, false); redoS.push(e); } },
    'edit.redo': () => { const e = redoS.pop(); if (e) { applyEdit(e, true); undoS.push(e); } },
    'party.reorder': ({ from, to }) => {
      const n = state.party.length;
      if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < 0 || from >= n || to >= n || from === to) return;
      applyEdit({ t: 'reorder', from, to }, true); record({ t: 'reorder', from, to });
    },
    'menu.toggle': () => { state.paused = !state.paused; },
  };

  function sub(dt: number) {
    const p = state.player;
    p.attackCd = Math.max(0, p.attackCd - dt); p.switchCd = Math.max(0, p.switchCd - dt);
    for (const c of state.party) c.skillCdLeft = Math.max(0, c.skillCdLeft - dt);
    const moving = Math.hypot(p.move.x, p.move.y) > 0.001 && !defeated();
    if (p.sprinting && moving) {
      p.stamina = Math.max(0, p.stamina - STAMINA_DRAIN * dt);
      if (p.stamina <= 0) p.sprinting = false;
    } else if (!p.sprinting) p.stamina = Math.min(p.maxStamina, p.stamina + STAMINA_REGEN * dt);
    if (moving) {
      const sp = p.sprinting ? SPRINT_SPEED : WALK_SPEED;
      tryMove(p.pos, p.move.x * sp * dt, p.move.y * sp * dt);
    }
    for (const e of state.enemies) {
      const d = ENEMIES[e.kind]; if (!d) continue;
      e.atkCd = Math.max(0, e.atkCd - dt);
      if (e.frozenFor > 0) { e.frozenFor = Math.max(0, e.frozenFor - dt); continue; }
      if (defeated()) continue;
      const dd = dist(e.pos, p.pos);
      if (dd > d.aggro) continue;
      if (dd > 1) {
        const s = d.speed * dt;
        tryMove(e.pos, ((p.pos.x - e.pos.x) / dd) * s, ((p.pos.y - e.pos.y) / dd) * s);
      } else if (e.atkCd <= 0) {
        e.atkCd = d.atkInterval;
        const c = act(); c.hp = Math.max(0, c.hp - d.damage);
        if (!alive(c)) { const i = state.party.findIndex(alive); if (i >= 0) state.active = i; }
      }
    }
  }

  function serialize(): string { return JSON.stringify(canon({ ...unknown, ...clone(state) })); }

  const engine: Engine = {
    state,
    lastSave: '',
    dispatch(id, payload) { (handlers[id] as (p: unknown) => void)(payload ?? {}); notify(); },
    step(dt) {
      if (state.paused || !(dt > 0)) return;
      let left = dt;
      while (left > 1e-9) { const d = Math.min(0.05, left); sub(d); left -= d; }
      state.tick++; notify();
    },
    serialize,
    subscribe(fn) { subs.add(fn); return () => { subs.delete(fn); }; },
    equip(charId, itemId) {
      if (!state.party.some(c => c.id === charId)) return false;
      const prev = state.equipment[charId] ?? null;
      if (itemId === prev) return false;
      if (itemId && (!EQUIPPABLE.includes(itemId) || !(state.inventory[itemId] > 0))) return false;
      const ed: Edit = { t: 'equip', c: charId, prev, next: itemId };
      applyEdit(ed, true); record(ed); notify(); return true;
    },
  };
  if (saveJson) load(saveJson);
  return engine;
}
