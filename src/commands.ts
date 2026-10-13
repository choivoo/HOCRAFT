/** Every user action is one command. Buttons, keys and menus only dispatch these ids. */
export const COMMANDS = [
  'player.move', 'player.sprint', 'combat.attack', 'combat.skill', 'combat.burst',
  'party.switch', 'world.interact', 'game.respawn', 'gacha.pull', 'file.save', 'file.load',
  'edit.undo', 'edit.redo', 'party.reorder', 'menu.toggle',
] as const;
export type CommandId = (typeof COMMANDS)[number];
export interface CommandPayload {
  'player.move': { dx: number; dy: number };
  'player.sprint': { on: boolean };
  'combat.attack': {}; 'combat.skill': {}; 'combat.burst': {};
  'party.switch': { index: number };
  'world.interact': {}; 'game.respawn': {};
  'gacha.pull': { count: 1 | 10 };
  'file.save': {}; 'file.load': { json: string };
  'edit.undo': {}; 'edit.redo': {};
  'party.reorder': { from: number; to: number };
  'menu.toggle': {};
}
