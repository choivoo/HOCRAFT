# Kairoa — Feature Spec

Kairoa is an original mobile open-world action RPG. It is a clean-room design: it shares only
*genre conventions* (explore a field, party of four, elemental combat, stamina, gacha) with
existing games. Names, characters, story, maps, art and numbers are all new.

Sources used: public, secondhand gameplay descriptions of the genre (controls, stamina, elemental
reactions, party switching) found by web search ([Epic Games beginner guide](https://store.epicgames.com/en-US/news/get-started-with-genshin-impact-with-our-beginners-guide),
[GameWith](https://gamewith.net/genshin-impact/article/show/40478)). No game code, assets or
data files were viewed. **There is no file format to be compatible with**; the save format is our
own JSON (`docs/SAVE_FORMAT.md`).

## Scope (this release)
One explorable field map, 4 playable characters, 3 enemy types, 4 elements, stamina, chests,
a gacha screen, save/load. Everything runs offline in a phone browser (PWA / single HTML file).

## Features and completion criteria
| ID | Feature | Done when |
|----|---------|-----------|
| F01 | Move with virtual joystick / keys | `player.move` changes position by speed*dt; blocked by solid tiles |
| F02 | Sprint uses stamina | `player.sprint` drains stamina, stops at 0, regenerates when idle |
| F03 | Basic attack | `combat.attack` damages enemies in range+facing, with cooldown |
| F04 | Elemental skill | `combat.skill` applies the active character's element, with cooldown |
| F05 | Burst | `combat.burst` needs full energy, consumes it, big damage |
| F06 | Party switch (4 members) | `party.switch` changes active member; 1s switch cooldown; fainted members cannot be chosen |
| F07 | Element reactions | Ember+Tide=Mist (x1.5), Frost+Tide=Deepfreeze (freeze 2s), Gale+any=Scatter (spreads to nearby), Ember+Frost=Meltdown (x1.8) |
| F08 | Enemies chase and attack | enemies within aggro range approach and damage the player |
| F09 | Party defeat and respawn | all members at 0 HP -> `game.respawn` restores at spawn with 50% HP |
| F10 | Chests and items | `world.interact` opens adjacent chest once, adds to inventory |
| F11 | Gacha | `gacha.pull` spends gems, 90-pull hard pity for top rarity, deterministic with seed |
| F12 | Save / load | `file.save` -> `file.load` round-trips with no data change, unknown fields preserved |
| F13 | Undo for inventory/party edits | `edit.undo` / `edit.redo` revert/replay party-order and equipment edits |
| F14 | Pause menu, HUD | HP bars, stamina ring, skill buttons visible; `menu.toggle` pauses the simulation |
| F15 | Mobile layout | at 390x844 and 844x390 all buttons >=44px and none overlap |
| F16 | Korean text | Korean names/labels render; name input accepts composed Hangul |
