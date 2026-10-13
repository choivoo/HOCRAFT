// Rasterises the Kairoa emblem to PNG with no dependencies (pure node zlib).
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
const crcT = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = (b) => { let c = ~0; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return ~c >>> 0; };
const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
function png(size, maskable) {
  const S = size, raw = Buffer.alloc((S * 4 + 1) * S);
  const k = maskable ? 0.7 : 1; // maskable: keep emblem inside safe zone
  for (let y = 0; y < S; y++) {
    raw[y * (S * 4 + 1)] = 0;
    for (let x = 0; x < S; x++) {
      const u = (x / S - 0.5) / k, v = (y / S - 0.5) / k; // -0.5..0.5 emblem space
      let c = [14 + 15 * (y / S), 26 + 33 * (1 - y / S), 43 + 56 * (1 - y / S)];
      const r = Math.hypot(u, v);
      if (Math.abs(r - 0.293) < 0.02) c = [242, 193, 78];
      if (Math.abs(u) / 0.086 + Math.abs(v) / 0.266 < 1) c = [242, 193, 78];
      else if (Math.abs(u) / 0.266 + Math.abs(v) / 0.086 < 1) c = [79, 209, 197];
      if (!maskable) { // rounded corners transparent
        const cx = Math.max(Math.abs(x / S - 0.5) - (0.5 - 0.1875), 0), cy = Math.max(Math.abs(y / S - 0.5) - (0.5 - 0.1875), 0);
        if (Math.hypot(cx, cy) > 0.1875) { const o = y * (S * 4 + 1) + 1 + x * 4; raw.set([0, 0, 0, 0], o); continue; }
      }
      raw.set([...c.map(Math.round), 255], y * (S * 4 + 1) + 1 + x * 4);
    }
  }
  const ih = Buffer.alloc(13); ih.writeUInt32BE(S, 0); ih.writeUInt32BE(S, 4); ih[8] = 8; ih[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
const out = new URL('../public/', import.meta.url).pathname;
writeFileSync(out + 'icon-192.png', png(192, false));
writeFileSync(out + 'icon-512.png', png(512, false));
writeFileSync(out + 'icon-maskable-512.png', png(512, true));
console.log('icons written to', out);
