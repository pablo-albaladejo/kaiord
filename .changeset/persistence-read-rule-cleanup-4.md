---
"@kaiord/workout-spa-editor": patch
---

chore(spa-editor): lock in no-Zustand-write-through guard for persisted entities

Adds `scripts/check-no-zustand-writethrough.mjs`, a `pnpm test:scripts`-wired static-import check that fails CI if a file under `packages/workout-spa-editor/src/store/**` imports `adapters/dexie/dexie-database` (relative, alias, barrel re-export, or dynamic import) or imports a `persistState` identifier — and if any file under `packages/workout-spa-editor/src/application/**` imports `dexie-database` at all. A small allowlist exempts explicit-user-action writers from the store rule. The application rule has no allowlist.
