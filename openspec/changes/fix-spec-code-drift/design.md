## Context

The live specs have accumulated eight implementation gaps identified by `/opsx-sync` (2026-04-20). Each gap is implementation-only — the spec requirement is stable and correct. Treating them as a single change keeps them discoverable (one PR, one changeset) and lets reviewers verify by reading the audit summary in `proposal.md`. The gaps touch three surfaces (SPA editor, VitePress docs, repo config), cross two hexagonal layers (application + adapters), and one spans Dexie persistence so a schema-version bump is required.

Current state per gap:

- `packages/workout-spa-editor/src/adapters/dexie/storage-probe.ts` reports `"failed"` but no consumer UI surfaces the message.
- `packages/workout-spa-editor/src/adapters/bridge/bridge-types.ts` defines `BridgeStatus = "verified" | "unavailable"`; pruning in `bridge-registry-helpers.ts` calls `map.delete(...)` directly.
- `packages/workout-spa-editor/src/store/train2go-store.ts` carries `lastDetectionTimestamp: number | null` but `train2go-store-actions.ts` calls `detectExtension()` unconditionally.
- `packages/docs/.vitepress/config.ts` has no `theme-color` head entry.
- `.changeset/config.json#linked[0]` lists the core + adapter packages plus `workout-spa-editor`, but omits the two bridge extensions.
- `packages/workout-spa-editor/src/application/workout-transitions.ts` updates `modifiedAt` only on `PUSHED→MODIFIED`.
- `packages/workout-spa-editor/src/application/batch-processor.ts` exposes `BatchProgress = { total, processed, succeeded, failed, current }` without `queued` or a per-workout array.
- `packages/workout-spa-editor/src/types/usage-schemas.ts` stores `totalTokens: number`.

## Goals / Non-Goals

**Goals:**
- Each of the eight spec requirements passes a runtime/integration test after this change.
- No spec text edits in this change — specs are already correct.
- Dexie migration for `UsageRecord` backfills legacy rows deterministically so nobody sees a mid-usage-panel zero.
- Telemetry / user-visible strings land in English; any l10n hook that already exists is preserved.
- Zero new ESLint / TS / test warnings; every touched file stays ≤100 LOC (tests exempt).

**Non-Goals:**
- Re-designing the bridge lifecycle state machine (REMOVED is being added as the minimum that the spec mandates; a future change can promote it to a formal timeline of transitions).
- Changing the SPA AI batch UX — only the schema shape and its renderer inputs.
- Touching group-B spec-wording drift (`adapter-contracts` regex, `spa-editor-context-menu` wording, `spa-ai-batch` ES glossary); those go in the follow-up sync PR.
- Docs-site redesign, favicon strategy, or any branding work beyond the single `theme-color` meta tag.

## Decisions

### 1. Storage-unavailable banner mounts in the editor root

Add a `StorageAvailabilityBanner` component mounted once in `WorkoutEditorLayout` (or equivalent top-level layout). It subscribes to a new `storage-store` that runs `probeStorage()` on app mount and exposes the underlying `HydrationStatus` (`"pending" | "complete" | "failed"`) from `adapters/dexie/storage-probe.ts`.

- **Why a store and not a hook**: Other surfaces (sync indicator, "Push to Garmin") need to react to the same probe result. Centralizing avoids duplicate probes and ensures a single banner.
- **Alternative considered**: Running `probeStorage()` from each persistence adapter at first write. Rejected because the UI needs an eager signal before the first write is attempted.
- **Layer**: Application (store) + adapter (component).

### 2. Introduce `REMOVED` bridge state, keep `unavailable` as soft-fail

Expand `BridgeStatus = "verified" | "unavailable" | "removed"`. Pruning in `bridge-registry-helpers.ts` transitions to `"removed"` and emits a user notification via the existing toast port; entries stay in the registry map (keyed by extensionId) until the user dismisses the toast or 24h passes, at which point they are deleted.

- **Why keep the entry**: The spec requires user-visible notification. Deleting silently loses the affordance.
- **Alternative considered**: Boolean `removed: true` on the existing type. Rejected because `BridgeStatus` is already a discriminated union elsewhere and adding a flag side-steps exhaustiveness checks.
- **Layer**: Adapter (bridge registry) + application (notification store).

### 2a. Bridge registry persistence across browser sessions

