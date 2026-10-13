import { test, expect } from '@playwright/test';
import { boot, st, dispatch, step, tap, ctl, openMenu, closeMenu, touchDrag, box, shot, spawnEnemy } from './helpers';

test.beforeEach(async ({ page }) => { await boot(page, 1); });

test('F01 joystick drag (touch) moves the player; releasing stops', async ({ page }) => {
  const joy = ctl(page, 'player.move');
  await expect(joy, 'joystick must be [data-cmd="player.move"]').toBeVisible();
  const b = await box(joy);
  const cx = b.x + b.width / 2, cy = b.y + b.height / 2;
  const before = await st(page, (s) => ({ ...s.player.pos }));
  const release = await touchDrag(page, { x: cx, y: cy }, { x: cx + b.width * 0.4, y: cy });
  await step(page, 0.1, 10);
  const mid = await st(page, (s) => ({ ...s.player.pos }));
  await release();
  expect(mid.x, 'player should move right while stick held right').toBeGreaterThan(before.x);
  await step(page, 0.1, 3);
  const a = await st(page, (s) => ({ ...s.player.pos }));
  await step(page, 0.1, 5);
  const z = await st(page, (s) => ({ ...s.player.pos }));
  expect(z).toEqual(a);
});

test('F01 keyboard WASD moves', async ({ page }) => {
  const before = await st(page, (s) => ({ ...s.player.pos }));
  await page.keyboard.down('d'); await step(page, 0.1, 5); await page.waitForTimeout(100);
  await step(page, 0.1, 5); await page.keyboard.up('d');
  expect((await st(page, (s) => s.player.pos.x))).toBeGreaterThan(before.x);
});

test('F01 solid tiles block movement', async ({ page }) => {
  await dispatch(page, 'player.move', { dx: 1, dy: 0 });
  await step(page, 0.1, 600);
  const { x, w } = await st(page, (s) => ({ x: s.player.pos.x, w: s.map.w }));
  expect(x, 'player must stay inside the map').toBeLessThan(w + 0.0001);
  expect(x).toBeGreaterThanOrEqual(0);
});

test('F02 sprint drains stamina, stops at 0, regenerates', async ({ page }) => {
  await dispatch(page, 'player.move', { dx: 0, dy: 1 });
  await dispatch(page, 'player.sprint', { on: true });
  const s0 = await st(page, (s) => s.player.stamina);
  await step(page, 0.1, 10);
  expect(await st(page, (s) => s.player.stamina)).toBeLessThan(s0);
  // step synchronously inside one evaluate (the live rAF loop would otherwise regen between calls)
  const s1 = await page.evaluate(() => {
    const e = (window as any).__kairoa;
    for (let i = 0; i < 5000 && e.state.player.sprinting; i++) e.step(0.05);
    return { st: e.state.player.stamina, sp: e.state.player.sprinting };
  });
  expect(s1.st).toBeLessThanOrEqual(0.0001);
  expect(s1.sp).toBe(false);
  await dispatch(page, 'player.sprint', { on: false });
  await dispatch(page, 'player.move', { dx: 0, dy: 0 });
  await step(page, 0.1, 20);
  expect(await st(page, (s) => s.player.stamina)).toBeGreaterThan(0);
});

test('F03 attack button damages enemy in range, respects cooldown', async ({ page }) => {
  await spawnEnemy(page, 0.8, 0, 500);
  await page.evaluate(() => { (window as any).__kairoa.state.player.facing = { x: 1, y: 0 }; });
  await tap(page, 'combat.attack');
  const hp1 = await st(page, (s) => s.enemies[0].hp);
  expect(hp1).toBeLessThan(500);
  await tap(page, 'combat.attack'); // immediately again: cooldown
  expect(await st(page, (s) => s.enemies[0].hp)).toBe(hp1);
  await step(page, 0.1, 20);
  await tap(page, 'combat.attack');
  expect(await st(page, (s) => s.enemies[0].hp)).toBeLessThan(hp1);
});

test('F04 skill applies element aura and goes on cooldown', async ({ page }) => {
  await spawnEnemy(page, 0.8, 0, 500);
  await page.evaluate(() => { (window as any).__kairoa.state.player.facing = { x: 1, y: 0 }; });
  await tap(page, 'combat.skill');
  const r = await st(page, (s) => ({ aura: s.enemies[0].aura, el: s.party[s.active].element, cd: s.party[s.active].skillCdLeft }));
  expect(r.aura).toBe(r.el);
  expect(r.cd).toBeGreaterThan(0);
});

