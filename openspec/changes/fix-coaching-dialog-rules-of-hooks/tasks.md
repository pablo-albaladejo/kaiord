<!-- opsx-ship: chunking
PR 1 (fix-and-guards): §1, §2, §3, §4, §5 + PR hygiene from §7, §8
PR 2 (route-error-pii-scrubbing): §6 + final repo gates + archive
-->

## 1. Activate the static guards (do FIRST so the failing test in step 3 is matched by failing lint)

- [x] 1.1 Register `eslint-plugin-react-hooks` in the SPA-files block of `eslint.config.js` (the block whose `files` glob is `packages/workout-spa-editor/**/*.{ts,tsx}` and which already sets `max-lines: 80`). Set `react-hooks/rules-of-hooks: error` and `react-hooks/exhaustive-deps: error`. The SPA-pages block (the one whose `files` glob is `packages/workout-spa-editor/**/pages/**/*.tsx`) inherits via the flat-config cascade — no separate registration needed.
- [x] 1.2 In the same SPA-files block, add `no-restricted-imports` (or `@typescript-eslint/no-restricted-imports`) entries restricting `coaching-registry-context` and `coaching-source` modules for files matching the three dialog files (verified to exist today: `CoachingActivityDialog.tsx`, `CoachingActivityDialogContent.tsx`, `use-coaching-dialog.ts`). The rule MUST list:
  - All relative-path spellings that resolve to the target modules from the dialog files. Dialog files live at `packages/workout-spa-editor/src/components/molecules/CoachingCard/`, three directory levels deep under `src/`, so the canonical relative paths are `../../../contexts/coaching-registry-context` and `../../../types/coaching-source` (three `../`, one for each of `CoachingCard/`, `molecules/`, `components/`).
  - All path-alias spellings: inspect `packages/workout-spa-editor/tsconfig.json` `compilerOptions.paths`. If an alias maps to `src/contexts` or `src/types` (e.g., `@/contexts/coaching-registry-context`), include the aliased forms in the rule. If no alias exists, document this fact in the PR description.
  - Add a unit-style fixture under the test plan that imports a forbidden path from the dialog file (relative AND aliased, if applicable) and asserts ESLint flags both.
  - The `CoachingActivity` type import (from `coaching-activity.ts`) MUST remain allowed.
- [x] 1.3 Run `pnpm lint`. Capture every `react-hooks/*` and `no-restricted-imports` finding. The buggy site `use-coaching-dialog.ts:42` MUST be among the `rules-of-hooks` errors (proves activation works).
- [x] 1.4 For each `react-hooks/rules-of-hooks` finding outside `use-coaching-dialog.ts`: if trivial, fix in-place; if structural, add a single-line `eslint-disable-next-line` with a TODO comment naming a follow-up issue. Capture the suppressions list in the PR description.
- [x] 1.4a `react-hooks/exhaustive-deps` enforcement: keep at `error` repo-wide per the zero-tolerance policy. Pre-existing violations (8 sites) addressed via localized `// eslint-disable-next-line` (or block `/* eslint-disable react-hooks/exhaustive-deps */ ... /* eslint-enable */` for multi-line hook calls where the rule reports on the deps-array line). Each disable carries a `TODO(fix-coaching-dialog-rules-of-hooks-followup)` comment. Per CodeRabbit feedback in PR #405, the original "downgrade to warn" approach was rejected; localized suppressions follow the existing repo pattern.
- [x] 1.5 Re-run `pnpm lint`. Only the original buggy site (or none, if 1.4 deferred everything) is allowed to remain as a `react-hooks/rules-of-hooks` error before step 3.

## 2. Add new mechanical guards (D9 + analytics.event PII)

