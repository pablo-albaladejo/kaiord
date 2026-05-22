---
"@kaiord/workout-spa-editor": patch
---

chore: SSR guard the `__KAIORD_DB__` dev-only exposure with `typeof window !== "undefined"` so the module is safe to import from node tooling that doesn't provide a DOM. Matches the symmetric `__KAIORD_WORKOUT_STORE__` guard in `workout-store.ts`. Production builds are unaffected — Vite tree-shakes the `import.meta.env.DEV` block.
