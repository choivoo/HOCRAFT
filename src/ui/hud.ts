import type { Engine, GameState } from '../core/types';
import type { CommandId } from '../commands';
import { computeLayout, CONTROL_IDS, type Insets } from './layout';
import { ELEMENT_COLOR, ELEMENT_KO } from './render';

const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
export type Tab = 'main' | 'party' | 'inv' | 'wish' | 'settings';

export class Hud {
  tab: Tab = 'main';
  playerName = '여행자';
  mapBig = false;
  private lastMenu = '';
  private lastMenuT = 0;
  private toastT = 0;
  private lastLayout = '';
  constructor(private engine: Engine) {
    try { this.playerName = localStorage.getItem('kairoa-name') || this.playerName; } catch { /* ignore */ }
    $('minimap').addEventListener('click', () => { this.mapBig = !this.mapBig; this.lastLayout = ''; });
    $('panel').addEventListener('compositionend', ev => this.commitName(ev.target as HTMLElement));
    $('panel').addEventListener('change', ev => this.commitName(ev.target as HTMLElement));
  }
  private commitName(t: HTMLElement) {
    if (t.id !== 'name-input') return;
    this.playerName = (t as HTMLInputElement).value.trim().slice(0, 12) || '여행자';
    try { localStorage.setItem('kairoa-name', this.playerName); } catch { /* ignore */ }
  }
  toast(text: string) { const t = $('toast'); t.textContent = text; t.classList.add('show'); this.toastT = 2.2; }

  insets(): Insets {
    const cs = getComputedStyle($('hud'));
    return { t: parseFloat(cs.paddingTop) || 0, r: parseFloat(cs.paddingRight) || 0, b: parseFloat(cs.paddingBottom) || 0, l: parseFloat(cs.paddingLeft) || 0 };
  }
  applyLayout(w: number, h: number) {
    const ins = this.insets();
    const key = `${w}x${h}${JSON.stringify(ins)}${this.mapBig}`;
    if (key === this.lastLayout) return;
    this.lastLayout = key;
    const L = computeLayout(w, h, ins);
    for (const id of CONTROL_IDS) {
      const el = document.getElementById(id); if (!el) continue;
      const r = { ...L[id] };
      if (id === 'minimap') {
        if (this.mapBig) { const s = Math.min(w, h) * 0.7; r.w = s; r.h = s; r.x = (w - s) / 2; r.y = (h - s) / 2; el.style.zIndex = '4'; } else el.style.zIndex = '';
      }
      // absolute children are positioned against the padding box: offset back by the insets
      el.style.left = r.x - ins.l + 'px'; el.style.top = r.y - ins.t + 'px';
      el.style.width = r.w + 'px'; el.style.height = r.h + 'px';
    }
    const mc = $('minimap').firstElementChild as HTMLCanvasElement;
    const px = this.mapBig ? 360 : 84;
    if (mc.width !== px) { mc.width = px; mc.height = px; }
  }

