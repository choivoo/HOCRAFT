# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: kairoa.spec.ts >> F15 touch targets >=44px, no overlap, no horizontal scroll
- Location: e2e/kairoa.spec.ts:228:1

# Error details

```
Error: menu: party.switch#2 overlaps party.reorder#0

expect(received).toBe(expected) // Object.is equality

Expected: false
Received: true
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic:
    - button "지도" [ref=e3]
    - button "일시정지" [active] [ref=e5] [cursor=pointer]
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
  - generic [ref=e46]:
    - generic [ref=e47]:
      - heading "여행자님의 여정" [level=3] [ref=e48]
      - generic [ref=e49]:
        - button "계속하기" [ref=e50] [cursor=pointer]
        - button "저장" [ref=e51] [cursor=pointer]
        - button "불러오기" [ref=e52] [cursor=pointer]
      - generic [ref=e53]: 원석 1600 · 보유 캐릭터 4
      - heading "파티 편성" [level=3] [ref=e54]
      - generic [ref=e55]:
        - generic [ref=e56]:
          - generic [ref=e57]: ◆
          - generic [ref=e58]: 1. Pyra (불꽃) HP 120/120
          - button "아래로" [ref=e59] [cursor=pointer]: ▼
        - generic [ref=e60]:
          - generic [ref=e61]: ◆
          - generic [ref=e62]: 2. Nerei (물결) HP 110/110
          - button "위로" [ref=e63] [cursor=pointer]: ▲
          - button "아래로" [ref=e64] [cursor=pointer]: ▼
        - generic [ref=e65]:
          - generic [ref=e66]: ◆
          - generic [ref=e67]: 3. Glacia (서리) HP 105/105
          - button "위로" [ref=e68] [cursor=pointer]: ▲
          - button "아래로" [ref=e69] [cursor=pointer]: ▼
        - generic [ref=e70]:
          - generic [ref=e71]: ◆
          - generic [ref=e72]: 4. Zephyr (바람) HP 100/100
          - button "위로" [ref=e73] [cursor=pointer]: ▲
      - generic [ref=e74]:
        - button "되돌리기" [ref=e75] [cursor=pointer]
        - button "다시 실행" [ref=e76] [cursor=pointer]
      - heading "소원" [level=3] [ref=e77]
      - generic [ref=e78]: 원석 1600 · 천장까지 0/90 · 보유 4
      - generic [ref=e79]:
        - button "1회 소원" [ref=e80] [cursor=pointer]
        - button "10회 소원" [ref=e81] [cursor=pointer]
      - generic [ref=e82]: "보유: pyra, nerei, glacia, zephyr"
      - heading "가방" [level=3] [ref=e83]
      - generic [ref=e84]:
        - generic [ref=e85]:
          - generic [ref=e86]: potion
          - generic [ref=e87]: x2
        - generic [ref=e88]:
          - generic [ref=e89]: oak_blade
          - generic [ref=e90]: x1
    - heading "설정" [level=3] [ref=e91]
    - generic [ref=e92]:
      - generic [ref=e93]: 이름
      - textbox "이름" [ref=e94]: 여행자
    - generic [ref=e95]: 입력을 마치면 자동 저장됩니다.
```

# Test source

```ts
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
  171 |   expect(await run(page)).toBe(a);
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
> 244 |       expect(ov, `${label}: ${p.name} overlaps ${q.name}`).toBe(false);
      |                                                            ^ Error: menu: party.switch#2 overlaps party.reorder#0
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
  272 |   const m = await request.get('/manifest.webmanifest');
  273 |   expect(m.ok()).toBe(true);
  274 |   const j = await m.json();
  275 |   expect(j.name).toBeTruthy(); expect(j.icons.length).toBeGreaterThan(1);
  276 |   await expect(page.locator('link[rel="manifest"]')).toHaveCount(1);
  277 |   const reg = await page.evaluate(async () => !!(await navigator.serviceWorker?.getRegistration()));
  278 |   expect(reg, 'service worker registered (include /pwa-register.js)').toBe(true);
  279 | });
  280 | 
```