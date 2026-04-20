# @kaiord/workout-spa-editor

## 0.1.0

### Minor Changes

- 3d8b6df: Redesign Profile Manager with zone method system
  - Add zone method registry (Coggan, Friel, British Cycling, Karvonen, Daniels, Custom)
  - Replace auto/manual toggle with method dropdown per zone type
  - Show zone values in real units (watts, bpm, min/km) instead of percentages
  - Redesign Profile Manager layout: remove Edit Profile card, add Training Zones and Personal Data tabs
  - Add inline-editable profile name in dialog header
  - Support custom zone count (add/remove zones, 1-10 range)
  - Update LLM zones formatter to output real values with method names
  - Add migration from legacy `mode` field to `method` field

- bd2a385: Calendar-centric SPA redesign: week view as home page, Dexie.js persistence via PersistencePort, workout state machine (RAW->STRUCTURED->READY->PUSHED), bridge plugin protocol, AI batch processing with Spanish coaching language support, and library page refactor.
- 972fb38: Add sport-specific training zones: per-sport HR, power, and pace zone configs with auto/manual modes, tabbed zone editor in Profile Manager, AI zone indicator, sport-aware zones formatter, and profile migration from legacy format.
- 11dc56c: Add coaching platform integration with Train2Go Bridge extension support. Introduces CoachingSource port, registry pattern, and generic coaching activity cards in the calendar. Platform-agnostic architecture allows future coaching platforms (TrainingPeaks, etc.) with zero calendar code changes.

### Patch Changes

- b5b12a5: Replace hardcoded Lambda URL with VITE_GARMIN_LAMBDA_URL env var, migrate stale api.kaiord.com URL from localStorage, show Configure Garmin when URL is empty
- d29c5db: fix: context-aware keyboard shortcuts and custom context menu
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

- 99665b0: Add AI batch cost-confirmation dialog and Settings → Usage panel.

  The batch banner's "Process all with AI" button now opens a confirmation dialog showing the configured provider, estimated tokens (chars/3 heuristic), and estimated USD cost (per-provider blended rate) before dispatching the run. The new Settings → Usage tab renders cumulative AI token usage and cost for the current month plus the previous five, read live from the Dexie `usage` table.

  Closes the remaining two findings from the 2026-04-18 opsx-sync audit (`address-opsx-sync-drift`).

- 414f399: Add Train2Go Bridge status to Settings panel and rename tab from "Garmin" to "Extensions"
  - Rename Settings "Garmin" tab to "Extensions" to reflect multiple bridge support
  - Add Train2Go Bridge Extension status section (not installed / no session / connected)
  - Update FirstVisitState and NoBridgesState copy to mention both Garmin Connect and Train2Go

## 0.0.5

### Patch Changes

- 84e1776: Improve UX discoverability and feedback:
  - Add EmptyWorkoutState component showing guidance when workout has no steps
  - Add error explanation message when save button is disabled
  - Enhance step selection visual with ring effect and checkmark indicator
  - Add tooltip to drag handle with proper touch target (44x44px)
  - Add UndoRedoButtons to workout header with keyboard shortcut hints
  - Add selection hints for creating repetition blocks

- Updated dependencies
- Updated dependencies [791d3b2]
  - @kaiord/core@1.0.3

## 0.0.4

### Patch Changes

- Updated dependencies
  - @kaiord/core@1.0.2

## 0.0.3

### Patch Changes

- Updated dependencies
  - @kaiord/core@1.0.1

## 0.0.2

### Patch Changes

- Updated dependencies
  - @kaiord/core@0.1.3

## 0.0.1

### Patch Changes

- Updated dependencies
  - @kaiord/core@0.1.2
