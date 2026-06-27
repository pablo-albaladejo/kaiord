## Context

Train2Go coach instructions — free text plus YouTube/Dropbox links — are lost on
import. Two verified causes (see
`.omc/specs/deep-dive-trace-train2go-import-drops-coach-links.md`):

1. **Parse layer:** the Train2Go *weekly* response carries no descriptions; only
   the per-day `?source=sidebar` response does (`parseDailyHtml` →
   `extractDescription` → `anchorToMarkdown` produces `[label](url)`).
2. **Model layer:** the description lives only in SPA `raw.description`
   (sidebar-only). KRD has no workout-level free-text slot — only step `notes`
   (max 256) and `extensions` — so every export/push drops it.

Hexagonal layers touched: **domain** (`@kaiord/core` workout schema), **adapters**
(`@kaiord/zwo`, `@kaiord/fit`, `@kaiord/garmin*`), **application + UI**
(`@kaiord/workout-spa-editor` coaching use cases, train2go adapter, editor).

## Goals / Non-Goals

**Goals:**
- A first-class, canonical home in KRD for workout-level coach instructions.
- Coach description present after weekly import without a manual "open day" step.
- Preserve instructions on export (full to ZWO; best-effort to FIT/Garmin) and make
  them visible/editable in the editor.

**Non-Goals:**
- Eager prefetch of every day on weekly sync (network cost).
- Lossless FIT/Garmin round-trip of long descriptions (format-limited).
- New Train2Go endpoints or weekly-parser changes.
- Rich media embeds — links stay as markdown/text.

## Decisions

### D1 — Add optional `notes` to `workoutSchema` (domain)
Add `notes: z.string().optional()` at the workout level in
`packages/core/src/domain/schemas/workout.ts`, distinct from step `notes` and
`name`. No length cap in the domain (adapters truncate at their boundary).
- **Why `notes` over `description`:** symmetry with the existing step-level `notes`
  and FIT's `wkt_step.notes` semantics. ZWO maps it to its own `description`.
- **Why not `extensions.coach.description`:** the escape hatch is for
  adapter/unknown namespaces; coach instructions are first-class workout data and
  belong in the schema so all adapters see them uniformly.
- **Layer:** domain only; additive + optional ⇒ no breaking change. Document in
  `docs/krd-format.md`.

### D2 — Prefetch-on-demand in the application convert path
Ensure the coach `description` is present **before** KRD is built. Reuse the
existing `expandDay` use case (`expand-day.ts`). Place the guard in the application
convert use cases (`convertCoachingActivity`, `convertCoachingActivityManual`,
`convertCoachingActivityWithAi`) so every caller — not just the dialog — benefits:
if `activity.description === undefined`, `await expandDay(...)` then re-read the
activity. A persisted `""` is "known empty" and skips the fetch.
- **Why application, not UI:** single source of truth; the dialog already
  lazy-loads on open, but convert/export must not depend on the dialog having been
  opened. Ports already available to these use cases: `CoachingTransport`,
  `CoachingRepository`.
- **Alternative considered:** gate the convert button in the UI until description
  loads — rejected (duplicates logic, misses non-dialog callers).
- **Layer:** application; no new port (reuses `CoachingTransport`).

### D3 — ZWO maps workout `notes` ↔ ZWO `description` (canonicalize)
ZWO currently round-trips its workout `description` via `extensions.zwift.description`.
Promote it: the ZWO converter maps `description` ↔ KRD workout `notes` as the
canonical home. `extensions.zwift.*` keeps ZWO-only metadata (author, tags) that
has no KRD field.
- **Why:** avoid two sources of truth for the same concept. Existing ZWO
  round-trip tests that assert `extensions.zwift.description` must be updated to
  assert workout-level `notes` (with a compatibility read if needed).
- **Layer:** `@kaiord/zwo` adapter.

### D4 — FIT/Garmin best-effort step note (asymmetric)
On **export**, if KRD workout `notes` is present, attach it (leading 256 chars)
to the first workout step's `notes` when that step has none, so Garmin shows it.
On **import** (FIT→KRD), do NOT lift step notes into workout `notes` (ambiguous —
a step note may be genuinely step-scoped). The asymmetry is intentional and
documented; the export loss is surfaced per `conversion-loss-honesty`.
- **Layer:** `@kaiord/fit` (writer), inherited by `@kaiord/garmin*` push.

### D5 — Editor exposes workout-level notes
Add a workout-level notes field to the editor that reads/writes `krd.workout.notes`
through the existing workout-store → save → Dexie path (editor runtime in Zustand;
persisted via the normal save). Sidebar continues to render `raw.description`.
- **Layer:** SPA UI + workout-store.

## Risks / Trade-offs

- [ZWO description double-mapping] → Canonicalize on `notes` in one PR; update ZWO
  round-trip tests in the same change; keep a tolerant read of legacy
  `extensions.zwift.description` if present so old KRD still imports.
- [FIT truncation drops links when notes > 256] → Documented best-effort;
  surface via `conversion-loss-honesty`; full text remains in KRD + ZWO + editor.
- [Prefetch latency on convert] → Single per-day fetch only when description
  missing; show the existing AI/convert overlay; failures fall back to
  convert-without-description (no hard error).
- [PII leakage] → Coach text MUST NOT be interpolated into `console.*`/toast first
  args under SPA `{components,hooks,lib}` (mechanical guard `check-no-pii-leakage`).
- [Coverage gates] → 80% core / 70% frontend; add unit + round-trip tests.

## Migration Plan

Additive, non-breaking: `notes` is optional. No data migration — existing
workouts simply have no `notes`. No Dexie version bump required (the field lives
inside the already-stored `krd` blob). Rollback = revert the change; older code
ignores the unknown optional field.

## Open Questions

- Final field name `notes` vs `description` at workout level (recommend `notes`).
- Whether to also expose workout `notes` in TCX/GCN beyond FIT/ZWO (out of scope
  unless those formats have a clean home).
- Exact editor placement/affordance for the notes field (settle in apply).
