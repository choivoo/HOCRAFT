# Kairoa (repo: HOCRAFT)

Original mobile open-world action RPG, TypeScript + Vite, canvas 2D, offline, packaged as a
single HTML file (installable as PWA). Mobile-first (touch), keyboard only for desktop testing.

## Clean-room rules
- Never view, decompile or copy code/assets/data of any existing game or any open-source clone.
- Evidence = public gameplay descriptions only (see docs/SPEC.md). All names, art, numbers are original.
- No third-party game names, logos, characters, fonts or icons. General libraries are fine.

## Layout
- `src/commands.ts` command ids + payload types (single source of truth for actions)
- `src/core/` pure game logic, no DOM. `createEngine(seed)` implements `Engine` (types.ts)
- `src/data/` characters, enemies, map generation (pure data/functions)
- `src/ui/` canvas renderer, touch controls, HUD, menus; only dispatches commands
- `tests/` vitest; `e2e/` playwright (mobile viewport); `docs/` SPEC, UI_SPEC, GAPS

## Commands
`npm run dev` · `npm test` · `npm run build` (-> dist/index.html single file) · `npm run e2e`

## Definition of done
Every row of docs/SPEC.md has an automated test; `npm test` and `npm run e2e` pass; save
round-trip test passes on all `samples/*.json`; GAPS.md lists what is missing.
