# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: kairoa.spec.ts >> F02 sprint drains stamina, stops at 0, regenerates
- Location: e2e/kairoa.spec.ts:39:1

# Error details

```
Error: expect(received).toBeLessThanOrEqual(expected)

Expected: <= 0.0001
Received:    2.7495000000000003
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic:
    - button "지도" [ref=e3]
    - button "일시정지" [ref=e5] [cursor=pointer]
    - generic: 카이로아 들판
    - slider "이동 조이스틱" [ref=e8]
    - button "공격" [ref=e9] [cursor=pointer]
    - button "원소 기술" [ref=e13] [cursor=pointer]:
      - generic [ref=e16]: 기술
    - button "필살기" [ref=e17] [cursor=pointer]:
      - generic [ref=e20]: 필살
    - button "질주" [ref=e21] [cursor=pointer]
    - button "Pyra 불꽃" [ref=e25] [cursor=pointer]:
      - generic [ref=e26]: Pyra
    - button "Nerei 물결" [ref=e30] [cursor=pointer]:
      - generic [ref=e31]: Nerei
    - button "Glacia 서리" [ref=e35] [cursor=pointer]:
      - generic [ref=e36]: Glacia
    - button "Zephyr 바람" [ref=e40] [cursor=pointer]:
      - generic [ref=e41]: Zephyr
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { boot, st, dispatch, step, tap, ctl, openMenu, closeMenu, touchDrag, box, shot, spawnEnemy } from './helpers';
  3   | 
  4   | test.beforeEach(async ({ page }) => { await boot(page, 1); });
  5   | 
  6   | test('F01 joystick drag (touch) moves the player; releasing stops', async ({ page }) => {
  7   |   const joy = ctl(page, 'player.move');
  8   |   await expect(joy, 'joystick must be [data-cmd="player.move"]').toBeVisible();
  9   |   const b = await box(joy);
  10  |   const cx = b.x + b.width / 2, cy = b.y + b.height / 2;
  11  |   const before = await st(page, (s) => ({ ...s.player.pos }));
  12  |   const release = await touchDrag(page, { x: cx, y: cy }, { x: cx + b.width * 0.4, y: cy });
  13  |   await step(page, 0.1, 10);
  14  |   const mid = await st(page, (s) => ({ ...s.player.pos }));
  15  |   await release();
  16  |   expect(mid.x, 'player should move right while stick held right').toBeGreaterThan(before.x);
  17  |   await step(page, 0.1, 3);
  18  |   const a = await st(page, (s) => ({ ...s.player.pos }));
  19  |   await step(page, 0.1, 5);
  20  |   const z = await st(page, (s) => ({ ...s.player.pos }));
  21  |   expect(z).toEqual(a);
  22  | });
  23  | 
  24  | test('F01 keyboard WASD moves', async ({ page }) => {
  25  |   const before = await st(page, (s) => ({ ...s.player.pos }));
  26  |   await page.keyboard.down('d'); await step(page, 0.1, 5); await page.waitForTimeout(100);
  27  |   await step(page, 0.1, 5); await page.keyboard.up('d');
  28  |   expect((await st(page, (s) => s.player.pos.x))).toBeGreaterThan(before.x);
  29  | });
  30  | 
  31  | test('F01 solid tiles block movement', async ({ page }) => {
  32  |   await dispatch(page, 'player.move', { dx: 1, dy: 0 });
  33  |   await step(page, 0.1, 600);
  34  |   const { x, w } = await st(page, (s) => ({ x: s.player.pos.x, w: s.map.w }));
  35  |   expect(x, 'player must stay inside the map').toBeLessThan(w + 0.0001);
  36  |   expect(x).toBeGreaterThanOrEqual(0);
  37  | });
  38  | 
  39  | test('F02 sprint drains stamina, stops at 0, regenerates', async ({ page }) => {
  40  |   await dispatch(page, 'player.move', { dx: 0, dy: 1 });
  41  |   await dispatch(page, 'player.sprint', { on: true });
  42  |   const s0 = await st(page, (s) => s.player.stamina);
  43  |   await step(page, 0.1, 10);
  44  |   expect(await st(page, (s) => s.player.stamina)).toBeLessThan(s0);
  45  |   // keep sprinting until the engine itself ends it (stamina exhausted); regen must not mask the 0
  46  |   for (let i = 0; i < 100 && (await st(page, (s) => s.player.sprinting)); i++) await step(page, 0.1, 5);
  47  |   const s1 = await st(page, (s) => ({ st: s.player.stamina, sp: s.player.sprinting }));
> 48  |   expect(s1.st).toBeLessThanOrEqual(0.0001);
      |                 ^ Error: expect(received).toBeLessThanOrEqual(expected)
  49  |   expect(s1.sp).toBe(false);
  50  |   await dispatch(page, 'player.sprint', { on: false });
  51  |   await dispatch(page, 'player.move', { dx: 0, dy: 0 });
  52  |   await step(page, 0.1, 20);
  53  |   expect(await st(page, (s) => s.player.stamina)).toBeGreaterThan(0);
  54  | });
  55  | 
  56  | test('F03 attack button damages enemy in range, respects cooldown', async ({ page }) => {
  57  |   await spawnEnemy(page, 0.8, 0, 500);
  58  |   await page.evaluate(() => { (window as any).__kairoa.state.player.facing = { x: 1, y: 0 }; });
  59  |   await tap(page, 'combat.attack');
  60  |   const hp1 = await st(page, (s) => s.enemies[0].hp);
  61  |   expect(hp1).toBeLessThan(500);
  62  |   await tap(page, 'combat.attack'); // immediately again: cooldown
  63  |   expect(await st(page, (s) => s.enemies[0].hp)).toBe(hp1);
  64  |   await step(page, 0.1, 20);
  65  |   await tap(page, 'combat.attack');
  66  |   expect(await st(page, (s) => s.enemies[0].hp)).toBeLessThan(hp1);
  67  | });
  68  | 
  69  | test('F04 skill applies element aura and goes on cooldown', async ({ page }) => {
  70  |   await spawnEnemy(page, 0.8, 0, 500);
  71  |   await page.evaluate(() => { (window as any).__kairoa.state.player.facing = { x: 1, y: 0 }; });
  72  |   await tap(page, 'combat.skill');
  73  |   const r = await st(page, (s) => ({ aura: s.enemies[0].aura, el: s.party[s.active].element, cd: s.party[s.active].skillCdLeft }));
  74  |   expect(r.aura).toBe(r.el);
  75  |   expect(r.cd).toBeGreaterThan(0);
  76  | });
  77  | 
  78  | test('F05 burst needs full energy and consumes it', async ({ page }) => {
  79  |   await spawnEnemy(page, 0.8, 0, 5000);
  80  |   await page.evaluate(() => { (window as any).__kairoa.state.player.facing = { x: 1, y: 0 }; });
  81  |   await page.evaluate(() => { const c = (window as any).__kairoa.state; c.party[c.active].energy = 0; });
  82  |   await tap(page, 'combat.burst');
  83  |   expect(await st(page, (s) => s.enemies[0].hp)).toBe(5000);
  84  |   await page.evaluate(() => { const c = (window as any).__kairoa.state; c.party[c.active].energy = c.party[c.active].maxEnergy; });
  85  |   await tap(page, 'combat.burst');
  86  |   expect(await st(page, (s) => s.enemies[0].hp)).toBeLessThan(5000);
  87  |   expect(await st(page, (s) => s.party[s.active].energy)).toBe(0);
  88  | });
  89  | 
  90  | test('F06 party buttons switch; cooldown; fainted not selectable', async ({ page }) => {
  91  |   expect(await st(page, (s) => s.party.length)).toBe(4);
  92  |   for (let i = 0; i < 4; i++) await expect(ctl(page, 'party.switch', i), `party.switch index ${i}`).toBeVisible();
  93  |   await tap(page, 'party.switch', 1);
  94  |   expect(await st(page, (s) => s.active)).toBe(1);
  95  |   await tap(page, 'party.switch', 2); // within 1s cooldown
  96  |   expect(await st(page, (s) => s.active)).toBe(1);
  97  |   await step(page, 0.1, 15);
  98  |   await page.evaluate(() => { (window as any).__kairoa.state.party[3].hp = 0; });
  99  |   await dispatch(page, 'party.switch', { index: 3 });
  100 |   expect(await st(page, (s) => s.active)).toBe(1);
  101 |   await tap(page, 'party.switch', 2);
  102 |   expect(await st(page, (s) => s.active)).toBe(2);
  103 | });
  104 | 
  105 | test('F07 reactions: ember on tide-aura enemy multiplies damage (mist x1.5)', async ({ page }) => {
  106 |   const ids = await st(page, (s) => s.party.map((c: any) => c.element));
  107 |   test.skip(!ids.includes('ember') || !ids.includes('tide'), 'party lacks ember/tide');
  108 |   // Engine-level check through the UI contract: apply tide aura, then ember hit.
  109 |   await spawnEnemy(page, 0.8, 0, 5000);
  110 |   await page.evaluate(() => { const s = (window as any).__kairoa.state; s.enemies[0].aura = 'tide'; s.player.facing = { x: 1, y: 0 }; });
  111 |   const iE = ids.indexOf('ember');
  112 |   await dispatch(page, 'party.switch', { index: iE });
  113 |   await step(page, 0.1, 15);
  114 |   await tap(page, 'combat.skill');
  115 |   const dmgReact = 5000 - (await st(page, (s) => s.enemies[0].hp));
  116 |   expect(dmgReact).toBeGreaterThan(0);
  117 |   expect(await st(page, (s) => s.enemies[0].aura), 'aura consumed by reaction').toBeNull();
  118 | });
  119 | 
  120 | test('F08 enemy within aggro range approaches and damages player', async ({ page }) => {
  121 |   await page.evaluate(() => {
  122 |     const s = (window as any).__kairoa.state; s.enemies.length = 0;
  123 |     s.enemies.push({ id: 9002, kind: 'mossling', pos: { x: s.player.pos.x + 3, y: s.player.pos.y }, hp: 100, maxHp: 100, aura: null, frozenFor: 0, atkCd: 0 });
  124 |   });
  125 |   const d0 = await st(page, (s) => Math.hypot(s.enemies[0].pos.x - s.player.pos.x, s.enemies[0].pos.y - s.player.pos.y));
  126 |   const hp0 = await st(page, (s) => s.party.reduce((a: number, c: any) => a + c.hp, 0));
  127 |   await step(page, 0.1, 60);
  128 |   const d1 = await st(page, (s) => Math.hypot(s.enemies[0].pos.x - s.player.pos.x, s.enemies[0].pos.y - s.player.pos.y));
  129 |   const hp1 = await st(page, (s) => s.party.reduce((a: number, c: any) => a + c.hp, 0));
  130 |   expect(d1).toBeLessThan(d0);
  131 |   expect(hp1).toBeLessThan(hp0);
  132 | });
  133 | 
  134 | test('F09 defeat shows respawn control; respawn restores 50% HP', async ({ page }, info) => {
  135 |   await page.evaluate(() => { for (const c of (window as any).__kairoa.state.party) c.hp = 0; (window as any).__kairoa.step(0.1); });
  136 |   await expect(ctl(page, 'game.respawn'), 'respawn button visible when party is defeated').toBeVisible();
  137 |   await shot(page, 'defeat', info.project.name);
  138 |   await tap(page, 'game.respawn');
  139 |   const r = await st(page, (s) => s.party.map((c: any) => c.hp / c.maxHp));
  140 |   expect(r.some((x: number) => Math.abs(x - 0.5) < 0.02)).toBe(true);
  141 | });
  142 | 
  143 | test('F10 interact opens adjacent chest once', async ({ page }) => {
  144 |   await page.evaluate(() => {
  145 |     const s = (window as any).__kairoa.state; s.enemies.length = 0;
  146 |     s.chests.length = 0; s.chests.push({ id: 7001, pos: { x: s.player.pos.x + 0.6, y: s.player.pos.y }, opened: false, loot: 'test_loot' });
  147 |   });
  148 |   await step(page, 0.05, 2);
```