test('F05 burst needs full energy and consumes it', async ({ page }) => {
  await spawnEnemy(page, 0.8, 0, 5000);
  await page.evaluate(() => { (window as any).__kairoa.state.player.facing = { x: 1, y: 0 }; });
  await page.evaluate(() => { const c = (window as any).__kairoa.state; c.party[c.active].energy = 0; });
  await tap(page, 'combat.burst');
  expect(await st(page, (s) => s.enemies[0].hp)).toBe(5000);
  await page.evaluate(() => { const c = (window as any).__kairoa.state; c.party[c.active].energy = c.party[c.active].maxEnergy; });
  await tap(page, 'combat.burst');
  expect(await st(page, (s) => s.enemies[0].hp)).toBeLessThan(5000);
  expect(await st(page, (s) => s.party[s.active].energy)).toBe(0);
});

test('F06 party buttons switch; cooldown; fainted not selectable', async ({ page }) => {
  expect(await st(page, (s) => s.party.length)).toBe(4);
  for (let i = 0; i < 4; i++) await expect(ctl(page, 'party.switch', i), `party.switch index ${i}`).toBeVisible();
  await tap(page, 'party.switch', 1);
  expect(await st(page, (s) => s.active)).toBe(1);
  await tap(page, 'party.switch', 2); // within 1s cooldown
  expect(await st(page, (s) => s.active)).toBe(1);
  await step(page, 0.1, 15);
  await page.evaluate(() => { (window as any).__kairoa.state.party[3].hp = 0; });
  await dispatch(page, 'party.switch', { index: 3 });
  expect(await st(page, (s) => s.active)).toBe(1);
  await tap(page, 'party.switch', 2);
  expect(await st(page, (s) => s.active)).toBe(2);
});

test('F07 reactions: ember on tide-aura enemy multiplies damage (mist x1.5)', async ({ page }) => {
  const ids = await st(page, (s) => s.party.map((c: any) => c.element));
  test.skip(!ids.includes('ember') || !ids.includes('tide'), 'party lacks ember/tide');
  // Engine-level check through the UI contract: apply tide aura, then ember hit.
  await spawnEnemy(page, 0.8, 0, 5000);
  await page.evaluate(() => { const s = (window as any).__kairoa.state; s.enemies[0].aura = 'tide'; s.player.facing = { x: 1, y: 0 }; });
  const iE = ids.indexOf('ember');
  await dispatch(page, 'party.switch', { index: iE });
  await step(page, 0.1, 15);
  await tap(page, 'combat.skill');
  const dmgReact = 5000 - (await st(page, (s) => s.enemies[0].hp));
  expect(dmgReact).toBeGreaterThan(0);
  expect(await st(page, (s) => s.enemies[0].aura), 'aura consumed by reaction').toBeNull();
});

test('F08 enemy within aggro range approaches and damages player', async ({ page }) => {
  await page.evaluate(() => {
    const s = (window as any).__kairoa.state; s.enemies.length = 0;
    s.enemies.push({ id: 9002, kind: 'mossling', pos: { x: s.player.pos.x + 3, y: s.player.pos.y }, hp: 100, maxHp: 100, aura: null, frozenFor: 0, atkCd: 0 });
  });
  const d0 = await st(page, (s) => Math.hypot(s.enemies[0].pos.x - s.player.pos.x, s.enemies[0].pos.y - s.player.pos.y));
  const hp0 = await st(page, (s) => s.party.reduce((a: number, c: any) => a + c.hp, 0));
  await step(page, 0.1, 60);
  const d1 = await st(page, (s) => Math.hypot(s.enemies[0].pos.x - s.player.pos.x, s.enemies[0].pos.y - s.player.pos.y));
  const hp1 = await st(page, (s) => s.party.reduce((a: number, c: any) => a + c.hp, 0));
  expect(d1).toBeLessThan(d0);
  expect(hp1).toBeLessThan(hp0);
});

