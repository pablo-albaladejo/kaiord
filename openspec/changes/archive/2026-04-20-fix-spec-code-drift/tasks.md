## 1. Repo-level config

- [x] 1.1 Add `@kaiord/garmin-bridge` and `@kaiord/train2go-bridge` to the first `linked` group in `.changeset/config.json`
- [x] 1.2 Add a failing test to `scripts/` (new `check-changeset-config.test.mjs`) asserting both bridge packages appear in `linked[0]`; wire into `pnpm test:scripts`

## 2. Documentation site — theme-color meta tag

- [x] 2.1 Write failing test asserting the docs `theme-color` meta tag equals `--brand-bg-primary` parsed from `styles/brand-tokens.css` (not a duplicated hex literal)
- [x] 2.2 Add a helper `readBrandTokenColor('--brand-bg-primary')` in the docs package (or shared location) that parses `styles/brand-tokens.css` synchronously at VitePress config load
- [x] 2.3 Wire the helper output into `packages/docs/.vitepress/config.ts` `head` array as `['meta', { name: 'theme-color', content: <parsed value> }]`
- [x] 2.4 Add a build-output assertion test confirming the rendered `/docs/index.html` contains the `theme-color` meta tag with the exact parsed token value
- [x] 2.5 Add a CI invariant (grep-based or unit) asserting no file under `packages/docs/` hardcodes the hex `#0f172a` — the value must come from the token

## 3. SPA — storage-unavailable banner (spa-persistence-port)

- [x] 3.1 Write failing test for a new `storage-store` in `packages/workout-spa-editor/src/store/storage-store.ts` asserting `probe()` transitions `status` from `"checking"` → `"ok" | "failed"` and is idempotent
- [x] 3.2 Implement `storage-store` calling `probeStorage()` on first subscription
- [x] 3.3 Write failing component test for `StorageAvailabilityBanner` asserting it renders the exact string when `status === "failed"` and renders nothing otherwise
- [x] 3.4 Implement `StorageAvailabilityBanner` in `packages/workout-spa-editor/src/components/molecules/StorageAvailabilityBanner/`
- [x] 3.5 Mount `StorageAvailabilityBanner` once in the editor top-level layout; add integration test asserting single-mount invariant across route changes

## 4. SPA — BridgeStatus REMOVED state (spa-bridge-protocol)

- [x] 4.1 Write failing type-level test asserting `BridgeStatus` includes `"removed"` and that an exhaustive switch without a `default` branch type-errors when `"removed"` is missing
- [x] 4.2 Update `BridgeStatus` in `packages/workout-spa-editor/src/adapters/bridge/bridge-types.ts` to `"verified" | "unavailable" | "removed"`
- [x] 4.3 Update every exhaustive consumer (grep `BridgeStatus`) to handle `"removed"`; compile error-driven
- [x] 4.4 Write failing test for `bridge-registry-helpers.ts` pruning: 24h-unavailable entry transitions to `status: "removed"` and fires toast; second trigger after another 24h deletes the entry
- [x] 4.5 Refactor `bridge-registry-helpers.ts` pruning path to transition → notify → deferred delete
- [x] 4.6 Write failing Dexie integration test: bridge registry persists across browser sessions — seed a bridge entry with `status: "unavailable"` and `lastSeen: Date.now() - 22h`, reload the SPA, confirm the pruning timer resumes from the persisted `lastSeen` (not restarts from zero)
- [x] 4.7 Add a `bridges` store to the SPA Dexie database (new schema version bump if needed); migrate reads/writes in `bridge-registry-helpers.ts` to go through it
- [x] 4.8 Document the wall-clock-based timer caveat in `packages/workout-spa-editor/src/adapters/bridge/README.md` (per design Decision 2a)
- [x] 4.9 Non-regression: add a test (or CI grep invariant) asserting that only the new `bridges` store is persisted in Dexie — `garmin-store` and `train2go-store` MUST remain in-memory Zustand with no `persist(` middleware and no Dexie writes. Reference the Dexie-vs-Zustand boundary clause in `proposal.md` and the `CLAUDE.md` state-management rule

