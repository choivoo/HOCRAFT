# GAPS (known missing / unverified)

Status legend: OPEN, PARTIAL, DONE. Update after each `npm test` / `npm run e2e` run.

| Area | Gap | Status |
|---|---|---|
| e2e | Tests written against the contract; not yet run green against real UI/engine | OPEN |
| PWA | SW/manifest inactive inside single-file release/kairoa.html (needs hosting from dist/) | PARTIAL |
| Gacha | UI has no per-count (data-count) assertion beyond a single pull | OPEN |
| F07 | Only Ember+Tide asserted in e2e; other reactions in unit tests only | PARTIAL |
| Visual | Screenshots in e2e/shots are reviewed manually, no pixel diffing | OPEN |
| Audio/Settings | Not in SPEC; Settings menu entry untested | OPEN |
