## Why

Coach instructions imported from Train2Go — including the YouTube/Dropbox links
the coach attaches — are silently dropped: they never reach the canonical KRD
workout and are absent from the SPA right after a weekly import. The instructions
are the point of the session for the athlete, so losing them on import and on
every export/Garmin push is a real data-fidelity defect.

## What Changes

- **Prefetch-on-demand of coach descriptions.** Because the Train2Go *weekly*
  endpoint returns no descriptions (only the per-day `?source=sidebar` response
  does), opening or converting/exporting a coaching activity whose `description`
  is not yet populated triggers a single `expandDay`/`readDay` fetch so the
  description (with markdown `[label](url)` links) becomes available without a
  manual "open day" step.
- **New workout-level notes field in KRD.** Add an optional workout-level free-text
  `notes` field to the core `workoutSchema` (the canonical home for coach
  instructions, distinct from per-step `notes`). Document it in `docs/krd-format.md`.
- **Coach description flows into KRD.** The Train2Go → coaching → workout builder
  writes the coach description into the new KRD workout-level `notes` (in addition
  to the existing `raw.description` used for sidebar display).
- **Export preservation.** Map the KRD workout-level `notes` to the ZWO workout
  `description` (full fidelity, round-trips via `extensions`). For FIT/Garmin —
  which support only step-level notes capped at 256 chars — attach a best-effort,
  256-char-truncated note with a defined truncation rule.
- **Editor support.** Surface the workout-level coach notes in the workout editor
  as a viewable/editable field; edits persist.

## Capabilities

### New Capabilities
- `train2go-coach-links`: end-to-end preservation of Train2Go coach instructions
  and embedded links — prefetch-on-demand availability, mapping into the canonical
  KRD workout-level notes, export/push preservation (full to ZWO, best-effort to
  FIT/Garmin), and editor visibility/editability.

### Modified Capabilities
- `krd-format`: the workout schema gains an optional workout-level `notes` field
  (free text, distinct from step-level `notes`), with documented export semantics
  and round-trip expectations.

> The coaching-side behavior (prefetch-on-demand, threading the description into
> the KRD workout) is captured as ADDED requirements under the new
> `train2go-coach-links` capability rather than rewriting `spa-coaching-integration`'s
> existing convert use cases — those keep their current behavior and gain the new
> KRD-notes/prefetch concerns additively.

## Impact

- **Domain (`@kaiord/core`)**: `packages/core/src/domain/schemas/workout.ts`
  (new optional `notes`); `docs/krd-format.md`.
- **Adapters**: `@kaiord/zwo` (workout `description` ↔ KRD workout notes);
  `@kaiord/fit` (best-effort 256-char step note on export); `@kaiord/garmin` /
  `@kaiord/garmin-connect` (push path inherits the FIT/GCN note).
- **SPA (`@kaiord/workout-spa-editor`)**: coaching application
  (`expand-day.ts`, `convert-coaching-activity*.ts`, `coaching-workout-builder.ts`,
  `build-coaching-draft-krd.ts`), `train2go-record.converter.ts`, and the editor UI.
- **Bridge (`@kaiord/train2go-bridge`)**: no parser change — `readDay`/`parseDailyHtml`
  remains the description source of truth (weekly endpoint carries no descriptions).
- **Conversion honesty**: the FIT/Garmin 256-char step-only limit is an acknowledged
  external-format constraint (best-effort, surfaced per `conversion-loss-honesty`),
  not a defect.
- No breaking changes to the public API: the new KRD field is optional and additive.