The bridge registry — including `status`, `lastSeen`, and the 24h-unavailable retention timer — SHALL be persisted to Dexie (one row per bridge keyed by extensionId). Without persistence, the "24h of UNAVAILABLE before REMOVED" timer and the "24h retention after REMOVED" timer both reset to zero on every browser session, which defeats the user-visible semantics of the lifecycle states.

- **Why Dexie**: It's already the SPA's persistence port for every other durable state (library, templates, usage, ai-provider). Adding a `bridges` store follows the existing pattern and keeps the persistence boundary centralized.
- **Alternative considered**: `localStorage` / `sessionStorage`. Rejected because the rest of the SPA's durable state lives in Dexie; splitting persistence strategies creates dev-prod parity and backup headaches.
- **Wall-clock caveat**: The 24h timer is wall-clock-based. A user whose system clock jumps (daylight-savings, NTP correction) could see earlier/later pruning. This is acceptable — the spec allows approximate lifecycle — but **SHALL NOT** be replaced by `performance.now()` (monotonic clock resets per session).
- **Layer**: Adapter (new Dexie table) + application (registry helpers read/write through it).

### 3. 30s detection cache in the Train2Go store action, not the hook

`detectAction` reads `lastDetectionTimestamp` + `extensionInstalled` from the store state: if both are true and the delta is <30s, return early with the cached result. This matches the base `spa-garmin-extension` pattern (which already caches) and keeps cache policy in one place.

- **Alternative considered**: Cache in the React hook via `useMemo`. Rejected because detection also runs from non-hook contexts (e.g., after push).
- **Layer**: Application (store action).

### 4. Theme-color meta derived from the shared brand token

Add a single entry to `.vitepress/config.ts` with the `theme-color` meta. The `content` value SHALL be sourced from the shared CSS token `--brand-bg-primary` (defined in the repo-root `styles/brand-tokens.css`) — not a duplicated hex literal — so the brand invariant from the `branding` spec holds mechanically. Options, in preference order:

1. Parse `styles/brand-tokens.css` at VitePress config load and extract the `--brand-bg-primary` value into the `head` array entry.
2. Export a tiny `theme-color.ts` module in the docs package that `require`s/imports the token string; the CSS file and TS module are both generated from a single source of truth in `styles/brand-tokens.css`.

Additionally, a CI/test invariant SHALL assert that the rendered docs `<meta name="theme-color">` value equals `--brand-bg-primary` from the shared token file; divergence fails the check. No CSS token rework, no favicon rework — this proposal scopes to the missing tag + the parity guard only.

- **Why not hardcode `#0f172a`**: Factor V (build/release/run) plus the `branding` spec's "No arbitrary hex values SHALL be used in component styles" rule. The docs site is a component of the brand system; the same token discipline applies.
- **Alternative considered**: Accept the hex duplication and rely on a reviewer to catch drift. Rejected because the audit that kicked off this proposal would not have flagged a silent divergence; the point of this change is mechanical enforcement.

### 5. Add bridge extensions to `.changeset/config.json#linked`

Append `@kaiord/garmin-bridge` and `@kaiord/train2go-bridge` to the existing `linked[0]` group. Both extensions already have `package.json` entries and run the publish pipeline; changesets versioning makes them move in lockstep with the rest of the monorepo, satisfying `cws-auto-publish` §"Changesets configuration".

### 6. Promote `modifiedAt` update into a central `onWorkoutMutation(draft, state)` helper

Rather than sprinkling `Date.now()` assignments across every action creator, introduce `onWorkoutMutation` in `application/workout-transitions.ts` that all mutators call before persisting. The helper unconditionally advances `modifiedAt` to a single `Date.now()` captured at the top of the current mutation batch — calling the helper twice within the same synchronous mutation is safe (both calls see the same captured timestamp); each fresh mutation writes a new timestamp, which is the intended behavior.

- **Why a helper**: The state machine has many mutators (edit-step, reorder, paste, delete, group, ungroup, etc.). A single chokepoint makes the invariant mechanical.
- **Alternative considered**: Zustand middleware. Rejected because mutations happen through different slice shapes and a middleware would couple unrelated state.
- **Layer**: Application.

### 7. `BatchProgress` becomes a richer structure with per-workout map

New shape:
```ts
type BatchProgress = {
  total: number;
  counts: { queued: number; processing: number; succeeded: number; failed: number };
  current: string | null; // workout id in flight
  byId: Record<string, 'queued' | 'processing' | 'succeeded' | 'failed'>;
};
```
- **Why `byId`**: The spec requires per-workout status in the progress UI. A map keyed by workout id is O(1) for the card renderer.
- **Alternative considered**: Array of `{ id, status }`. Rejected because the calendar panel needs random access by id, and ordering is already known from the week grid.
- **Layer**: Application (batch processor) + adapter (UI progress panel).

