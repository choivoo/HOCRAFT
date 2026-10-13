import { expect, type Page, type Locator } from '@playwright/test';
import { mkdirSync } from 'node:fs';

mkdirSync('e2e/shots', { recursive: true });

export async function boot(page: Page, seed?: number) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(seed === undefined ? '/' : `/?seed=${seed}`);
  await page.waitForFunction(() => !!(window as any).__kairoa, null, {
    timeout: 10_000,
  }).catch(() => { throw new Error('CONTRACT: window.__kairoa (Engine) was not set by the UI. Errors: ' + errors.join('|')); });
  return errors;
}
/** Evaluate against the engine's live state; fn must return JSON-serialisable data. */
export const st = <T>(page: Page, fn: (s: any) => T): Promise<T> =>
  page.evaluate(`(${fn.toString()})(window.__kairoa.state)`) as Promise<T>;
export const dispatch = (page: Page, id: string, payload: unknown = {}) =>
  page.evaluate(([i, p]) => (window as any).__kairoa.dispatch(i, p), [id, payload] as const);
export const step = (page: Page, dt: number, n = 1) =>
  page.evaluate(([d, k]) => { for (let i = 0; i < k; i++) (window as any).__kairoa.step(d); }, [dt, n] as const);

/** Visible, enabled-or-not control for a command (optionally data-index). */
export function ctl(page: Page, cmd: string, index?: number): Locator {
  const sel = `[data-cmd="${cmd}"]` + (index === undefined ? '' : `[data-index="${index}"]`);
  return page.locator(sel).locator('visible=true').first();
}
export async function tap(page: Page, cmd: string, index?: number) {
  const l = ctl(page, cmd, index);
  await expect(l, `control [data-cmd="${cmd}"${index === undefined ? '' : ' data-index=' + index}] must be visible`).toBeVisible();
  await l.tap();
}
export async function openMenu(page: Page) {
  const open = await page.evaluate(() => (window as any).__kairoa.state.paused);
  if (!open) await tap(page, 'menu.toggle');
  expect(await st(page, (s) => s.paused)).toBe(true);
}
export async function closeMenu(page: Page) {
  if (await st(page, (s) => s.paused)) await tap(page, 'menu.toggle');
}

/** Real touch drag via CDP so pointer/touch handlers on the joystick fire. */
export async function touchDrag(page: Page, from: { x: number; y: number }, to: { x: number; y: number }, holdMs = 400) {
  const c = await page.context().newCDPSession(page);
  const send = (type: string, pt?: { x: number; y: number }) =>
    c.send('Input.dispatchTouchEvent', { type, touchPoints: pt ? [{ x: pt.x, y: pt.y, id: 1 }] : [] });
  await send('touchStart', from);
  for (let i = 1; i <= 6; i++) {
    await send('touchMove', { x: from.x + ((to.x - from.x) * i) / 6, y: from.y + ((to.y - from.y) * i) / 6 });
    await page.waitForTimeout(20);
  }
  await page.waitForTimeout(holdMs);
  return async () => { await send('touchEnd'); await c.detach(); };
}

export async function box(l: Locator) {
  const b = await l.boundingBox();
  if (!b) throw new Error('no bounding box');
  return b;
}
export const shot = (page: Page, name: string, project: string) =>
  page.screenshot({ path: `e2e/shots/${name}-${project}.png` });

/** Seed state helper: put a hostile enemy at a given offset from player, others removed. */
export const spawnEnemy = (page: Page, dx: number, dy: number, hp = 50) =>
  page.evaluate(([x, y, h]) => {
    const s = (window as any).__kairoa.state;
    s.enemies.length = 0;
    s.enemies.push({ id: 9001, kind: 'test', pos: { x: s.player.pos.x + x, y: s.player.pos.y + y }, hp: h, maxHp: h, aura: null, frozenFor: 0, atkCd: 99 });
  }, [dx, dy, hp] as const);