- [x] 2.1 Create `scripts/check-hook-collection-map-naming.mjs` per D9. Inputs: every `*.{ts,tsx}` file under `packages/workout-spa-editor/src/**`. Single detection rule: `<expr>.map(<param> => <body>)` where `<body>` invokes `<param>` as a function (i.e., contains a syntactic `<param>(...)` call) AND `<param>`'s name does NOT start with the literal `use` prefix. Receiver identity is irrelevant. Output: file path, line number, rejected parameter name; exit non-zero on any violation.
- [x] 2.2 Create `scripts/check-hook-collection-map-naming.test.mjs` (node:test) covering the five cases from the `spa-quality-gates` "Hook-collection map parameter naming guard" requirement: compliant `useFactory`, misnamed `f`, misnamed-but-`u`-prefix `update`, non-invoking map `(x) => x.id` (exempt), non-receiver-bound `[fn1, fn2].map((g) => g())` (must fail). Each fixture is an inline string parsed against the script's exported function (no temp files unless the script's I/O contract demands them).
- [x] 2.3 Wire the new script into `pnpm test:scripts` (existing `package.json` script) so CI runs it. Verify it FAILS today with a finding pointing at `use-coaching-dialog.ts` `factories.map((f) => ...)` (or any other current misnamed site).
- [x] 2.4 Extend `scripts/check-no-pii-leakage.mjs` to recognize the `analytics.event(...)` dispatch shape (member, computed-member, destructured, re-bound) per the `spa-quality-gates` "analytics.event first-argument hygiene" requirement. Refactor the existing `DESTRUCTURE_RE` and `REBIND_RE` constants (currently hardcoded to `useToastContext`) into a parameterized regex factory `(sourceName) => RegExp(...)` and call it for both `useToastContext` and `useAnalytics`. The first-argument shape rule is reused identically; the second argument (payload) is out of scope.
- [x] 2.5 Update `scripts/check-no-pii-leakage.test.mjs` (or co-located test file) with at least 3 new cases: bare-literal first arg passes, template-literal first arg fails, destructured `const { event } = useAnalytics(); event(\`x-${y}\`, {})` is flagged.
- [x] 2.6 Run `pnpm test:scripts`. Both extended/new guards MUST pass on the current codebase except for any pre-existing analytics-event interpolation site (fix or document during this step).

## 3. Reproduce the bug as a failing test (TDD red — D4 smoke-render)

- [x] 3.1 Create `packages/workout-spa-editor/src/components/molecules/CoachingCard/CoachingActivityDialog.bootstrap.test.tsx`. Wrap the test render with the FULL provider stack required by the real `CoachingRegistryBootstrap`:
  - `PersistenceProvider persistence={createInMemoryPersistence()}` (mandatory — `useTrain2GoSource` calls `usePersistence`).
  - `<CoachingRegistryBootstrap>...</CoachingRegistryBootstrap>` (provides the registry context).
  - `useAnalytics()` defaults to `createNoopAnalytics()` so no `AnalyticsProvider` is required (verify: `analytics-context.tsx` declares `createContext<Analytics>(createNoopAnalytics())`).
  - The Zustand `useTrain2GoStore` does NOT need a provider.
- [x] 3.2 Inside the bootstrap provider tree, mount BOTH the dialog AND a `<TestProbe>` component that calls `useCoachingActivities([0])` (or the relevant hook that materializes the registered factories). The probe forces every factory hook (today: `useTrain2GoSource`) to actually execute in the test environment, so a Rules-of-Hooks regression introduced INSIDE a factory body is caught — not just regressions at the dialog boundary. Without the probe, after the D1 fix the dialog no longer consumes the registry, leaving factory internals untested at the smoke-test level. The probe MUST also expose its `syncSources.length` (e.g., via `data-factory-count` attribute or a captured ref) and the test MUST assert it is `>= 1` — protects against a regression that empties the bootstrap's factory registration list.
- [x] 3.3 The test MUST pass an `expandActivity={vi.fn()}` prop to `CoachingActivityDialog` (the new required prop). Use a baseline `CoachingActivity` whose `description === undefined`.
- [x] 3.4 Assertion (portal-aware): use `expect(screen.getByTestId("coaching-activity-dialog")).toBeInTheDocument()` (the testid is declared at `CoachingActivityDialog.tsx` on the Dialog.Content). Do NOT use `expect(container).not.toBeEmptyDOMElement()` — Radix Dialog renders into a body-level portal, not the test's local container.
- [x] 3.5 Verify the test FAILS due to React error #321 (or React's `Invalid hook call` message) — NOT due to "useAnalytics outside provider", "usePersistence outside provider", or any portal-assertion mismatch. If the failure mode is wrong, the red step is meaningless; fix the test plumbing until the failure is the intended one. With the `TestProbe` in place, the failure should originate inside the registry-mapping `useEffect` of the dialog.

