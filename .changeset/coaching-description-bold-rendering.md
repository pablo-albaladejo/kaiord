---
"@kaiord/workout-spa-editor": patch
---

Render coaching activity descriptions with bold emphasis instead of literal `**` markers.

The train2go-bridge converts Train2Go's `<strong>X</strong>` HTML to markdown `**X**` before storing the description in Dexie. The dialog rendered the raw text via `whitespace-pre-line`, so users saw literal asterisks (`**Calentamiento:** 20 Z1 + 15' Z2`) instead of bold (`**Calentamiento:**` 20 Z1 + 15' Z2).

`formatCoachingDescription` now recognizes both shapes (`<strong>` HTML + `**markdown**`), and `DialogDescription` walks the same AST → `<strong>` React tree the sidebar already uses. Bold renders consistently in dialog and sidebar regardless of whether the upstream stored HTML or the bridge-converted markdown markers.
