<!-- opsx-ship: chunking
PR 1 (spike + bridge): §1, §2, §3
PR 2 (spa-transport + use-case): §4, §5, §6
PR 3 (spa-ui + e2e + listing): §7, §8, §9
-->

## 1. Spike — discover Train2Go zones endpoint(s)

- [x] 1.1 ~~Open Train2Go DevTools Network tab~~ **DONE 2026-05-03**. Findings: `/user/details` is server-rendered HTML; no separate JSON endpoint. All zones data inline under stable DOM IDs (`#physio-{userId}`, `#hrzones-{userId}`, `#paces-{userId}`, `#records-{userId}`, `#tests-{userId}`). Documented in design.md D4.
- [x] 1.2 Save a sanitized HTML fixture to `packages/train2go-bridge/test/fixtures/details-active.html` derived from the live response. (Precondition for §2.6 redaction test and §9.1 e2e fixture — must complete before either runs.) Replace ALL of: `value="zuaMxz..."` (CSRF) → `value="TEST_CSRF"`, `user_id`/`pupil_id` numeric references (the live sample has `28035`, the user's real T2G id) → placeholder `99999`, name fields → `Test User` / `Test Coach`, email/avatar URLs → empty strings. KEEP: dates, zone numbers, sport_id values. Add a top-of-file comment `<!-- Sanitized fixture; user IDs and CSRF replaced with placeholders -->`.
- [ ] 1.3 Update Open Questions in design.md as findings come back from real bridge integration (already done in D4 + Open Questions).

## 2. Bridge — `read-details` action + ALLOWED expansion

- [x] 2.1 Add `{ method: "GET", pattern: /^\/user\/details$/ }` to `packages/train2go-bridge/content.js` `ALLOWED` list. (Single page-fetch, no query params.)
- [x] 2.1.1 Modify `packages/train2go-bridge/content.js` `handleFetch` to inspect `r.headers.get('content-type')` and call `r.text()` for `text/html` responses, otherwise `r.json()`. Update the response shape doc-comment so callers know `data` may be a string. Add a content-script unit test (or two) covering both branches: JSON responses decoded to an object, HTML responses decoded to a raw string.
- [x] 2.2 Update `scripts/fixtures/bridge-privacy-surface.json` `train2go-bridge.allowed_paths` to reflect the FULL allowed list — fix the existing drift (it currently has only 2 entries; should have the existing 4: ping, weekly, daily, tooltip) AND add the new `^/user/details$`. This is Boy-Scout-Rule cleanup of pre-existing drift. Total: 5 entries after this task.
- [x] 2.2b Add a script-level test in `scripts/check-bridge-privacy-surface.test.mjs` (or a new sibling) that asserts the fixture's `allowed_paths.length` matches the literal count in `content.js` `ALLOWED` for that bridge. This catches future drift mechanically.
- [x] 2.3 Add a `parseDetailsHtml` function to `packages/train2go-bridge/parser.js` that takes the inline HTML and extracts a stable `ZonesPayload` (allowlist: `physiological.{weight, bpmMax}`, `paces.{cycling.{z4Upper, z5Lower}, running.{z4Upper}, swimming.{z4Upper}}`, `hrZones.{cycling.{z4Upper}, running.{z4Upper}}`). Use stable DOM IDs and `name=` attributes — never visible labels. Mirrors the existing `parseWeeklyHtml` pattern.
- [x] 2.4 Add a `readDetails()` function to `packages/train2go-bridge/background.js` that calls `train2goFetch("/user/details")` and pipes the HTML through `parseDetailsHtml`. Returns `{ ok, data: ZonesPayload }`.
- [x] 2.5 Wire `read-details` into `handleAction` switch in `background.js`. (Action name "read-details" reflects the page being parsed.)
- [x] 2.5b Add `"read:training-zones"` to `BRIDGE_MANIFEST.capabilities` in `packages/train2go-bridge/background.js` (alongside the existing `"read:training-plan"`). This is the capability flag the SPA gates the `Sync zones` toggle on so older-bridge users never see a feature their installed extension cannot fulfil. Update the BRIDGE_MANIFEST shape test (`packages/train2go-bridge/test/background.test.js`) to expect both capabilities. (The garmin-bridge manifest test is unchanged in this scope.)
- [x] 2.6 Tests: add `parseDetailsHtml` unit tests covering: positive shape from the sanitized fixture, missing-physio (defensive default — output is a valid `ZonesPayload` with `physiological` absent), no-paces (running-only profile — only the running paces sub-tree is emitted), no-tests-block (defensive: parser still produces a valid payload when `#tests-{userId}` is absent — and crucially the output SHALL NOT contain any tests/records keys regardless of whether the block was present, per the redaction allowlist requirement).
- [x] 2.6b Redaction unit test for `parseDetailsHtml`. Feed a fixture containing forbidden fields (gender, birthday, fat, smoker, bpm_rest, user_notes, coach.email, coach.name, email, records, tests). Walk the parsed object recursively and assert no key in the forbidden set appears at any nesting depth (a substring match against `JSON.stringify(output)` would false-pass on benign keys like `emailReceiptsEnabled`).
- [x] 2.7 Tests: add background `read-details` integration tests: happy path, no-tab, allowlist-rejection, session expired (HTML redirect / 302).

## 3. Bridge — protocol spec + changeset

- [x] 3.1 Update `openspec/specs/train2go-bridge/spec.md` (or write the delta spec) to document the new `read-details` action and the broadened ALLOWED list.
- [x] 3.2 Add changeset entry: `@kaiord/train2go-bridge: minor`.

## 4. SPA — domain types + transport port extension

- [x] 4.1 Add `ZonesPayload` and `ZonesReconciliation` domain types under `packages/workout-spa-editor/src/types/coaching-zones.ts`.
- [x] 4.2 Extend `CoachingTransport` port (`packages/workout-spa-editor/src/application/coaching/coaching-transport-port.ts`) with `readZones?: (externalUserId: string, signal?: AbortSignal) => Promise<ZonesPayload | null>`.
- [x] 4.3 Tests: type-only smoke + a Garmin-shaped no-op test asserting absence of `readZones`.
- [x] 4.4 Extend the `BridgeCapability` Zod enum in `packages/workout-spa-editor/src/types/bridge-schemas.ts` to include `read:training-zones`. Update the manifest-replica validators in both bridge `background.test.js` files to expect the new capability when present.

## 5. SPA — Train2Go transport implementation

- [x] 5.1 Implement `readZones` in `packages/workout-spa-editor/src/store/train2go-extension-transport.ts` with timeout and `train2goSendMessage` envelope handling. Route the call through the existing `createOperationQueue` from `packages/workout-spa-editor/src/adapters/bridge/operation-queue.ts` (the same module used by `useProfileSnapshotPush`). Pre-existing `readWeek` / `readDay` calls bypass this queue today (a separate spec drift not in this change's scope); `readZones` SHALL be the second consumer of the queue and SHALL respect the 60/h-per-bridge cap from the spa-bridge-protocol spec.
- [x] 5.2 Wire `readZones` through `packages/workout-spa-editor/src/adapters/train2go/train2go-coaching-transport.ts`.
- [x] 5.3 Tests: transport unit tests covering envelope shape, timeout, transport-error, AND a rate-limit test asserting `readZones` and `readWeek` share a single per-bridge quota counter.

## 6. SPA — `syncZones` use case + reconciliation

- [x] 6.1 Add `syncZones?: boolean` to `LinkedCoachingAccount` (optional → no Dexie schema-version bump required; existing rows read undefined and are treated as `false` at the use-case boundary via `?? false`).
- [x] 6.2a Implement `syncZones(profileId, transport, repo): Promise<SyncZonesResult>` where `SyncZonesResult = { ok: true, applied: WrittenField[], conflicts: ConflictItem[] } | { ok: false, reason: string }`. The use case writes silent fills to the profile EAGERLY (returns them in `applied`) but does NOT write conflicting values — those are returned in `conflicts` for the UI to present.
- [x] 6.2b Implement `commitConflictResolution(profileId, decisions: Record<FieldKey, 'accept' | 'reject'>, repo, transportPayload): Promise<void>`. Applies the user's per-row decisions (for each `accept`, write the T2G value; for each `reject`, no-op). Idempotent.
- [x] 6.3 Implement `application/coaching/sync-zones-helpers.ts` (split if needed under file-size cap): pace-unit conversion, threshold-extraction.
- [x] 6.4 Tests: 15 unit tests covering both functions:
  - syncZones tests (11): empty-fill (silent), no-op (same value), single-conflict (returns conflict), multi-conflict (returns multiple), mixed-fill-and-conflict (some applied, some conflict), ftp-fallback-absent (z4Upper key missing → z5Lower used), ftp-fallback-zero (z4Upper === 0 → z5Lower used), transport-error, shape-mismatch, unsupported-transport, profile-deleted-mid-sync.
  - commitConflictResolution tests (4): all-accept, all-reject, mixed, profile-deleted-mid-commit.
- [x] 6.5 Define toast/log message constants at top of `application/coaching/sync-zones.ts`: `TOAST_ZONES_FETCH_FAILED`, `TOAST_ZONES_SHAPE_MISMATCH`, `TOAST_ZONES_UNSUPPORTED`, `LOG_ZONES_SYNC_RUN`. Use ONLY these constants in toast/console calls — no template-literal interpolation as the first argument. The mechanical guard `pnpm test:scripts` (`check-no-pii-leakage.mjs`) enforces this.

## 7. SPA — UI: toggle + conflict dialog

- [x] 7.1 Add a `Sync zones` toggle to `LinkedAccountsSection` (only visible while `linked === true` AND the discovered Train2Go bridge advertises `"read:training-zones"` in its `capabilities` array — gates older-bridge users from seeing a feature their extension cannot fulfil). Persists via existing profile repo.
- [x] 7.2 Build `ZonesConflictDialog` component with per-row accept/reject. Reuse atoms (`Switch`, `Dialog`, `Button`). NEVER use `dangerouslySetInnerHTML`. Field labels come from a static SPA-side label map keyed by `FieldKey` (e.g., `{ "cycling.thresholds.ftp": "FTP" }`), NEVER from T2G strings. `// eslint-disable-next-line` overrides for `react/no-danger` are FORBIDDEN in this file. Verify ESLint enforces `react/no-danger: "error"` at the workspace level before merging.
- [x] 7.3 Wire the dialog: the UI calls `syncZones` first, opens the dialog with the returned `conflicts`, then calls `commitConflictResolution` with the user's decisions. The UI layer (`use-train2go-source.ts` or a dedicated hook) orchestrates this two-phase flow.
- [x] 7.4 Tests: toggle-persistence test, dialog-render test, dialog accept-reject-cancel paths.

## 8. SPA — fan-out from connect + sync callbacks

- [x] 8.1 Modify `useConnectCallback` (`adapters/train2go/use-train2go-actions.ts`) so that on `attemptLink` ok AND `syncZones === true`, the callback invokes the `syncZones` use case once. Errors are toasted, not thrown.
- [x] 8.2 Modify `useSyncCallback` similarly: after weekly read succeeds AND `syncZones === true`, invoke `syncZones`. Failure does not mark calendar sync as failed.
- [x] 8.3 Tests: integration tests covering both fan-out paths, including the error-isolation contracts.

## 9. SPA + listing — final wiring, tests, copy

- [ ] 9.1 ~~Add `packages/workout-spa-editor/e2e/zones-sync.spec.ts`~~ **DEFERRED**: a real Playwright e2e for the zones-sync flow needs a loaded Chrome extension stub (the SPA can't simulate `KAIORD_BRIDGE_ANNOUNCE` realistically without it). The spec scenarios are covered by 41 unit/integration tests across PR 1 (15) + PR 2 (10 syncZones + 4 commitConflictResolution + 3 transport + 3 port + 7 wire-fetch) + PR 3 (5 dialog + 3 toggle + 5 fan-out). Filed as a follow-up issue at archive time.
- [x] 9.2 Update `packages/train2go-bridge/store-listing.md` with the broadened-read-access paragraph.
- [x] 9.3 Add changeset: `@kaiord/workout-spa-editor: minor`.
- [x] 9.4 Run `pnpm -r build && pnpm -r test && pnpm lint:fix && pnpm lint:specs && npx openspec validate train2go-zones-sync --strict`.
- [ ] 9.5 Manual e2e with Pablo: Train2Go zones page values vs Kaiord profile values match after the dance, conflict dialog behavior verified for at least one mismatch.
- [ ] 9.6 Archive the change via `/opsx:archive train2go-zones-sync` once merged on main.