  update(s: GameState, dt: number, sprintHeld: boolean) {
    if (this.toastT > 0 && (this.toastT -= dt) <= 0) $('toast').classList.remove('show');
    const a = s.party[s.active];
    s.party.forEach((c, i) => {
      const el = document.getElementById('p' + i); if (!el) return;
      const html = `<span class="nm">${esc(c.name)}</span><span class="gem" style="background:${ELEMENT_COLOR[c.element]}"></span><div class="bar"><i style="width:${Math.max(0, Math.min(100, c.hp / c.maxHp * 100))}%"></i></div>`;
      if (el.dataset.h !== html) { el.innerHTML = html; el.dataset.h = html; }
      el.classList.toggle('active', i === s.active);
      el.classList.toggle('down', c.hp <= 0);
      el.setAttribute('aria-label', `${c.name} ${ELEMENT_KO[c.element]}`);
    });
    for (let i = s.party.length; i < 4; i++) { const el = document.getElementById('p' + i); if (el) el.style.visibility = 'hidden'; }
    const ring = document.getElementById('ringv');
    if (ring) ring.setAttribute('stroke-dashoffset', String(289 * (1 - s.player.stamina / (s.player.maxStamina || 1))));
    $('sprint').classList.toggle('on', sprintHeld || s.player.sprinting);
    if (a) {
      $('cd').style.height = (a.skillCd > 0 ? Math.max(0, a.skillCdLeft / a.skillCd) * 100 : 0) + '%';
      $('burst').style.opacity = a.energy >= a.maxEnergy ? '1' : '.5';
    }
    const near = s.chests.some(c => !c.opened && Math.hypot(c.pos.x - s.player.pos.x, c.pos.y - s.player.pos.y) < 1.8);
    $('interact').style.visibility = near ? 'visible' : 'hidden';
    $('over').classList.toggle('show', s.party.length > 0 && s.party.every(c => c.hp <= 0));
    $('menu').classList.toggle('show', s.paused);
    if (s.paused) { this.lastMenuT -= dt; if (this.lastMenuT <= 0) { this.lastMenuT = 0.1; this.renderMenu(false); } }
  }

  private renderMenu(force: boolean) {
    const s = this.engine.state;
    const cmd = (c: CommandId, label: string, extra = '') => `<button class="mb" data-cmd="${c}" ${extra}>${label}</button>`;
    const sections = [
      `<h3>${esc(this.playerName)}님의 여정</h3><div class="row">${cmd('menu.toggle', '계속하기')}${cmd('file.save', '저장')}${cmd('file.load', '불러오기')}</div><div class="muted">원석 ${s.gems} · 보유 캐릭터 ${s.owned.length}</div>`,
      `<h3>파티 편성</h3><div class="list">${s.party.map((c, i) => `<div><span style="color:${ELEMENT_COLOR[c.element]}">&#9670;</span><span class="grow">${i + 1}. ${esc(c.name)} (${ELEMENT_KO[c.element]}) HP ${Math.round(c.hp)}/${c.maxHp}</span>${i > 0 ? `<button class="mb" data-cmd="party.reorder" data-index="${i}" data-to="${i - 1}" aria-label="위로">▲</button>` : ''}${i < s.party.length - 1 ? `<button class="mb" data-cmd="party.reorder" data-index="${i}" data-to="${i + 1}" aria-label="아래로">▼</button>` : ''}</div>`).join('')}</div><div class="row">${cmd('edit.undo', '되돌리기')}${cmd('edit.redo', '다시 실행')}</div>`,
      `<h3>소원</h3><div class="muted">원석 ${s.gems} · 천장까지 ${s.pity}/90 · 보유 ${s.owned.length}</div><div class="row">${cmd('gacha.pull', '1회 소원', 'data-count="1"')}${cmd('gacha.pull', '10회 소원', 'data-count="10"')}</div><div class="muted">보유: ${s.owned.map(esc).join(', ') || '-'}</div>`,
      (() => { const items = Object.entries(s.inventory).filter(([, n]) => n > 0); return `<h3>가방</h3><div class="list">${items.length ? items.map(([k, n]) => `<div><span class="grow">${esc(k)}</span><b>x${n}</b></div>`).join('') : '<div class="muted">비어 있음</div>'}</div>`; })(),
    ];
    const html = sections.join('');
    let dyn = document.getElementById('menu-dyn');
    if (!dyn) {
      // static settings block is created once so periodic refreshes never steal focus from the name input
      $('panel').innerHTML = `<div id="menu-dyn"></div><h3>설정</h3><div class="row"><label for="name-input">이름</label><input id="name-input" data-name-input type="text" maxlength="12" autocomplete="off" aria-label="이름"></div><div class="muted">입력을 마치면 자동 저장됩니다.</div>`;
      dyn = document.getElementById('menu-dyn')!;
      (document.getElementById('name-input') as HTMLInputElement).value = this.playerName;
      this.lastMenu = '';
    }
    if (!force && html === this.lastMenu) return;
    this.lastMenu = html;
    dyn.innerHTML = html;
  }
}