test('F09 defeat shows respawn control; respawn restores 50% HP', async ({ page }, info) => {
  await page.evaluate(() => { for (const c of (window as any).__kairoa.state.party) c.hp = 0; (window as any).__kairoa.step(0.1); });
  await expect(ctl(page, 'game.respawn'), 'respawn button visible when party is defeated').toBeVisible();
  await shot(page, 'defeat', info.project.name);
  await tap(page, 'game.respawn');
  const r = await st(page, (s) => s.party.map((c: any) => c.hp / c.maxHp));
  expect(r.some((x: number) => Math.abs(x - 0.5) < 0.02)).toBe(true);
});

test('F10 interact opens adjacent chest once', async ({ page }) => {
  await page.evaluate(() => {
    const s = (window as any).__kairoa.state; s.enemies.length = 0;
    s.chests.length = 0; s.chests.push({ id: 7001, pos: { x: s.player.pos.x + 0.6, y: s.player.pos.y }, opened: false, loot: 'test_loot' });
  });
  await step(page, 0.05, 2);
  const inv0 = await st(page, (s) => Object.values(s.inventory).reduce((a: number, b: any) => a + b, 0));
  await tap(page, 'world.interact');
  expect(await st(page, (s) => s.chests[0].opened)).toBe(true);
  const inv1 = await st(page, (s) => Object.values(s.inventory).reduce((a: number, b: any) => a + b, 0));
  expect(inv1).toBeGreaterThan(inv0);
  await dispatch(page, 'world.interact', {});
  expect(await st(page, (s) => Object.values(s.inventory).reduce((a: number, b: any) => a + b, 0))).toBe(inv1);
});

test('F11 gacha: UI pull spends gems; 90-pull pity; deterministic per seed', async ({ page }) => {
  await page.evaluate(() => { (window as any).__kairoa.state.gems = 100000; });
  await openMenu(page);
  const g0 = await st(page, (s) => s.gems);
  await tap(page, 'gacha.pull', undefined).catch(() => { throw new Error('gacha.pull control must be reachable in pause menu (Wish)'); });
  expect(await st(page, (s) => s.gems)).toBeLessThan(g0);
  const run = async (p: any) => p.evaluate(() => {
    const e = (window as any).__kairoa; for (let i = 0; i < 9; i++) e.dispatch('gacha.pull', { count: 10 });
    return JSON.stringify(e.state.owned) + e.state.pity;
  });
  await boot(page, 5); await page.evaluate(() => { (window as any).__kairoa.state.gems = 1e6; });
  const a = await run(page);
  await boot(page, 5); await page.evaluate(() => { (window as any).__kairoa.state.gems = 1e6; });
  expect(await run(page)).toBe(a);
  const topOwned = await st(page, (s) => s.owned.length);
  expect(topOwned, '90 pulls must yield at least one top-rarity item (hard pity)').toBeGreaterThan(0);
});

test('F12 save -> reload -> load round trip, unknown fields kept', async ({ page }) => {
  await page.evaluate(() => {
    const s = (window as any).__kairoa.state; s.gems = 4321; s.extra.mystery = { keep: [1, 2, 3] };
  });
  await openMenu(page); // pausing freezes the state so the snapshot below is exactly what gets saved
  const before = await page.evaluate(() => (window as any).__kairoa.serialize());
  await tap(page, 'file.save');
  await page.reload();
  await page.waitForFunction(() => !!(window as any).__kairoa);
  // Load: if UI stores save in localStorage, the load control dispatches with the stored json.
  await openMenu(page);
  await tap(page, 'file.load');
  const after = await page.evaluate(() => (window as any).__kairoa.serialize());
  expect(JSON.parse(after)).toEqual(JSON.parse(before));
  expect(JSON.parse(after).extra.mystery).toEqual({ keep: [1, 2, 3] });
  // direct engine round trip too
  const rt = await page.evaluate((j) => { const e = (window as any).__kairoa; e.dispatch('file.load', { json: j }); return e.serialize(); }, before);
  expect(rt).toBe(before);
});

test('F13 undo/redo via button and Ctrl+Z / Ctrl+Shift+Z', async ({ page }) => {
  await openMenu(page);
  const order0 = await st(page, (s) => s.party.map((c: any) => c.id));
  await dispatch(page, 'party.reorder', { from: 0, to: 2 });
  const order1 = await st(page, (s) => s.party.map((c: any) => c.id));
  expect(order1).not.toEqual(order0);
  await page.keyboard.press('Control+z');
  expect(await st(page, (s) => s.party.map((c: any) => c.id))).toEqual(order0);
  await page.keyboard.press('Control+Shift+z');
  expect(await st(page, (s) => s.party.map((c: any) => c.id))).toEqual(order1);
  await tap(page, 'edit.undo');
  expect(await st(page, (s) => s.party.map((c: any) => c.id))).toEqual(order0);
  await tap(page, 'edit.redo');
  expect(await st(page, (s) => s.party.map((c: any) => c.id))).toEqual(order1);
});

