---
"@kaiord/workout-spa-editor": minor
"@kaiord/core": minor
"@kaiord/zwo": minor
"@kaiord/fit": minor
---

Preserve Train2Go coach instructions (including YouTube/Dropbox links) through
import → KRD → export.

- **KRD**: `workoutSchema` gains an optional workout-level `notes` field for
  coach instructions (distinct from per-step `notes`), documented in the KRD
  format spec. No length cap in KRD; adapters truncate best-effort.
- **ZWO**: workout-level `notes` round-trips as the ZWO workout `description`
  (legacy `extensions.zwift.description` still read for backward compatibility).
- **FIT/Garmin**: workout-level `notes` are attached best-effort to the first
  step's note, truncated to the 256-char FIT limit (an acknowledged
  format constraint, surfaced via the existing truncation warning).
- **SPA editor**: the coach description now flows into the converted workout's
  KRD `notes` (not just the sidebar `raw.description`), is prefetched on demand
  before AI/manual conversion when a weekly import left it unloaded, and is
  viewable/editable in the workout metadata editor.
