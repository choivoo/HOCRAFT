import type { Element, GameState } from '../core/types';

export const ELEMENT_COLOR: Record<Element, string> = { ember: '#ff6a3d', tide: '#3aa7ff', frost: '#9fe8ff', gale: '#6fe0a8' };
export const ELEMENT_KO: Record<Element, string> = { ember: '불꽃', tide: '물결', frost: '서리', gale: '바람' };

interface Float { x: number; y: number; text: string; life: number; color: string }
const hash = (x: number, y: number) => { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private floats: Float[] = [];
  private prevHp = new Map<number, number>();
  private prevPlayerHp = -1;
  private mini: HTMLCanvasElement | null = null;
  private miniKey = '';
  private t = 0;
  w = 0; h = 0; dpr = 1;
  constructor(private canvas: HTMLCanvasElement) { this.ctx = canvas.getContext('2d')!; }

  resize(w: number, h: number): void {
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.w = w; this.h = h;
    this.canvas.width = Math.round(w * this.dpr); this.canvas.height = Math.round(h * this.dpr);
    this.canvas.style.width = w + 'px'; this.canvas.style.height = h + 'px';
  }

  private trackDamage(s: GameState): void {
    const seen = new Set<number>();
    for (const e of s.enemies) {
      seen.add(e.id);
      const p = this.prevHp.get(e.id);
      if (p !== undefined && e.hp < p) this.floats.push({ x: e.pos.x, y: e.pos.y - 0.6, text: String(Math.round(p - e.hp)), life: 0.9, color: e.aura ? ELEMENT_COLOR[e.aura] : '#fff' });
      this.prevHp.set(e.id, e.hp);
    }
    for (const id of [...this.prevHp.keys()]) if (!seen.has(id)) this.prevHp.delete(id);
    const a = s.party[s.active];
    if (a) {
      if (this.prevPlayerHp >= 0 && a.hp < this.prevPlayerHp) this.floats.push({ x: s.player.pos.x, y: s.player.pos.y - 0.8, text: String(Math.round(this.prevPlayerHp - a.hp)), life: 0.9, color: '#ff5470' });
      this.prevPlayerHp = a.hp;
    }
  }

  draw(s: GameState, dt: number): void {
    const { ctx, w, h } = this;
    this.t += dt;
    this.trackDamage(s);
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const ts = Math.max(24, Math.min(w, h) / 9);
    const cx = w / 2 - s.player.pos.x * ts, cy = h / 2 - s.player.pos.y * ts;
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#101a24'); bg.addColorStop(1, '#0a1118');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    const { w: mw, h: mh, solid } = s.map;
    const x0 = Math.max(0, Math.floor(-cx / ts)), x1 = Math.min(mw - 1, Math.ceil((w - cx) / ts));
    const y0 = Math.max(0, Math.floor(-cy / ts)), y1 = Math.min(mh - 1, Math.ceil((h - cy) / ts));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const px = cx + x * ts, py = cy + y * ts, r = hash(x, y);
      if (solid[y * mw + x]) {
        ctx.fillStyle = `hsl(${205 + r * 20}, 18%, ${24 + r * 8}%)`; ctx.fillRect(px, py, ts + 1, ts + 1);
        ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.fillRect(px, py, ts + 1, ts * 0.22);
        ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(px, py + ts * 0.8, ts + 1, ts * 0.2 + 1);
      } else {
        ctx.fillStyle = `hsl(${140 + r * 25}, 32%, ${22 + r * 7}%)`; ctx.fillRect(px, py, ts + 1, ts + 1);
        if (r > 0.8) { ctx.fillStyle = 'rgba(190,255,200,.16)'; ctx.fillRect(px + ts * r * 0.5, py + ts * 0.4, ts * 0.06, ts * 0.22); }
      }
    }
    // chests
    for (const c of s.chests) {
      const px = cx + c.pos.x * ts, py = cy + c.pos.y * ts, k = ts * 0.7;
      if (px < -ts || py < -ts || px > w + ts || py > h + ts) continue;
      ctx.fillStyle = c.opened ? '#5a4a3a' : '#c68a2e'; ctx.fillRect(px - k / 2, py - k * 0.35, k, k * 0.7);
      ctx.fillStyle = c.opened ? '#3e3226' : '#e9b64f'; ctx.fillRect(px - k / 2, py - k * 0.35, k, k * 0.28);
      if (!c.opened) { ctx.fillStyle = '#fff3c4'; ctx.fillRect(px - k * 0.06, py - k * 0.1, k * 0.12, k * 0.2); }
    }
    // enemies
    for (const e of s.enemies) {
      const px = cx + e.pos.x * ts, py = cy + e.pos.y * ts, r = ts * 0.38;
      if (px < -ts || py < -ts || px > w + ts || py > h + ts) continue;
      if (e.aura) {
        const col = ELEMENT_COLOR[e.aura];
        const g = ctx.createRadialGradient(px, py, r * 0.5, px, py, r * 1.9);
        g.addColorStop(0, col + 'aa'); g.addColorStop(1, col + '00');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, r * 1.9, 0, 7); ctx.fill();
      }
      ctx.fillStyle = e.frozenFor > 0 ? '#bfeaff' : '#8e3b52';
      ctx.beginPath(); ctx.moveTo(px, py - r * 1.1); ctx.lineTo(px + r, py + r * 0.8); ctx.lineTo(px - r, py + r * 0.8); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffe0e8'; ctx.fillRect(px - r * 0.45, py - r * 0.1, r * 0.25, r * 0.25); ctx.fillRect(px + r * 0.2, py - r * 0.1, r * 0.25, r * 0.25);
      ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(px - r, py - r * 1.5, r * 2, 4);
      ctx.fillStyle = '#ff5470'; ctx.fillRect(px - r, py - r * 1.5, r * 2 * Math.max(0, e.hp / e.maxHp), 4);
    }
    // player
    const a = s.party[s.active];
    const ppx = w / 2, ppy = h / 2, pr = ts * 0.34;
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(ppx, ppy + pr * 0.9, pr, pr * 0.4, 0, 0, 7); ctx.fill();
    const ec = a ? ELEMENT_COLOR[a.element] : '#ddd';
    const pg = ctx.createRadialGradient(ppx - pr * 0.3, ppy - pr * 0.3, 2, ppx, ppy, pr);
    pg.addColorStop(0, '#fff'); pg.addColorStop(1, ec);
    ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(ppx, ppy, pr, 0, 7); ctx.fill();
    const f = s.player.facing, fl = Math.hypot(f.x, f.y) || 1;
    const fx = f.x / fl, fy = f.y / fl;
    ctx.fillStyle = '#fff'; ctx.beginPath();
    ctx.moveTo(ppx + fx * pr * 1.7, ppy + fy * pr * 1.7);
    ctx.lineTo(ppx + fx * pr * 0.9 - fy * pr * 0.4, ppy + fy * pr * 0.9 + fx * pr * 0.4);
    ctx.lineTo(ppx + fx * pr * 0.9 + fy * pr * 0.4, ppy + fy * pr * 0.9 - fx * pr * 0.4);
    ctx.closePath(); ctx.fill();
    // damage numbers
    ctx.textAlign = 'center'; ctx.font = `700 ${Math.round(ts * 0.42)}px system-ui, sans-serif`;
    this.floats = this.floats.filter(fl2 => (fl2.life -= dt) > 0);
    for (const fl2 of this.floats) {
      const px = cx + fl2.x * ts, py = cy + fl2.y * ts - (0.9 - fl2.life) * ts * 0.9;
      ctx.globalAlpha = Math.min(1, fl2.life * 2.5);
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.strokeText(fl2.text, px, py);
      ctx.fillStyle = fl2.color; ctx.fillText(fl2.text, px, py);
    }
    ctx.globalAlpha = 1;
  }

  /** Draw minimap into a small canvas (map cached; dots redrawn). */
  drawMinimap(target: HTMLCanvasElement, s: GameState): void {
    const size = target.width, { w: mw, h: mh, solid } = s.map;
    const key = `${mw}x${mh}x${s.seed}x${size}`;
    if (!this.mini || this.miniKey !== key) {
      const c = document.createElement('canvas'); c.width = size; c.height = size;
      const g = c.getContext('2d')!; const sc = size / Math.max(mw, mh);
      g.fillStyle = '#16301f'; g.fillRect(0, 0, size, size);
      g.fillStyle = '#4b5b69';
      for (let y = 0; y < mh; y++) for (let x = 0; x < mw; x++) if (solid[y * mw + x]) g.fillRect(x * sc, y * sc, Math.ceil(sc), Math.ceil(sc));
      this.mini = c; this.miniKey = key;
    }
    const g = target.getContext('2d')!, sc = size / Math.max(mw, mh);
    g.clearRect(0, 0, size, size); g.drawImage(this.mini, 0, 0);
    g.fillStyle = '#e9b64f'; for (const c of s.chests) if (!c.opened) g.fillRect(c.pos.x * sc - 1.5, c.pos.y * sc - 1.5, 3, 3);
    g.fillStyle = '#ff5470'; for (const e of s.enemies) g.fillRect(e.pos.x * sc - 1.5, e.pos.y * sc - 1.5, 3, 3);
    g.fillStyle = '#fff'; g.beginPath(); g.arc(s.player.pos.x * sc, s.player.pos.y * sc, 3, 0, 7); g.fill();
  }
}