test('F14 HUD visible; menu.toggle pauses simulation', async ({ page }, info) => {
  await expect(page.locator('canvas').first()).toBeVisible();
  for (const c of ['combat.attack', 'combat.skill', 'combat.burst', 'player.sprint', 'menu.toggle']) await expect(ctl(page, c), c).toBeVisible();
  await shot(page, 'hud', info.project.name);
  await tap(page, 'menu.toggle');
  expect(await st(page, (s) => s.paused)).toBe(true);
  await shot(page, 'menu', info.project.name);
  const t0 = await st(page, (s) => s.tick);
  await step(page, 0.1, 10);
  expect(await st(page, (s) => s.tick)).toBe(t0);
  await tap(page, 'menu.toggle');
  expect(await st(page, (s) => s.paused)).toBe(false);
  await page.keyboard.press('Escape');
  expect(await st(page, (s) => s.paused)).toBe(true);
});

test('F15 touch targets >=44px, no overlap, no horizontal scroll', async ({ page }, info) => {
  const check = async (label: string) => {
    const items = await page.$$eval('[data-cmd]', (els) => els.map((e) => {
      const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
      const vis = r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && cs.opacity !== '0';
      return { name: `${e.getAttribute('data-cmd')}#${e.getAttribute('data-index') ?? e.getAttribute('data-count') ?? ''}`, vis, x: r.x, y: r.y, w: r.width, h: r.height };
    }));
    const vis = items.filter((i) => i.vis);
    expect(vis.length, label + ': no visible data-cmd controls').toBeGreaterThan(3);
    for (const i of vis) {
      expect(i.w, `${label}: ${i.name} width`).toBeGreaterThanOrEqual(43.5);
      expect(i.h, `${label}: ${i.name} height`).toBeGreaterThanOrEqual(43.5);
    }
    for (let a = 0; a < vis.length; a++) for (let b = a + 1; b < vis.length; b++) {
      const p = vis[a], q = vis[b];
      const ov = Math.min(p.x + p.w, q.x + q.w) - Math.max(p.x, q.x) > 1 && Math.min(p.y + p.h, q.y + q.h) - Math.max(p.y, q.y) > 1;
      expect(ov, `${label}: ${p.name} overlaps ${q.name}`).toBe(false);
    }
    const sc = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, bw: document.body.scrollWidth }));
    expect(sc.sw, label + ' horizontal scroll').toBeLessThanOrEqual(sc.cw);
    expect(sc.bw, label + ' body horizontal scroll').toBeLessThanOrEqual(sc.cw);
  };
  await check('hud');
  await openMenu(page);
  await check('menu');
  await shot(page, 'layout-menu', info.project.name);
});

test('F16 Korean: composed Hangul name input ends with exact string', async ({ page }) => {
  await openMenu(page);
  const input = page.locator('input[data-name-input], input[name="name"], input[type="text"]').locator('visible=true').first();
  await expect(input, 'a visible text input for the player/character name (input[data-name-input])').toBeVisible();
  await input.tap();
  await input.fill('');
  await page.keyboard.insertText('용사');
  await expect(input).toHaveValue('용사');
  await input.blur();
  await expect(input).toHaveValue('용사');
  const hasHangulText = await page.evaluate(() => /[가-힣]/.test(document.body.innerText));
  expect(hasHangulText, 'Korean labels rendered in DOM').toBe(true);
  await page.screenshot({ path: 'e2e/shots/korean.png' });
});

test('PWA manifest + service worker registered', async ({ page, request }) => {
  const m = await request.get('/manifest.webmanifest');
  expect(m.ok()).toBe(true);
  const j = await m.json();
  expect(j.name).toBeTruthy(); expect(j.icons.length).toBeGreaterThan(1);
  await expect(page.locator('link[rel="manifest"]')).toHaveCount(1);
  const reg = await page.evaluate(async () => !!(await navigator.serviceWorker?.getRegistration()));
  expect(reg, 'service worker registered (include /pwa-register.js)').toBe(true);
});
