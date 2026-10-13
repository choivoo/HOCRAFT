export type Element = 'ember' | 'tide' | 'frost' | 'gale';
export interface Vec { x: number; y: number }
export interface Character {
  id: string; name: string; element: Element; rarity: 4 | 5;
  maxHp: number; hp: number; energy: number; maxEnergy: number;
  attack: number; skillCd: number; skillCdLeft: number;
}
export interface Enemy {
  id: number; kind: string; pos: Vec; hp: number; maxHp: number;
  aura: Element | null; frozenFor: number; atkCd: number;
}
export interface Chest { id: number; pos: Vec; opened: boolean; loot: string }
export interface GameState {
  format: 'kairoa-save'; version: 1;
  tick: number; paused: boolean; seed: number;
  map: { w: number; h: number; solid: number[] /* w*h, 1 = blocked */ };
  player: { pos: Vec; facing: Vec; stamina: number; maxStamina: number; sprinting: boolean; attackCd: number; switchCd: number };
  party: Character[]; active: number;
  enemies: Enemy[]; chests: Chest[];
  inventory: Record<string, number>;
  gems: number; pity: number; owned: string[];
  extra: Record<string, unknown>;
}
export interface Engine {
  state: GameState;
  dispatch<C extends import('../commands').CommandId>(id: C, payload: import('../commands').CommandPayload[C]): void;
  step(dt: number): void;            // advance simulation (no-op while paused)
  serialize(): string;
  subscribe(fn: () => void): () => void;
}
