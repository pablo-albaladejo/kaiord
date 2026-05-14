<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `e2e/test-utils/`

## Purpose

Generic, SPA-agnostic Playwright utilities. Touch drag dispatch, viewport configs, performance helpers, verification helpers.

## Key Files

- `touch-drag.ts`, `touch-drag-native.ts`, `touch-helpers.ts`, `touch-event-dispatcher.ts` — touch-drag plumbing. `mobile-touch-drag.spec.ts` is the primary consumer; see `MOBILE-TOUCH-DRAG-SUMMARY.md` in `e2e/` for the rationale on the split (Playwright's native touchscreen API vs. dispatched touch events).
- `viewport-configs.ts` — pixel-exact viewport definitions reused across mobile specs.
- `performance-helpers.ts` — timing instrumentation for `calendar-performance.spec.ts`.
- `verification-helpers.ts` — assertion helpers (URL contains, element visible-then-stable, etc.).
- `index.ts` — module export surface.

## For AI Agents

### Working In This Directory

1. **No SPA-specific knowledge** here. If a helper needs to know about Dexie or stores, it belongs in `../helpers/`.
2. **Touch dispatchers are split** because Playwright's touchscreen API and dispatched events have different reliability characteristics across browsers.

## Dependencies

### External

- `@playwright/test`.

<!-- MANUAL: -->
