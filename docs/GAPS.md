# GAPS (known missing / unverified)

Verified: 30 unit tests, 38 e2e tests (19 x portrait/landscape), tsc clean, save round-trip on 6 samples.

| Area | Gap | Status |
|---|---|---|
| Platform | No APK/IPA; delivered as single HTML (+PWA when served from dist/). Needs Android SDK to wrap | OPEN |
| Real device | Only tested in headless Chromium emulation, never on a physical phone (touch feel, performance, safe areas) | OPEN |
| PWA | Service worker/manifest inactive inside single-file release/kairoa.html | PARTIAL |
| Content | One 64x64 field, 4 characters, 3 enemy kinds, no story, quests, audio, or real art (shapes only) | OPEN |
| Map | Minimap tap enlarges in place; no separate map screen | OPEN |
| F07 | e2e covers Ember+Tide only; other reactions in unit tests only | PARTIAL |
| UI | Pause button slightly overlaps first party portrait in landscape | OPEN |
| Names | Player name stored in localStorage only (no command/save field) | OPEN |
| Visual | Screenshots reviewed by eye only, no pixel diffing | OPEN |
