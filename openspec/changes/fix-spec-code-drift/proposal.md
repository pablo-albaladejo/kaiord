## Why

An `/opsx-sync` audit against the 22 live specs and 24 archived changes surfaced eight cases where the code diverged from specs — in every case the spec describes intended behavior and the code is incomplete. Because the specs are the source of truth, we bring the code up to spec rather than weakening the specs. Fixing all drift in one proposal keeps the follow-up edits to group B (spec wording aligned to stable code reality) uncontested.

## What Changes

- **spa-persistence-port**: Implement the "Storage unavailable — changes in this session won't be saved" banner that reacts to `probeStorage() === "failed"`. Currently the probe exists but its result is ignored by the UI.
- **spa-bridge-protocol**: Extend `BridgeStatus` with a `REMOVED` state (in addition to `VERIFIED` and `UNAVAILABLE`) and route pruning logic through that state with user notification, replacing the silent `map.delete(...)` path.
- **spa-train2go-extension**: Wire the 30-second detection cache so `detect()` short-circuits when `lastDetectionTimestamp` is fresh and `extensionInstalled === true`.
- **docs-site / branding**: Add `<meta name="theme-color">` to the VitePress docs config so the docs surface matches the landing page and editor.
- **cws-auto-publish**: Add `@kaiord/garmin-bridge` and `@kaiord/train2go-bridge` to `.changeset/config.json#linked` so the spec's "extensions participate in changesets versioning" requirement holds mechanically.
- **spa-workout-state-machine**: Update `modifiedAt` on any user edit to the KRD, not only on the `PUSHED→MODIFIED` transition; the spec requires edits from `STRUCTURED` and `READY` to also bump the timestamp.
- **spa-calendar**: Expand `BatchProgress` to carry per-workout status (including the `queued` bucket) so the progress UI can render the spec-required "per-workout status (success/fail/queued)" detail.
- **spa-ai-batch**: Split `UsageRecord.totalTokens` into `inputTokens` + `outputTokens` (keep `totalTokens` as a derived convenience) to satisfy the spec's granularity requirement for the usage panel.

No breaking changes to public library APIs; the SPA changes are internal to `@kaiord/workout-spa-editor`. The `UsageRecord` schema change is a non-breaking Dexie schema bump (additive fields) with a migration that fills `inputTokens`/`outputTokens` from `totalTokens` when absent.

**Dexie-vs-Zustand boundary (per `CLAUDE.md` state-management rule "Editor runtime → Zustand. Persisted data → Dexie. Local UI → React state.")**: the new `bridges` Dexie store in this proposal persists only the registry record for each bridge (extensionId, status, lastSeen, timer anchors). The transient bridge runtime stores (`garmin-store`, `train2go-store`) and the `workout-store` remain non-persistent Zustand state — they are NOT to be piped through the Dexie persistence boundary by this change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

No requirement-level changes — every edit implements behavior that the current spec already mandates. The audit concluded that specs are correct and code is incomplete. Because the proposal changes only implementation, no spec deltas are required and `specs/` stays empty.

## Impact

- **Affected packages**:
  - `@kaiord/workout-spa-editor` (storage banner, bridge state, Train2Go cache, `modifiedAt` on edit, `BatchProgress`, `UsageRecord`)
  - `packages/docs` (VitePress `theme-color` meta)
  - Repo root: `.changeset/config.json` (linked array)
- **Layers**: Adapters (SPA Dexie + Zustand stores, extension bridges), Application (state-machine transitions, batch processor), and Docs infra. No `@kaiord/core` domain changes.
- **Dexie migration**: Additive schema bump on `usage` store; backfill `inputTokens`/`outputTokens` from legacy `totalTokens` rows.
- **Referenced specs**: `openspec/specs/spa-persistence-port/spec.md`, `spa-bridge-protocol/spec.md`, `spa-train2go-extension/spec.md`, `docs-site/spec.md`, `branding/spec.md`, `cws-auto-publish/spec.md`, `spa-workout-state-machine/spec.md`, `spa-calendar/spec.md`, `spa-ai-batch/spec.md`.
- **Out of scope**: Group B spec edits (`adapter-contracts`, `spa-editor-context-menu`, `spa-ai-batch` ES glossary) ship as a separate `opsx-sync` follow-up since those are pure spec-wording alignments to stable code.