## 4. Fix — lift `expandActivity` to the caller (TDD green — D1 + D6)

- [x] 4.1 Update `useCoachingDialog` signature to `(activity, onClose, expandActivity: (activity: CoachingActivity) => void)`. Drop the import of `useCoachingSourceFactories` and any source-port import (the `no-restricted-imports` rule from step 1.2 will enforce this). PRESERVE the existing first `useEffect` that captures `targetProfileId` (the one whose dependency array is `[activity, activeProfileId]` and which calls `setTargetProfileId`). Only the SECOND `useEffect` (the registry-mapping one whose body calls `factories.map((f) => f(...))`) is removed and replaced with a minimal effect that calls `expandActivity(activity)` when `activity` is set, `activeProfileId` is set, and `activity.description === undefined`.
- [x] 4.2 Update `CoachingActivityDialog` (and `CoachingActivityDialogContent` if needed) to declare `expandActivity` as a required prop and forward it to `useCoachingDialog`. Remove any registry-related imports.
- [x] 4.3 Find the unique mount site of `CoachingActivityDialog` (likely the calendar page that already calls `useCoachingActivities(days)`). Pass `expandActivity` from the existing `useCoachingActivities` return value (the `expandActivity` field of the returned object from `packages/workout-spa-editor/src/hooks/use-coaching-activities.ts`).
- [x] 4.4 Migrate `use-coaching-dialog.test.tsx` (6 existing test cases — count and map BEFORE editing):
  - BEFORE editing: run `grep -c "^  it(" use-coaching-dialog.test.tsx` and verify it returns `6`. AFTER editing: run the same command and verify it still returns `6` (or higher if new cases were added). Never delete a test (CLAUDE.md: "Never delete a test").
  - The 6 existing cases (verbatim from the source) are:
    1. `does nothing when activity is null`
    2. `triggers source.expand when activity has undefined description`
    3. `does NOT trigger expand when description is already populated`
    4. `does NOT trigger expand when description is known-empty ('')`
    5. `handleConvert: surfaces 'Activity not found' when record missing in repo`
    6. `handleConvert: navigates to /workout/:id on successful conversion`
  - Map each post-fix: cases 2/3/4 now assert that the mock `expandActivity` prop is invoked (or not) — they no longer go through the registry. Cases 1/5/6 are unaffected by the registry change but their renders MUST pass `expandActivity={vi.fn()}` (the new required prop) to compile.
  - Remove the `vi.mock("../../../contexts/coaching-registry-context", ...)` block entirely.
  - Delete the now-dead top-level `mockExpand` constant; each test case uses a per-test `const mockExpandActivity = vi.fn()` passed into `renderHook`'s `initialProps` option (or via a wrapper component closure that captures the mock).
  - Move the `import { useCoachingDialog }` statement to the top of the file under `simple-import-sort` ordering — with the `vi.mock` block gone, there is no longer a hoisting reason to keep it at the bottom.
  - Verify all 6 cases still pass with semantically equivalent assertions and that `pnpm lint` produces zero `no-unused-vars` errors on this file.
- [x] 4.5 Migrate `CoachingActivityDialog.test.tsx`:
  - Remove the `vi.mock("../../../contexts/coaching-registry-context", () => ({ useCoachingSourceFactories: () => [] }))` block.
  - Pass `expandActivity={vi.fn()}` in every render call.
- [x] 4.6 Run `pnpm -F @kaiord/workout-spa-editor test`. The bootstrap smoke test from step 3 MUST pass. Pre-existing dialog tests MUST still pass.