### 8. `UsageRecord` additive schema bump with Dexie migration

New shape (additive fields; `totalTokens` remains for backwards compatibility):
```ts
type UsageRecord = {
  id: string;
  timestamp: number;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number; // derived: inputTokens + outputTokens, kept for legacy readers
  costUsd: number;
  legacy?: boolean; // true only on rows backfilled by the v1 → v2 migration; the renderer shows `—` for `outputTokens` when true
};
```
Dexie version bump (`this.version(2).stores({...}).upgrade(tx => tx.table('usage').toCollection().modify(record => { ... }))`). For legacy rows with only `totalTokens`, set `inputTokens = totalTokens`, `outputTokens = 0`, and `legacy: true` — conservative: we know total usage happened but can't know the split. The `legacy: boolean` field is a persisted `UsageRecord` field (part of the v2 schema) and SHALL be passed through to the renderer so it can show `—` for `outputTokens` on legacy rows. New-version writes omit `legacy` (or set it to `false`); the renderer treats missing/`false` identically.

- **Alternative considered**: Drop `totalTokens` and compute everywhere. Rejected because external readers (tests, possible tooling) index on `totalTokens`.
- **Layer**: Adapter (Dexie).

## Risks / Trade-offs

- **[Bridge REMOVED state churn] → Mitigation**: Consumers that exhaustively switch on `BridgeStatus` will fail TypeScript until updated. This is intentional — the compiler surfaces the missing branches. Ship the type change atomically with the consumer updates.
- **[Dexie migration double-bump risk] → Mitigation**: If `UsageRecord` changes land alongside an unrelated Dexie bump on `main`, renumbering is fragile. Verify no other pending migration exists on merge; if conflict, resolve by renumbering during rebase, not during write.
- **[`modifiedAt` on every edit loosens debounce windows] → Mitigation**: The spec already requires this behavior; any downstream consumer assuming "changes only on push" was already wrong. Add a test covering `STRUCTURED` edit → `modifiedAt` advanced.
- **[Group-B spec edits delayed] → Mitigation**: Called out as non-goal; the follow-up change is already agreed with the user and will be a minimal doc-only PR.
- **[`inputTokens`/`outputTokens` for legacy rows is a guess] → Mitigation**: The persisted `legacy: true` field plus the renderer's `—` fallback keeps us honest — readers never see a fabricated `outputTokens: 0` without the caveat. Alternatively, expose the legacy rows to a one-off telemetry re-ingestion if the user ever wires real provider receipts.

## Migration Plan

1. Land `BridgeStatus` type change behind a feature-complete PR (atomic — no intermediate commits compile).
2. Dexie schema bump in a single coordinated version step: `usage` store gains input/output token fields AND a new `bridges` store is introduced. Both migrations run in the same `this.version(N).stores({...}).upgrade(...)` hook so users see one upgrade, not two.
3. Release via changesets (`pnpm exec changeset`): one changeset entry tagging `@kaiord/workout-spa-editor` as `minor` (new UI affordances, additive schema, new Dexie store), `@kaiord/docs` as `patch` (head meta tag + token-parsing helper), and a repo-root note for the `.changeset/config.json` edit.
4. Post-merge: run `/opsx-verify` on every modified spec; the 8 gaps should close without any spec rewrite.
5. No rollback needed beyond a normal revert — no irreversible data transforms (both Dexie migrations are additive and idempotent on re-run).

## Open Questions

- **`modifiedAt` on pure selection/navigation events**: Should selecting a step count as a mutation? The spec says "user edit", which clearly excludes selection; the helper wires into mutators only. Confirmed non-issue.
- **Bridge REMOVED retention window**: 24h is picked from analogy with the Garmin extension's session timeout — if the user prefers 7 days (to match "weeks-of-use" stories) update the design before implementing. Default stands at 24h unless challenged. Decision 2a (persist the registry to Dexie) resolves the across-session concern; the value itself is still a product question.
- **Legacy `totalTokens` split display policy**: "—" for `outputTokens` is proposed; an alternative is showing `totalTokens` under a combined "Tokens" column when `legacy`. Will defer until the usage panel renderer is touched.
