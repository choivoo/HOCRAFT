import { describe, expect, it } from 'vitest';
import { createEngine } from '../src/core';
import { generateMap } from '../src/data';

const near = (e: ReturnType<typeof createEngine>, i = 0) => {
  const en = e.state.enemies[i]; e.state.enemies = [en];
  e.state.player.pos = { x: en.pos.x - 1.2, y: en.pos.y }; e.state.player.facing = { x: 1, y: 0 }; return en;
};
const clearAround = (e: ReturnType<typeof createEngine>) => { e.state.enemies = []; };

describe('core', () => {
  it('F01 move changes position by speed*dt and is blocked by solids', () => {
    const e = createEngine(1); clearAround(e); const x0 = e.state.player.pos.x;
    e.dispatch('player.move', { dx: 1, dy: 0 }); e.step(0.25);
    expect(e.state.player.pos.x).toBeCloseTo(x0 + 1, 5);
    const { w } = e.state.map; e.state.player.pos = { x: w - 1.5, y: 10.5 };
    for (let i = 0; i < 20; i++) e.step(0.1);
    expect(e.state.player.pos.x).toBeLessThan(w - 1);
  });
  it('F02 sprint drains stamina to 0 then regenerates', () => {
    const e = createEngine(1); clearAround(e);
    e.dispatch('player.move', { dx: 0, dy: 1 }); e.dispatch('player.sprint', { on: true });
    for (let i = 0; i < 60; i++) { e.step(0.1); if (e.state.player.pos.y > 40) e.state.player.pos.y = 20.5; }
    expect(e.state.player.stamina).toBeLessThan(16); expect(e.state.player.sprinting).toBe(false);
    e.dispatch('player.move', { dx: 0, dy: 0 }); e.step(1);
    expect(e.state.player.stamina).toBeGreaterThan(10);
  });
  it('F03 attack damages in range+facing with cooldown', () => {
    const e = createEngine(1); const en = near(e); const hp = en.hp;
    e.dispatch('combat.attack', {}); expect(en.hp).toBeLessThan(hp);
    const h2 = en.hp; e.dispatch('combat.attack', {}); expect(en.hp).toBe(h2);
    e.step(0.6); e.state.player.facing = { x: -1, y: 0 }; e.dispatch('combat.attack', {}); expect(en.hp).toBe(h2);
  });
  it('F04 skill applies element with cooldown', () => {
    const e = createEngine(1); const en = near(e);
    e.dispatch('combat.skill', {}); expect(en.aura).toBe('ember'); expect(e.state.party[0].skillCdLeft).toBeGreaterThan(0);
    const h = en.hp; e.dispatch('combat.skill', {}); expect(en.hp).toBe(h);
  });
  it('F05 burst needs full energy and consumes it', () => {
    const e = createEngine(1); const en = near(e); en.hp = en.maxHp = 9999;
    e.dispatch('combat.burst', {}); expect(en.hp).toBe(9999);
    e.state.party[0].energy = e.state.party[0].maxEnergy; e.dispatch('combat.burst', {});
    expect(e.state.party[0].energy).toBe(0); expect(en.hp).toBeLessThan(9999 - 50);
  });
  it('F06 party switch with cooldown, fainted excluded', () => {
    const e = createEngine(1); clearAround(e);
    e.state.party[2].hp = 0; e.dispatch('party.switch', { index: 2 }); expect(e.state.active).toBe(0);
    e.dispatch('party.switch', { index: 1 }); expect(e.state.active).toBe(1);
    e.dispatch('party.switch', { index: 3 }); expect(e.state.active).toBe(1);
    e.step(1.01); e.dispatch('party.switch', { index: 3 }); expect(e.state.active).toBe(3);
  });
  it('F07 reactions', () => {
    const mk = (a: any, b: any) => {
      const e = createEngine(1); const en = near(e); en.hp = en.maxHp = 9999; en.aura = a;
      e.state.party[0].element = b; e.dispatch('combat.skill', {}); return { en, base: 9999 - e.state.party[0].attack * 1.5 };
    };
    let r = mk('tide', 'ember'); expect(9999 - r.en.hp).toBe(Math.round(18 * 1.5 * 1.5)); expect(r.en.aura).toBeNull();
    r = mk('ember', 'frost'); expect(9999 - r.en.hp).toBe(Math.round(27 * 1.8));
    r = mk('tide', 'frost'); expect(r.en.frozenFor).toBe(2);
    const e = createEngine(1); const a = near(e); const b = { ...a, id: 99, pos: { x: a.pos.x - 2.5, y: a.pos.y }, aura: null, hp: 500, maxHp: 500 } as any;
    a.aura = 'frost'; a.hp = 500; e.state.enemies = [a, b]; e.state.party[0].element = 'gale'; e.dispatch('combat.skill', {});
    expect(b.hp).toBeLessThan(500); expect(b.aura).toBe('frost');
  });
  it('F08 enemies chase and attack', () => {
    const e = createEngine(1); const en = e.state.enemies[0]; e.state.enemies = [en];
    e.state.player.pos = { x: en.pos.x - 4, y: en.pos.y }; const d0 = Math.abs(en.pos.x - e.state.player.pos.x);
    e.step(0.5); expect(Math.hypot(en.pos.x - e.state.player.pos.x, en.pos.y - e.state.player.pos.y)).toBeLessThan(d0 + 0.01);
    e.state.player.pos = { x: en.pos.x, y: en.pos.y }; const hp = e.state.party[0].hp; e.step(0.1);
    expect(e.state.party[0].hp).toBeLessThan(hp);
  });
  it('F09 defeat and respawn at 50% HP', () => {
    const e = createEngine(1); clearAround(e); const sp = generateMap(1).spawn;
    e.dispatch('game.respawn', {}); expect(e.state.party[0].hp).toBe(e.state.party[0].maxHp);
    e.state.party.forEach(c => (c.hp = 0)); e.state.player.pos = { x: 5.5, y: 5.5 }; e.dispatch('game.respawn', {});
    expect(e.state.player.pos).toEqual(sp); expect(e.state.party[0].hp).toBe(Math.ceil(e.state.party[0].maxHp / 2));
  });
  it('F10 chest opens once', () => {
    const e = createEngine(1); clearAround(e); const c = e.state.chests[0]; e.state.player.pos = { x: c.pos.x + 1, y: c.pos.y };
    const n = e.state.inventory[c.loot] ?? 0; e.dispatch('world.interact', {}); e.dispatch('world.interact', {});
    expect(c.opened).toBe(true); expect(e.state.inventory[c.loot]).toBe(n + 1);
  });
  it('F11 gacha spends gems, hard pity at 90, deterministic', () => {
    const run = () => { const e = createEngine(7); const r: string[] = []; for (let i = 0; i < 9; i++) { e.state.gems = 5000; e.dispatch('gacha.pull', { count: 10 }); r.push(...e.state.lastPull); } return { r, e }; };
    const a = run(), b = run(); expect(a.r).toEqual(b.r);
    const e = createEngine(7); e.dispatch('gacha.pull', { count: 10 }); expect(e.state.gems).toBe(1600 - 1600);
    e.dispatch('gacha.pull', { count: 1 }); expect(e.state.gems).toBe(0);
    const f = createEngine(9); f.state.pity = 89; f.dispatch('gacha.pull', { count: 1 });
    expect(['pyra', 'zephyr', 'starglass']).toContain(f.state.lastPull[0]); expect(f.state.pity).toBe(0);
  });
  it('F12 save/load round trip preserves unknown fields', () => {
    const e = createEngine(3); const o = JSON.parse(e.serialize()); o.mystery = { k: [1] };
    const f = createEngine(99, JSON.stringify(o)); const s = f.serialize();
    expect(JSON.parse(s).mystery).toEqual({ k: [1] });
    const g = createEngine(1); g.dispatch('file.load', { json: s }); expect(g.serialize()).toBe(s);
    g.dispatch('file.save', {}); expect(g.lastSave).toBe(s);
  });
  it('F13 undo/redo party reorder and equipment', () => {
    const e = createEngine(1); const ids = () => e.state.party.map(c => c.id);
    const before = ids(); e.dispatch('party.reorder', { from: 0, to: 2 }); expect(ids()).not.toEqual(before);
    expect(e.state.party[e.state.active].id).toBe('pyra');
    e.dispatch('edit.undo', {}); expect(ids()).toEqual(before); e.dispatch('edit.redo', {}); expect(ids()[2]).toBe('pyra');
    expect(e.equip('nerei', 'oak_blade')).toBe(true); expect(e.state.equipment.nerei).toBe('oak_blade'); expect(e.state.inventory.oak_blade).toBeUndefined();
    e.dispatch('edit.undo', {}); expect(e.state.equipment.nerei).toBeUndefined(); expect(e.state.inventory.oak_blade).toBe(1);
    e.dispatch('edit.redo', {}); expect(e.state.equipment.nerei).toBe('oak_blade');
  });
  it('F14 pause makes step a no-op', () => {
    const e = createEngine(1); clearAround(e); e.dispatch('player.move', { dx: 1, dy: 0 }); e.dispatch('menu.toggle', {});
    const x = e.state.player.pos.x, t = e.state.tick; e.step(1); expect(e.state.player.pos.x).toBe(x); expect(e.state.tick).toBe(t);
    e.dispatch('menu.toggle', {}); e.step(0.1); expect(e.state.player.pos.x).toBeGreaterThan(x);
  });
  const samples = (import.meta as any).glob('../samples/*.json', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
  const files = Object.keys(samples);
  it('has >=5 samples', () => expect(files.length).toBeGreaterThanOrEqual(5));
  for (const f of files) it(`sample ${f} round-trips`, () => {
    const txt = samples[f].trim();
    const e = createEngine(0, txt); expect(e.serialize()).toBe(txt);
  });
});
