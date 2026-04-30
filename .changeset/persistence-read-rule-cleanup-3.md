---
"@kaiord/workout-spa-editor": patch
---

refactor(spa-editor): split AI store into persisted slice (Dexie/useLiveQuery) and runtime slice (Zustand)

Persisted state (providers, customPrompt) now lives in IndexedDB and is read via `useAiProvidersLive` / `useAiCustomPromptLive`; mutations go through application use cases against `PersistencePort`. Runtime-only state (`selectedProviderId`, `generation`) stays in a focused Zustand store. The legacy `useAiStore` and `useAiHydration` shim are deleted.
