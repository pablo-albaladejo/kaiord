## 1. Repo-level config

- [ ] 1.1 Add `@kaiord/garmin-bridge` and `@kaiord/train2go-bridge` to the first `linked` group in `.changeset/config.json`
- [ ] 1.2 Add a failing test to `scripts/` (new `check-changeset-config.test.mjs`) asserting both bridge packages appear in `linked[0]`; wire into `pnpm test:scripts`

## 2. Documentation site — theme-color meta tag

- [ ] 2.1 Add `['meta', { name: 'theme-color', content: '#0f172a' }]` to the `head` array in `packages/docs/.vitepress/config.ts`
- [ ] 2.2 Add a build-output assertion test (or a VitePress integration snapshot) confirming the rendered `/docs/index.html` contains the `theme-color` meta tag

## 3. SPA — storage-unavailable banner (spa-persistence-port)

- [ ] 3.1 Write failing test for a new `storage-store` in `packages/workout-spa-editor/src/store/storage-store.ts` asserting `probe()` transitions `status` from `"checking"` → `"ok" | "failed"` and is idempotent
- [ ] 3.2 Implement `storage-store` calling `probeStorage()` on first subscription
- [ ] 3.3 Write failing component test for `StorageAvailabilityBanner` asserting it renders the exact string when `status === "failed"` and renders nothing otherwise
- [ ] 3.4 Implement `StorageAvailabilityBanner` in `packages/workout-spa-editor/src/components/molecules/StorageAvailabilityBanner/`
- [ ] 3.5 Mount `StorageAvailabilityBanner` once in the editor top-level layout; add integration test asserting single-mount invariant across route changes

## 4. SPA — BridgeStatus REMOVED state (spa-bridge-protocol)

- [ ] 4.1 Write failing type-level test asserting `BridgeStatus` includes `"removed"` and that an exhaustive switch without a `default` branch type-errors when `"removed"` is missing
- [ ] 4.2 Update `BridgeStatus` in `packages/workout-spa-editor/src/adapters/bridge/bridge-types.ts` to `"verified" | "unavailable" | "removed"`
- [ ] 4.3 Update every exhaustive consumer (grep `BridgeStatus`) to handle `"removed"`; compile error-driven
- [ ] 4.4 Write failing test for `bridge-registry-helpers.ts` pruning: 24h-unavailable entry transitions to `status: "removed"` and fires toast; second trigger after another 24h deletes the entry
- [ ] 4.5 Refactor `bridge-registry-helpers.ts` pruning path to transition → notify → deferred delete

## 5. SPA — Train2Go 30s detection cache (spa-train2go-extension)

- [ ] 5.1 Write failing test for `detectAction` in `packages/workout-spa-editor/src/store/train2go-store-actions.ts`: cached+fresh short-circuits; cached+stale re-pings; never-detected always pings
- [ ] 5.2 Implement the cache guard at the top of `detectAction` reading `lastDetectionTimestamp` and `extensionInstalled` from `get()`
- [ ] 5.3 Verify no regression in the Settings > Extensions Train2Go detection UX (integration test)

## 6. SPA — modifiedAt on every edit (spa-workout-state-machine)

- [ ] 6.1 Write failing tests for `onWorkoutMutation(draft, state)` helper in `packages/workout-spa-editor/src/application/workout-transitions.ts`: advances `modifiedAt`, is idempotent, preserves non-mutating actions
- [ ] 6.2 Implement `onWorkoutMutation` and route every KRD mutator (edit step, reorder, paste, delete, group, ungroup, lap edit, metadata edit) through it
- [ ] 6.3 Write failing tests for STRUCTURED- and READY-state edits asserting `modifiedAt` advances without state change
- [ ] 6.4 Write failing test for selection-only actions asserting `modifiedAt` is unchanged

## 7. SPA — BatchProgress per-workout status (spa-calendar)

- [ ] 7.1 Write failing unit test for `BatchProgress` shape in `packages/workout-spa-editor/src/application/batch-processor.ts`: `{ total, counts, current, byId }`
- [ ] 7.2 Update `BatchProgress` type and every emit-site to populate `byId` and `counts`
- [ ] 7.3 Write failing test asserting per-workout status transitions (`queued → processing → succeeded|failed`) and `counts.*` increments
- [ ] 7.4 Update the batch-progress panel component to render per-card status from `byId`; add snapshot/integration test

## 8. SPA — UsageRecord input/output tokens + Dexie migration (spa-ai-batch)

- [ ] 8.1 Write failing schema test for `UsageRecord` in `packages/workout-spa-editor/src/types/usage-schemas.ts`: `inputTokens`, `outputTokens`, `totalTokens`, `costUsd` present; `totalTokens === inputTokens + outputTokens` invariant
- [ ] 8.2 Extend the Zod schema with the new fields
- [ ] 8.3 Write failing Dexie integration test: version upgrade backfills legacy rows (`inputTokens ← totalTokens`, `outputTokens ← 0`, `legacy: true`)
- [ ] 8.4 Bump the `usage` store schema to version 2 with the migration `upgrade` hook
- [ ] 8.5 Update the usage-panel renderer to show `—` for `outputTokens` on legacy rows; add a rendering test
- [ ] 8.6 Update every call site writing `UsageRecord` to pass `inputTokens` and `outputTokens` from the AI provider response

## 9. Verification and release

- [ ] 9.1 Run `pnpm -r test` — all tests pass, zero warnings
- [ ] 9.2 Run `pnpm -r build` — zero build warnings
- [ ] 9.3 Run `pnpm lint` — zero errors, zero warnings
- [ ] 9.4 Run `/opsx-verify fix-spec-code-drift` — all eight spec deltas verified
- [ ] 9.5 Run `/opsx-verify` on each of the eight affected live specs to confirm no regression (`spa-persistence-port`, `spa-bridge-protocol`, `spa-train2go-extension`, `branding`, `cws-auto-publish`, `spa-workout-state-machine`, `spa-calendar`, `spa-ai-batch`)
- [ ] 9.6 Add a changeset (`pnpm exec changeset`) — `@kaiord/workout-spa-editor: minor`, `@kaiord/docs: patch`, note the `.changeset/config.json` edit as a monorepo repo-root item
- [ ] 9.7 Open the PR with the audit summary in the description (link back to the `/opsx-sync` pass that found the gaps)
- [ ] 9.8 After PR merge, run `/opsx-archive fix-spec-code-drift`