## 5. SPA — Train2Go 30s detection cache (spa-train2go-extension)

- [x] 5.1 Write failing test for `detectAction` in `packages/workout-spa-editor/src/store/train2go-store-actions.ts`: cached+fresh short-circuits; cached+stale re-pings; never-detected always pings
- [x] 5.2 Implement the cache guard at the top of `detectAction` reading `lastDetectionTimestamp` and `extensionInstalled` from `get()`
- [x] 5.3 Verify no regression in the Settings > Extensions Train2Go detection UX (integration test)

## 6. SPA — modifiedAt on every edit (spa-workout-state-machine)

- [x] 6.1 Write failing tests for `onWorkoutMutation(draft, state)` helper in `packages/workout-spa-editor/src/application/workout-transitions.ts`: advances `modifiedAt`, is idempotent, preserves non-mutating actions
- [x] 6.2 Implement `onWorkoutMutation` and route every KRD mutator (edit step, reorder, paste, delete, group, ungroup, lap edit, metadata edit) through it
- [x] 6.3 Write failing tests for STRUCTURED- and READY-state edits asserting `modifiedAt` advances without state change
- [x] 6.4 Write failing test for selection-only actions asserting `modifiedAt` is unchanged

## 7. SPA — BatchProgress per-workout status (spa-calendar)

- [x] 7.1 Write failing unit test for `BatchProgress` shape in `packages/workout-spa-editor/src/application/batch-processor.ts`: `{ total, counts, current, byId }`
- [x] 7.2 Update `BatchProgress` type and every emit-site to populate `byId` and `counts`
- [x] 7.3 Write failing test asserting per-workout status transitions (`queued → processing → succeeded|failed`) and `counts.*` increments
- [x] 7.4 Update the batch-progress panel component to render per-card status from `byId`; add snapshot/integration test

## 8. SPA — UsageRecord input/output tokens + Dexie migration (spa-ai-batch)

- [x] 8.1 Write failing schema test for `UsageRecord` in `packages/workout-spa-editor/src/types/usage-schemas.ts`: `inputTokens`, `outputTokens`, `totalTokens`, `costUsd` present; `totalTokens === inputTokens + outputTokens` invariant
- [x] 8.2 Extend the Zod schema with the new fields
- [x] 8.3 Write failing Dexie integration test: version upgrade backfills legacy rows (`inputTokens ← totalTokens`, `outputTokens ← 0`, `legacy: true`)
- [x] 8.4 Bump the `usage` store schema to version 2 with the migration `upgrade` hook
- [x] 8.5 Update the usage-panel renderer to show `—` for `outputTokens` on legacy rows; add a rendering test
- [x] 8.6 Update every call site writing `UsageRecord` to pass `inputTokens` and `outputTokens` from the AI provider response

## 9. Verification and release

- [x] 9.1 Run `pnpm -r test` — all tests pass, zero warnings
- [x] 9.2 Run `pnpm -r build` — zero build warnings
- [x] 9.3 Run `pnpm lint` — zero errors, zero warnings
- [x] 9.4 Run `/opsx-verify fix-spec-code-drift` — all eight spec deltas verified
- [x] 9.5 Run `/opsx-verify` on each of the eight affected live specs to confirm no regression (`spa-persistence-port`, `spa-bridge-protocol`, `spa-train2go-extension`, `branding`, `cws-auto-publish`, `spa-workout-state-machine`, `spa-calendar`, `spa-ai-batch`)
- [x] 9.6 Add a changeset (`pnpm exec changeset`) — `@kaiord/workout-spa-editor: minor`, `@kaiord/docs: patch`, note the `.changeset/config.json` edit as a monorepo repo-root item
- [x] 9.7 Open the PR with the audit summary in the description (link back to the `/opsx-sync` pass that found the gaps)
- [x] 9.8 After PR merge, run `/opsx-archive fix-spec-code-drift`
