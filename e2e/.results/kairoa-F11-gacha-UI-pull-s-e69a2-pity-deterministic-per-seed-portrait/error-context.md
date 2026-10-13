# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: kairoa.spec.ts >> F11 gacha: UI pull spends gems; 90-pull pity; deterministic per seed
- Location: e2e/kairoa.spec.ts:158:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: "[\"pyra\",\"nerei\",\"glacia\",\"zephyr\"]28"
Received: "[\"pyra\",\"nerei\",\"glacia\",\"zephyr\"]18"
```

# Page snapshot

```yaml
- generic [active] [ref=f2e1]:
  - generic:
    - button "지도" [ref=f2e3]
    - button "일시정지" [ref=f2e5] [cursor=pointer]
    - generic: 카이로아 들판
    - slider "이동 조이스틱" [ref=f2e8]
    - button "공격" [ref=f2e9] [cursor=pointer]
    - button "원소 기술" [ref=f2e13] [cursor=pointer]:
      - generic [ref=f2e16]: 기술
    - button "필살기" [ref=f2e17] [cursor=pointer]:
      - generic [ref=f2e20]: 필살
    - button "질주" [ref=f2e21] [cursor=pointer]
    - button "Pyra 불꽃" [ref=f2e25] [cursor=pointer]:
      - generic [ref=f2e26]: Pyra
    - button "Nerei 물결" [ref=f2e30] [cursor=pointer]:
      - generic [ref=f2e31]: Nerei
    - button "Glacia 서리" [ref=f2e35] [cursor=pointer]:
      - generic [ref=f2e36]: Glacia
    - button "Zephyr 바람" [ref=f2e40] [cursor=pointer]:
      - generic [ref=f2e41]: Zephyr
  - generic [ref=f2e46]:
    - generic [ref=f2e47]:
      - heading "여행자님의 여정" [level=3] [ref=f2e48]
      - generic [ref=f2e49]:
        - button "계속하기" [ref=f2e50] [cursor=pointer]
        - button "저장" [ref=f2e51] [cursor=pointer]
        - button "불러오기" [ref=f2e52] [cursor=pointer]
      - generic [ref=f2e53]: 원석 985600 · 보유 캐릭터 4
      - heading "파티 편성" [level=3] [ref=f2e54]
      - generic [ref=f2e55]:
        - generic [ref=f2e56]:
          - generic [ref=f2e57]: ◆
          - generic [ref=f2e58]: 1. Pyra (불꽃) HP 120/120
          - button "아래로" [ref=f2e59] [cursor=pointer]: ▼
        - generic [ref=f2e60]:
          - generic [ref=f2e61]: ◆
          - generic [ref=f2e62]: 2. Nerei (물결) HP 110/110
          - button "위로" [ref=f2e63] [cursor=pointer]: ▲
          - button "아래로" [ref=f2e64] [cursor=pointer]: ▼
        - generic [ref=f2e65]:
          - generic [ref=f2e66]: ◆
          - generic [ref=f2e67]: 3. Glacia (서리) HP 105/105
          - button "위로" [ref=f2e68] [cursor=pointer]: ▲
          - button "아래로" [ref=f2e69] [cursor=pointer]: ▼
        - generic [ref=f2e70]:
          - generic [ref=f2e71]: ◆
          - generic [ref=f2e72]: 4. Zephyr (바람) HP 100/100
          - button "위로" [ref=f2e73] [cursor=pointer]: ▲
      - generic [ref=f2e74]:
        - button "되돌리기" [ref=f2e75] [cursor=pointer]
        - button "다시 실행" [ref=f2e76] [cursor=pointer]
      - heading "소원" [level=3] [ref=f2e77]
      - generic [ref=f2e78]: 원석 985600 · 천장까지 18/90 · 보유 4
      - generic [ref=f2e79]:
        - button "1회 소원" [ref=f2e80] [cursor=pointer]
        - button "10회 소원" [ref=f2e81] [cursor=pointer]
      - generic [ref=f2e82]: "보유: pyra, nerei, glacia, zephyr"
      - heading "가방" [level=3] [ref=f2e83]
      - generic [ref=f2e84]:
        - generic [ref=f2e85]:
          - generic [ref=f2e86]: ash_dust
          - generic [ref=f2e87]: x61
        - generic [ref=f2e88]:
          - generic [ref=f2e89]: glacia
          - generic [ref=f2e90]: x9
        - generic [ref=f2e91]:
          - generic [ref=f2e92]: moonsilver
          - generic [ref=f2e93]: x5
        - generic [ref=f2e94]:
          - generic [ref=f2e95]: nerei
          - generic [ref=f2e96]: x9
        - generic [ref=f2e97]:
          - generic [ref=f2e98]: oak_blade
          - generic [ref=f2e99]: x1
        - generic [ref=f2e100]:
          - generic [ref=f2e101]: pebble
          - generic [ref=f2e102]: x39
        - generic [ref=f2e103]:
          - generic [ref=f2e104]: potion
          - generic [ref=f2e105]: x2
        - generic [ref=f2e106]:
          - generic [ref=f2e107]: twine
          - generic [ref=f2e108]: x54
        - generic [ref=f2e109]:
          - generic [ref=f2e110]: zephyr
          - generic [ref=f2e111]: x2
        - generic [ref=f2e112]:
          - generic [ref=f2e113]: starglass
          - generic [ref=f2e114]: x2
    - heading "설정" [level=3] [ref=f2e115]
    - generic [ref=f2e116]:
      - generic [ref=f2e117]: 이름
      - textbox "이름" [ref=f2e118]: 여행자
    - generic [ref=f2e119]: 입력을 마치면 자동 저장됩니다.
