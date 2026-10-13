@AGENTS.md

## Claude Code

- Project skills live in `.agents/skills/` and are exposed to Claude Code through the `.claude/skills` symlink. Edit them under `.agents/skills/`.
- Cloud sessions install the pinned Node.js (`.nvmrc`) and run `npm ci` via the SessionStart hook in `.claude/settings.json`.
- Prefer `npm run check:fast` and `npm run test:focused -- PATH...` over the full `npm run check:pr` gate.
