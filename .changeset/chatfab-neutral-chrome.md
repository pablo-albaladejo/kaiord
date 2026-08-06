---
"@kaiord/workout-spa-editor": patch
---

Repaint the chat FAB from raw sky-blue to neutral floating chrome (`bg-surface-elevated` + `border-edge` + `text-ink-strong`) — it is an entry to a route present on every screen, not any surface's primary action, so it gets no magenta. Also extends the marketing-token boundary lint to markdown (prose could smuggle `--mkt-*` into docs unchecked) and clears the two stale `EditorWorkflowBar` references left in docs.