```

# Test source

```ts
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
  149 |   const inv0 = await st(page, (s) => Object.values(s.inventory).reduce((a: number, b: any) => a + b, 0));
  150 |   await tap(page, 'world.interact');
  151 |   expect(await st(page, (s) => s.chests[0].opened)).toBe(true);
  152 |   const inv1 = await st(page, (s) => Object.values(s.inventory).reduce((a: number, b: any) => a + b, 0));
  153 |   expect(inv1).toBeGreaterThan(inv0);
  154 |   await dispatch(page, 'world.interact', {});
  155 |   expect(await st(page, (s) => Object.values(s.inventory).reduce((a: number, b: any) => a + b, 0))).toBe(inv1);
  156 | });
  157 | 
  158 | test('F11 gacha: UI pull spends gems; 90-pull pity; deterministic per seed', async ({ page }) => {
  159 |   await page.evaluate(() => { (window as any).__kairoa.state.gems = 100000; });
  160 |   await openMenu(page);
  161 |   const g0 = await st(page, (s) => s.gems);
  162 |   await tap(page, 'gacha.pull', undefined).catch(() => { throw new Error('gacha.pull control must be reachable in pause menu (Wish)'); });
  163 |   expect(await st(page, (s) => s.gems)).toBeLessThan(g0);
  164 |   const run = async (p: any) => p.evaluate(() => {
  165 |     const e = (window as any).__kairoa; for (let i = 0; i < 9; i++) e.dispatch('gacha.pull', { count: 10 });
  166 |     return JSON.stringify(e.state.owned) + e.state.pity;
  167 |   });
  168 |   await boot(page, 5); await page.evaluate(() => { (window as any).__kairoa.state.gems = 1e6; });
  169 |   const a = await run(page);
  170 |   await boot(page, 5); await page.evaluate(() => { (window as any).__kairoa.state.gems = 1e6; });
> 171 |   expect(await run(page)).toBe(a);
      |                           ^ Error: expect(received).toBe(expected) // Object.is equality
  172 |   const topOwned = await st(page, (s) => s.owned.length);
  173 |   expect(topOwned, '90 pulls must yield at least one top-rarity item (hard pity)').toBeGreaterThan(0);
  174 | });
  175 | 
  176 | test('F12 save -> reload -> load round trip, unknown fields kept', async ({ page }) => {
  177 |   await page.evaluate(() => {
  178 |     const s = (window as any).__kairoa.state; s.gems = 4321; s.extra.mystery = { keep: [1, 2, 3] };
  179 |   });
  180 |   const before = await page.evaluate(() => (window as any).__kairoa.serialize());
  181 |   await openMenu(page);
  182 |   await tap(page, 'file.save');
  183 |   await page.reload();
  184 |   await page.waitForFunction(() => !!(window as any).__kairoa);
  185 |   // Load: if UI stores save in localStorage, the load control dispatches with the stored json.
  186 |   await openMenu(page);
  187 |   await tap(page, 'file.load');
  188 |   const after = await page.evaluate(() => (window as any).__kairoa.serialize());
  189 |   expect(JSON.parse(after)).toEqual(JSON.parse(before));
  190 |   expect(JSON.parse(after).extra.mystery).toEqual({ keep: [1, 2, 3] });
  191 |   // direct engine round trip too
  192 |   const rt = await page.evaluate((j) => { const e = (window as any).__kairoa; e.dispatch('file.load', { json: j }); return e.serialize(); }, before);
  193 |   expect(rt).toBe(before);
  194 | });
  195 | 
  196 | test('F13 undo/redo via button and Ctrl+Z / Ctrl+Shift+Z', async ({ page }) => {
  197 |   await openMenu(page);
  198 |   const order0 = await st(page, (s) => s.party.map((c: any) => c.id));
  199 |   await dispatch(page, 'party.reorder', { from: 0, to: 2 });
  200 |   const order1 = await st(page, (s) => s.party.map((c: any) => c.id));
  201 |   expect(order1).not.toEqual(order0);
  202 |   await page.keyboard.press('Control+z');
  203 |   expect(await st(page, (s) => s.party.map((c: any) => c.id))).toEqual(order0);
  204 |   await page.keyboard.press('Control+Shift+z');
  205 |   expect(await st(page, (s) => s.party.map((c: any) => c.id))).toEqual(order1);
  206 |   await tap(page, 'edit.undo');
  207 |   expect(await st(page, (s) => s.party.map((c: any) => c.id))).toEqual(order0);
  208 |   await tap(page, 'edit.redo');
  209 |   expect(await st(page, (s) => s.party.map((c: any) => c.id))).toEqual(order1);
  210 | });
  211 | 
  212 | test('F14 HUD visible; menu.toggle pauses simulation', async ({ page }, info) => {
  213 |   await expect(page.locator('canvas').first()).toBeVisible();
  214 |   for (const c of ['combat.attack', 'combat.skill', 'combat.burst', 'player.sprint', 'menu.toggle']) await expect(ctl(page, c), c).toBeVisible();
  215 |   await shot(page, 'hud', info.project.name);
  216 |   await tap(page, 'menu.toggle');
  217 |   expect(await st(page, (s) => s.paused)).toBe(true);
  218 |   await shot(page, 'menu', info.project.name);
  219 |   const t0 = await st(page, (s) => s.tick);
  220 |   await step(page, 0.1, 10);
  221 |   expect(await st(page, (s) => s.tick)).toBe(t0);
  222 |   await tap(page, 'menu.toggle');
  223 |   expect(await st(page, (s) => s.paused)).toBe(false);
  224 |   await page.keyboard.press('Escape');
  225 |   expect(await st(page, (s) => s.paused)).toBe(true);
  226 | });
  227 | 
  228 | test('F15 touch targets >=44px, no overlap, no horizontal scroll', async ({ page }, info) => {
  229 |   const check = async (label: string) => {
  230 |     const items = await page.$$eval('[data-cmd]', (els) => els.map((e) => {
  231 |       const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
  232 |       const vis = r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && cs.opacity !== '0';
  233 |       return { name: `${e.getAttribute('data-cmd')}#${e.getAttribute('data-index') ?? e.getAttribute('data-count') ?? ''}`, vis, x: r.x, y: r.y, w: r.width, h: r.height };
  234 |     }));
  235 |     const vis = items.filter((i) => i.vis);
  236 |     expect(vis.length, label + ': no visible data-cmd controls').toBeGreaterThan(3);
  237 |     for (const i of vis) {
  238 |       expect(i.w, `${label}: ${i.name} width`).toBeGreaterThanOrEqual(43.5);
  239 |       expect(i.h, `${label}: ${i.name} height`).toBeGreaterThanOrEqual(43.5);
  240 |     }
  241 |     for (let a = 0; a < vis.length; a++) for (let b = a + 1; b < vis.length; b++) {
  242 |       const p = vis[a], q = vis[b];
  243 |       const ov = Math.min(p.x + p.w, q.x + q.w) - Math.max(p.x, q.x) > 1 && Math.min(p.y + p.h, q.y + q.h) - Math.max(p.y, q.y) > 1;
  244 |       expect(ov, `${label}: ${p.name} overlaps ${q.name}`).toBe(false);
  245 |     }
  246 |     const sc = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, bw: document.body.scrollWidth }));
  247 |     expect(sc.sw, label + ' horizontal scroll').toBeLessThanOrEqual(sc.cw);
  248 |     expect(sc.bw, label + ' body horizontal scroll').toBeLessThanOrEqual(sc.cw);
  249 |   };
  250 |   await check('hud');
  251 |   await openMenu(page);
  252 |   await check('menu');
  253 |   await shot(page, 'layout-menu', info.project.name);
  254 | });
  255 | 
  256 | test('F16 Korean: composed Hangul name input ends with exact string', async ({ page }) => {
  257 |   await openMenu(page);
  258 |   const input = page.locator('input[data-name-input], input[name="name"], input[type="text"]').locator('visible=true').first();
  259 |   await expect(input, 'a visible text input for the player/character name (input[data-name-input])').toBeVisible();
  260 |   await input.tap();
  261 |   await input.fill('');
  262 |   await page.keyboard.insertText('용사');
  263 |   await expect(input).toHaveValue('용사');
  264 |   await input.blur();
  265 |   await expect(input).toHaveValue('용사');
  266 |   const hasHangulText = await page.evaluate(() => /[가-힣]/.test(document.body.innerText));
  267 |   expect(hasHangulText, 'Korean labels rendered in DOM').toBe(true);
  268 |   await page.screenshot({ path: 'e2e/shots/korean.png' });
  269 | });
  270 | 
  271 | test('PWA manifest + service worker registered', async ({ page, request }) => {
```