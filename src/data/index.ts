import type { Element } from '../core/types';

export const TILE = 1; // one tile == one world unit
export interface CharDef { id: string; name: string; element: Element; rarity: 4 | 5; maxHp: number; attack: number; skillCd: number; maxEnergy: number }
export const CHARACTERS: CharDef[] = [
  { id: 'pyra', name: 'Pyra', element: 'ember', rarity: 5, maxHp: 120, attack: 18, skillCd: 4, maxEnergy: 60 },
  { id: 'nerei', name: 'Nerei', element: 'tide', rarity: 4, maxHp: 110, attack: 14, skillCd: 3, maxEnergy: 50 },
  { id: 'glacia', name: 'Glacia', element: 'frost', rarity: 4, maxHp: 105, attack: 15, skillCd: 3.5, maxEnergy: 50 },
  { id: 'zephyr', name: 'Zephyr', element: 'gale', rarity: 5, maxHp: 100, attack: 16, skillCd: 3, maxEnergy: 60 },
];
export interface EnemyDef { kind: string; maxHp: number; damage: number; speed: number; atkInterval: number; aggro: number }
export const ENEMIES: Record<string, EnemyDef> = {
  mossling: { kind: 'mossling', maxHp: 40, damage: 5, speed: 1.8, atkInterval: 1.2, aggro: 6 },
  cinderbat: { kind: 'cinderbat', maxHp: 25, damage: 4, speed: 3, atkInterval: 0.9, aggro: 7 },
  stoneback: { kind: 'stoneback', maxHp: 90, damage: 9, speed: 1.2, atkInterval: 1.8, aggro: 5 },
};
export const LOOT = ['potion', 'oak_blade', 'wind_charm', 'frost_ring', 'gem_pouch'];
export const EQUIPPABLE = ['oak_blade', 'wind_charm', 'frost_ring'];
export const EQUIP_ATTACK_BONUS = 4;

export const GACHA = {
  cost: 160, hardPity: 90, softPity: 74, baseRate5: 0.016, rate4: 0.13,
  five: CHARACTERS.filter(c => c.rarity === 5).map(c => c.id).concat(['starglass']),
  four: CHARACTERS.filter(c => c.rarity === 4).map(c => c.id).concat(['moonsilver']),
  three: ['pebble', 'twine', 'ash_dust'],
};

export function mulberry(a: number): () => number {
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export interface GeneratedMap {
  w: number; h: number; solid: number[]; spawn: { x: number; y: number };
  enemies: { kind: string; pos: { x: number; y: number } }[];
  chests: { pos: { x: number; y: number }; loot: string }[];
}
export function generateMap(seed: number, w = 64, h = 64): GeneratedMap {
  const r = mulberry((seed ^ 0x9e3779b9) >>> 0);
  const solid = new Array(w * h).fill(0);
  const spawn = { x: w / 2 + 0.5, y: h / 2 + 0.5 };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const edge = x === 0 || y === 0 || x === w - 1 || y === h - 1;
    const near = Math.hypot(x + 0.5 - spawn.x, y + 0.5 - spawn.y) < 6;
    if (edge || (!near && r() < 0.12)) solid[y * w + x] = 1;
  }
  const free = (x: number, y: number) => !solid[y * w + x];
  const place = (minD: number) => {
    for (let i = 0; i < 1000; i++) {
      const x = 1 + Math.floor(r() * (w - 2)), y = 1 + Math.floor(r() * (h - 2));
      if (free(x, y) && Math.hypot(x + 0.5 - spawn.x, y + 0.5 - spawn.y) >= minD) return { x: x + 0.5, y: y + 0.5 };
    }
    return { x: spawn.x + minD, y: spawn.y };
  };
  const kinds = Object.keys(ENEMIES);
  const enemies = Array.from({ length: 12 }, (_, i) => ({ kind: kinds[i % kinds.length], pos: place(9) }));
  const chests = Array.from({ length: 6 }, (_, i) => ({ pos: place(3), loot: LOOT[i % LOOT.length] }));
  return { w, h, solid, spawn, enemies, chests };
}
