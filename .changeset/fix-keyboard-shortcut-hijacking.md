---
"@kaiord/workout-spa-editor": patch
---

fix: context-aware keyboard shortcuts and custom context menu

- Keyboard shortcuts (Cmd+C, Cmd+V, Cmd+X, Cmd+A, Cmd+G, Escape, Alt+Arrow) only call
  `preventDefault()` when the app action is meaningful; otherwise the browser handles the
  event natively (e.g., native text copy when no step is selected)
- Exact modifier matching: Cmd+Shift+C, Cmd+Shift+S, etc. pass through to the browser
- Added Cmd+X (Cut) support: copy + delete in one action
- Custom right-click context menu on the step list with Cut, Copy, Paste, Delete,
  Select All, Group, and Ungroup actions (with keyboard shortcut hints and ARIA attributes)
- Native context menu fallback when no app actions are applicable
- Extended form element passthrough to include contentEditable elements
- Added `hasClipboardContent()` to clipboard store for synchronous content checks
