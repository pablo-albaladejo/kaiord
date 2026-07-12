<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/adapters/`

## Purpose

Port implementations. Each subdirectory holds the runtime code that satisfies a contract from `src/ports/` (Dexie tables, browser-extension bridges, an analytics backend, the Train2Go coaching scrape). Adapters are the only place in the SPA that's allowed to depend on `dexie`, `chrome.runtime`, or the Umami analytics global.

## Subdirectories

- `analytics/` — `createUmamiAnalytics(websiteId)`, the `Analytics` port impl wired by `main.tsx`.
- `bridge/` — discovery, ping/verify, transport, and operation-queue plumbing for the in-page extension bridges (Garmin + Train2Go).
- `dexie/` — `KaiordDatabase` class, schema versions v1–v13, per-table repositories, migrations, and a `createDexiePersistence()` factory that returns a `PersistencePort`.
- `train2go/` — Train2Go-specific record converters, coaching transport, sport map, fan-out and zones-sync orchestration (separate from `bridge/` because it sits on top of the bridge transport).

## For AI Agents

### Working In This Directory

1. **Adapter files are the only files that may `import "dexie"` or call `chrome.runtime.*` directly.**
2. **Repository surface must match the port type exactly.** When the port changes, the adapter is the second edit; tests pin both sides.
3. **Dexie writes flow through `db.transaction("rw", db.tables, fn)`.** `PersistencePort.transaction(fn)` is the boundary; application code MUST NOT import `db` to open its own transaction.

### Testing Requirements

- Repository tests run against a `fake-indexeddb` instance per test (set up in `src/test-setup.ts`).
- Bridge tests stub `chrome.runtime.sendMessage` and verify queue semantics, dedup, and timeout behavior.

### Common Patterns

- Factory exports: `createUmamiAnalytics(websiteId)`, `createDexiePersistence()`, etc. — never default exports.
- Side-effect-free top level: file load MUST NOT open IndexedDB or post bridge messages; that happens only when the factory is called.

## Dependencies

### Internal

- `../ports/*` (port contracts).
- `../types/*` (domain types).
- `../lib/*` (`crypto`, `scrub-analytics-string`, etc).

### External

- `dexie`, `dexie-react-hooks` (Dexie adapter only).
- `chrome` types (bridge + train2go adapters only).

<!-- MANUAL: -->

Treat this directory as the only place where browser-API or third-party SDK contact is allowed. If something imports `dexie` outside `adapters/dexie/`, that's a bug.
