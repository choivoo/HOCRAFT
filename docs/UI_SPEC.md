# Kairoa — UI Spec (mobile, landscape primary, portrait supported)

Layout follows common genre conventions so players of similar games feel at home; icons are new.

- **Left-bottom**: virtual joystick (move). Drag = move; far drag = walk faster.
- **Right-bottom**: Attack (large), Skill, Burst, Sprint, Interact (appears near objects).
- **Right edge**: 4 party portrait buttons (tap = `party.switch`), active highlighted, HP under each.
- **Top-left**: mini-map (tap opens map). **Top-right**: Pause button.
- **Top-center**: nothing in combat; area name toast on entering.
- **Pause menu**: Resume, Party, Inventory, Wish (gacha), Save, Load, Settings.
- **Keyboard (desktop testing)**: WASD move, Shift sprint, J attack, K skill, L burst, E interact,
  1-4 switch, Esc menu, Ctrl+Z undo, Ctrl+Shift+Z redo, Ctrl+S save.
- Every control calls a command by id (see `src/commands/ids.ts`); no logic lives in widgets.