## 5. Lint cleanup verification (TDD refactor)

- [x] 5.1 Verify `pnpm lint` passes with zero `react-hooks/*` errors and zero `no-restricted-imports` errors.
- [x] 5.2 Verify `pnpm test:scripts` passes including the two new guards (D9 + extended PII).
- [x] 5.3 Audit: confirm the only remaining `factories.map(...)` call site in the SPA is `use-coaching-activities.ts:38` and the parameter is named `useFactory`. Confirm `useCoachingDialog` no longer imports `useCoachingSourceFactories` or any source-port type.

## 6. Enrich `RouteErrorBoundary` analytics payload — D5 with PII scrubbing

- [x] 6.1 Create `packages/workout-spa-editor/src/lib/scrub-analytics-string.ts` exporting `scrubAnalyticsString(input: string, maxLen?: number): string`. Apply the FIVE regex replacements from D5 in this order: (1) UUID → `<uuid>`, (2) Bearer → `Bearer <token>`, (3) email → `<email>`, (4) hex run ≥ 32 → `<hex>`, (5) base64url run ≥ 40 → `<token>` (catches raw JWTs and OAuth tokens that lack a Bearer prefix). Then truncate to `maxLen` if provided. The function MUST be pure and synchronous. File MUST stay under 80 lines (SPA cap).
- [x] 6.2 Create `scrub-analytics-string.test.ts` covering:
  - Each of the FIVE scrub classes (positive case + adjacent-but-non-matching negative case).
  - Specific JWT fixture: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c` is fully replaced by `<token>` placeholders.
  - Internationalized email: `usuario@correo.es`, `用户@example.cn`, AND `用户@example.中国` (CJK TLD) are all replaced by `<email>`.
  - Order-of-operations: `Bearer <jwt>` is replaced as a single Bearer-token unit (not double-scrubbed); a 60-character hex run produces `<hex>` (rule 4 wins over rule 5).
  - Bearer-with-punctuation: input `"Failed: Bearer abc.def.ghi); status=401"` produces `"Failed: Bearer <token>); status=401"` — the token-safe character class `[A-Za-z0-9._\-+/=]+` stops before `)`, so trailing punctuation is preserved verbatim (aligned with `analytics-port` spec rule 2).
  - Multi-line componentStack: a 6-frame component stack with newlines, where frame 4 contains a UUID, scrubs the UUID without disturbing newline boundaries.
  - Truncation post-scrub (input scrubbed first, then sliced; placeholders never split mid-token).
  - UUID-at-truncation-boundary: a UUID positioned at input offsets 498-533 of a 600-char message is fully replaced by `<uuid>` and the output length is at most the requested `maxLen` of 500.
  - Idempotence: `scrub(scrub(input)) === scrub(input)`.
  - False-positive over-scrub (documented tradeoff): a 42-character contiguous alphanumeric run (e.g., `"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"`) — representing a workout-title fragment without word breaks — gets `<token>`-scrubbed by rule 5. The test asserts this and documents in a code comment that false-positive bias is the intended posture per design.md D5. (Note: a workout title WITH spaces, e.g., `"My Big Long Indoor Cycling Workout"`, does NOT trigger rule 5 because `[A-Za-z0-9_-]{40,}` does not match across spaces — also assert this negative case to document the regex's word-aware behavior.)
- [x] 6.3 Extract `buildRouteErrorPayload(error: Error, info: ErrorInfo, scrub: typeof scrubAnalyticsString): RouteErrorPayload` into a dedicated pure-function module `packages/workout-spa-editor/src/lib/build-route-error-payload.ts`. The function builds `{ route, name, message, componentStack }` per the contract: `name = scrub(error.name || "Error")`, `message = scrub(error.message ?? "", 500)`, `componentStack = scrub(info.componentStack ?? "", 1000)`, `route = scrub(window.location.pathname)`. The extraction is unconditional (not gated on the boundary's line count) — the goal is testability: the payload-build is a pure function with deterministic regex behavior, decoupled from the React lifecycle. `RouteErrorBoundary` becomes a thin React shim.
- [x] 6.3a Create `build-route-error-payload.test.ts` testing the pure function directly (no React renders). All payload-shape assertions (UUID scrub, JWT scrub, name fallback, message fallback, componentStack fallback, exact 500/1000 truncation, multi-line componentStack) move HERE from `RouteErrorBoundary.test.tsx`, leaving the latter to assert only the React-integration concerns (analytics-throws regression, fallback UI on caught error).
- [x] 6.3b Update `RouteErrorBoundary.componentDidCatch` to:
  - Call `const payload = buildRouteErrorPayload(error, info, scrubAnalyticsString)` INSIDE the `if (this.props.analytics)` guard so noop deployments do zero scrub work.
  - Emit `this.props.analytics.event("route-error", payload)` inside the existing `try/catch`.
  - Keep `console.error("Route error:", error, info.componentStack)` as-is (local console, first arg is bare literal — passes existing PII guard; component stack on local console is acceptable for in-browser debugging).
  - File MUST stay under 80 lines (current is 56; the extraction in 6.3 ensures this with margin).
- [x] 6.4 Update `RouteErrorBoundary.test.tsx` to assert ONLY the React-integration concerns:
  - Regression: `analytics.event` throws synchronously → boundary still renders fallback (existing scenario, retained).
  - Integration: when an error is caught and `analytics` prop IS provided, `buildRouteErrorPayload` is called and the result is forwarded to `analytics.event`. Mock `analytics.event` and assert it receives a payload of the expected shape (full coverage of payload field-by-field assertions lives in `build-route-error-payload.test.ts` per 6.3a).
  - Integration: when an error is caught and `analytics` prop is NOT provided, `buildRouteErrorPayload` is NOT invoked (and therefore the scrubber pipeline does not run). Assert by mocking `buildRouteErrorPayload` at the module boundary (e.g., `vi.mock("../../lib/build-route-error-payload")`) and verifying the mock was not called. Spying on `buildRouteErrorPayload` (not `scrubAnalyticsString`) is the correct target because that is the function the analytics guard skips; the scrubber is an implementation detail of the payload builder.
- [x] 6.5 Run `pnpm -F @kaiord/workout-spa-editor test`. All error-boundary tests MUST pass. Run `wc -l RouteErrorBoundary.tsx` and confirm ≤ 80 lines.

## 7. Spec compliance and full quality gates

- [ ] 7.1 Run `pnpm lint:specs` and `openspec validate fix-coaching-dialog-rules-of-hooks`. Both MUST pass.
- [ ] 7.2 Run `pnpm -r test && pnpm -r build && pnpm lint && pnpm test:scripts` from repo root. Zero warnings, zero errors (zero-tolerance policy from `CLAUDE.md`).
- [ ] 7.3 Manually verify the original repro: build the SPA (`pnpm -F @kaiord/workout-spa-editor build && pnpm -F @kaiord/workout-spa-editor preview`), load a profile with Train2Go-loaded workouts, click one. Confirm the dialog opens, lazy-load fires (or stays empty if T2G is unavailable), and there is no "Something went wrong" screen.

## 8. PR hygiene

- [ ] 8.1 No changeset required. `@kaiord/workout-spa-editor` is `private: true` and is NOT in `.changeset/config.json#linked`. Document this rationale in the PR description so reviewers don't request one.
- [ ] 8.2 Open PR with conventional-commit title `fix(spa-editor): coaching dialog rules-of-hooks crash + react-hooks lint gate`.
- [ ] 8.3 PR description: link to `proposal.md` (do not duplicate its Why-section text); list any `eslint-disable` suppressions added in step 1.4 (with follow-up issue references); list any `analytics.event` interpolation sites discovered/fixed in step 2.6; include a screenshot or screen-recording of the original repro working post-fix.
- [ ] 8.4 After merge: run `/opsx-archive fix-coaching-dialog-rules-of-hooks` to move this change to the archive.
<!-- ci-trigger -->


