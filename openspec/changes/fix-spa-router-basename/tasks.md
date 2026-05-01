<!-- opsx-ship: chunking
PR 0 (proposal): openspec artifacts only — already open as #403
PR 1 (implementation): §1, §2, §3, §4, §5, §7 — branch feature/fix-spa-router-basename
PR 2 (archive): §6 — branch chore/fix-spa-router-basename-archive
-->

## 1. Phase 1 — Implement the wouter base wrapper

- [x] 1.0 Worktree setup: `git worktree add -b feature/fix-spa-router-basename <WORKTREE_DIR>/kaiord-routerfix-impl main` (replace `<WORKTREE_DIR>` with your local worktree parent directory). Run `pnpm install` and rebuild workspace deps.
- [x] 1.1 Create `packages/workout-spa-editor/src/router-base.ts` exporting `computeRouterBase(baseUrl: string): string`. Body: `return baseUrl.replace(/\/$/, "")`. One-line, zero dependencies, pure.
- [x] 1.2 Edit `packages/workout-spa-editor/src/main.tsx`:
  - Import `Router` from `wouter`.
  - Import `computeRouterBase` from `./router-base`.
  - Compute `base` at module top level: `const base = computeRouterBase(import.meta.env.BASE_URL)`.
  - Wrap `<App />` in `<Router base={base}>` immediately inside `<CoachingRegistryBootstrap>`.
- [ ] 1.3 Verify dev mode unchanged: `pnpm --filter @kaiord/workout-spa-editor dev`, navigate to `localhost:5173/calendar`, confirm calendar renders. Wouter base is `""` here so behaviour matches pre-change.
- [ ] 1.4 Verify production build emits the correct base: `VITE_BASE_PATH=/editor/ pnpm --filter @kaiord/workout-spa-editor build`. The build itself does not exercise the runtime base value; the e2e at task 3.x is the runtime check.

## 2. Phase 1 — Pure-helper unit test

- [x] 2.1 Create `packages/workout-spa-editor/src/router-base.test.tsx` (TSX because the wouter contract test in 2.2 includes JSX). Vitest with table-driven cases:

      | input         | expected output | note |
      | ------------- | --------------- | ---- |
      | `"/"`         | `""`            | dev mode (Vite default) |
      | `"/editor/"`  | `"/editor"`     | production base |
      | `"/a/b/"`     | `"/a/b"`        | nested base |
      | `""`          | `""`            | defensive: Vite normalises BASE_URL to start+end with `/`; this row guards against a future Vite contract regression |

      AAA structure: arrange the input string, act `computeRouterBase`, assert against expected. The table drives a single `it.each` block. Add a comment next to the empty-string row recording the defensive intent so readers don't think it's a contract Vite emits.

- [x] 2.2 Add a wouter contract test in the same file: mount `<Router base="/editor"><Route path="/x">{() => "ok"}</Route></Router>` via Testing Library (`@testing-library/react`'s `render`) and assert that visiting `/editor/x` matches the route. Pin the wouter `package.json` resolved version in the assertion so a major-version bump that changes the base contract trips this test.
- [x] 2.3 Run `pnpm --filter @kaiord/workout-spa-editor test src/router-base.test.tsx` — passing.

## 3. Phase 1 — E2E regression test (production-base build)

- [x] 3.0 **Custom Node static-server fixture (decision pre-committed).** GitHub Pages-equivalent behaviour requires: (a) serve files for known paths, (b) return the merged-dist `404.html` content with **status 404** for unknown paths, (c) NOT serve `index.html` as a SPA fallback. Only a custom fixture meets all three contracts byte-equally:
  - `npx http-server` returns 200 for missing paths even with no SPA fallback — silently weakens Test 1's status-code expectation.
  - `npx serve` defaults to SPA fallback (`-s`) — would mask the bug.
  - **Custom fixture** at `packages/workout-spa-editor/e2e/fixtures/static-pages-server.ts`: small `http.createServer` reading from `merged-dist/`, serving the matching file with status 200 OR the `404.html` body with status 404 for unknown paths. The fixture exports `startStaticPagesServer(rootDir): Promise<{ url, close }>` so the e2e spec's `beforeAll` / `afterAll` can drive lifecycle cleanly.
    Implement the fixture; verify behaviour empirically against Pages parity (status code 404 on unknown, exact 404.html body served) before writing Test 1.
- [x] 3.0a **Extract the rafgraph injection helper** to `scripts/inject-spa-fallback.mjs`. The helper takes a `mergedDistDir` argument, appends the rafgraph redirect script to `<dir>/404.html`, and injects the decoder snippet into `<dir>/editor/index.html` — same logic as the inline bash heredoc in `.github/workflows/deploy-site.yml` lines 102-152. Update the workflow to call `node scripts/inject-spa-fallback.mjs merged-dist` instead of the inline bash + Python heredocs. Co-located test `scripts/inject-spa-fallback.test.mjs` exercises the helper against a temp-dir fixture. The e2e spec's `beforeAll` calls the same helper after the SPA build so the redirect script is byte-identical between production and tests.
- [x] 3.1 Create `packages/workout-spa-editor/e2e/spa-route-refresh.spec.ts`. The spec's top-level `describe` block carries the `@spa-route-refresh` tag (e.g. `test.describe("@spa-route-refresh SPA route refresh", () => { ... })`) so the CI grep filter in 3.2 selects this whole spec, not individual tests:
  - `test.skip` guard at the top: `test.skip(process.env.E2E_PROD_BASE !== "1", "Production-base e2e gated behind E2E_PROD_BASE=1");` so the standard `pnpm test:e2e` (dev-mode) continues to run unchanged.
  - `beforeAll`: shells out to `VITE_BASE_PATH=/editor/ pnpm --filter @kaiord/workout-spa-editor build`, mirrors the merged-dist structure, calls `inject-spa-fallback.mjs` (3.0a) so the rafgraph script is present byte-equal to production, starts the static-server fixture (3.0) on a free port.
  - `afterAll`: stops the server.
  - **Test 1 — direct deep refresh**: `page.goto(${baseUrl}/editor/calendar)`. The first response will have status 404 (rafgraph 404.html); the page's `replace`-driven navigation then loads `/editor/?p=...`, the decoder restores the URL, and React mounts. After `page.goto` resolves, assert: (a) `page.url()` ends with `/editor/calendar` (decoder restored); (b) the rendered DOM contains a `script[src^="/editor/assets/index-"]` tag (SPA bundle present). Do NOT assert on the initial response body — `page.goto` returns the 404 response which is the rafgraph carrier, not the final document.
  - **Test 2 — in-app navigation prefixes URL**: `page.goto(${baseUrl}/editor/)`, wait for the calendar redirect, assert `page.url()` ends with `/editor/calendar` (NOT `/calendar`).
  - **Test 3 — refresh inside SPA**: continue from Test 2 state, call `page.reload()`, assert URL stays `/editor/calendar` and the calendar view re-renders (e.g., the calendar header is visible).
  - **Test 4 — analytics path remains base-relative**: install a `page.exposeFunction("__captureAnalytics", ...)` shim at boot, navigate to `/editor/calendar`, then assert: (a) `__captureAnalytics` was called at least once (count ≥ 1) — guards against a future refactor that silently stops emitting pageViews; (b) the captured path is `/calendar` (NOT `/editor/calendar`). Both assertions are required; without the count assertion the path assertion vacuously passes if no event is captured.
  - **Test 5 — garbage-path round-trip**: `page.goto(${baseUrl}/editor/<malformed%20path>)`, assert no infinite redirect, URL settles at `/editor/calendar` (catch-all), DOM contains no injected script tags from the path.
- [x] 3.2 Wire the test into CI: edit `.github/workflows/ci.yml` to add a job named `e2e-prod-base` that runs `E2E_PROD_BASE=1 pnpm --filter @kaiord/workout-spa-editor test:e2e --grep '@spa-route-refresh'` (or equivalent), gated by the same conditions as the existing e2e-frontend job. Document the job name in the PR description.
- [ ] 3.3 Run the spec locally: `E2E_PROD_BASE=1 pnpm --filter @kaiord/workout-spa-editor test:e2e --grep '@spa-route-refresh'`. All five sub-tests pass. (Deferred to CI; runs via the new `e2e-prod-base` job.)

## 4. Phase 1 — Existing test-suite checks

- [x] 4.1 Run `pnpm --filter @kaiord/workout-spa-editor test` — full vitest. Confirm no regressions from the Router wrapper. (2844 passed / 4 skipped.)
- [ ] 4.2 Run `pnpm test:e2e` (dev-mode default) — full Playwright suite. Confirm no e2e regressions. (Deferred to CI's existing `e2e-frontend` job; running locally takes ~25 min.)
- [x] 4.3 Run `pnpm --filter @kaiord/workout-spa-editor lint` — clean.
- [x] 4.4 Run `pnpm -r build` — clean.
- [x] 4.5 Run `pnpm test:scripts` — 103 tests pass including new `inject-spa-fallback`.
- [x] 4.6 Run `openspec validate fix-spa-router-basename --strict` — passing.
- [x] 4.7 Sweep e2e specs for hardcoded production-base URLs: `rg "kaiord\\.com/(calendar|library|workout)" packages/workout-spa-editor/e2e/`. Result: zero matches. No existing e2e references the prod-base URL prefix.

## 5. Phase 1 — Validation, changeset, PR

- [x] 5.1 Add a `patch` changeset for `@kaiord/workout-spa-editor` titled `fix(spa-editor): align wouter Router base with Vite deploy base so /editor/<route> URLs survive refresh`. Body MUST include the user-facing note: "URLs deep-linked into the SPA editor now consistently include the `/editor/` prefix, matching the deploy path. Pre-fix bookmarks pointing at `kaiord.com/<route>` (without the prefix) never survived a refresh; the canonical address is now `kaiord.com/editor/<route>`. Open SPA tabs may briefly show a one-time URL update on the next navigation as the new base takes effect." This lands in the auto-generated release notes so external observers understand the URL-shape change.
- [ ] 5.2 Open PR with body referencing this change's `design.md` and the screenshot from the user demonstrating the bug. Test plan covers dev unchanged, prod refresh fixed, regression tests added, garbage-path safety asserted.
- [ ] 5.3 Ensure CI green (including the new `e2e-prod-base` job).
- [ ] 5.4 Squash merge.
- [ ] 5.5 Verify in production: navigate to `kaiord.com/editor/`, observe URL becomes `kaiord.com/editor/calendar`, refresh, confirm calendar view re-renders without the blue 404.
- [ ] 5.6 After merge: clean local worktree (`git worktree remove <WORKTREE_DIR>/kaiord-routerfix-impl`) and delete local branch.

## 6. Phase 2 — Archive

- [ ] 6.1 Pull main; run `pnpm lint:specs` — pre-archive expectation: specs under `openspec/specs/` count is 28 (the change-folder spec at `openspec/changes/fix-spa-router-basename/specs/` is NOT counted by `lint:specs` until archive).
- [ ] 6.2 Run `openspec validate fix-spa-router-basename --strict` once more.
- [ ] 6.3 Run `openspec archive fix-spa-router-basename --yes` — moves the change to `openspec/changes/archive/YYYY-MM-DD-fix-spa-router-basename/` and creates `openspec/specs/spa-routing/spec.md`.
- [ ] 6.4 Verify the archive landed cleanly. Each sub-bullet is a separate check; failures must be addressed individually rather than batched:
  - [ ] 6.4.1 H1 of `openspec/specs/spa-routing/spec.md` is exactly `# SPA Routing` (not "SPA routing" or "Spa Routing").
  - [ ] 6.4.2 `## Purpose` paragraph matches design.md D4 verbatim: "Routing-layer rules for the SPA editor, including alignment between client-side router base configuration and Vite deploy base, plus any additional invariants needed to keep deep URLs refresh-safe under static hosting."
  - [ ] 6.4.3 `> Synced: YYYY-MM-DD` header present and dated to the archive day.
  - [ ] 6.4.4 The single requirement "SPA router base alignment with Vite deploy base" landed with all 7 scenarios intact.
  - [ ] 6.4.5 If `openspec archive` ships a TBD Purpose for new capabilities, hand-write 6.4.1–6.4.3 inline and note the manual fix in the archive PR description.
- [ ] 6.5 Verify the archived `proposal.md` carries `> Completed: YYYY-MM-DD` matching the folder prefix.
- [ ] 6.6 Run `pnpm archive:index`, `pnpm lint:archive`, `pnpm lint:archive-index` — all clean.
- [ ] 6.7 Run `openspec validate --specs --strict` and `pnpm lint:specs` — post-archive expectation: specs under `openspec/specs/` count is 29 (28 existing + new `spa-routing`).
- [ ] 6.8 Open archive PR; ensure CI green; squash merge.

## 7. Spec-scenario coverage map

For each scenario in this change's `specs/spa-routing/spec.md` ADDED block, identify the task that delivers the test:

| #   | Scenario                                                     | Task that adds the test                                         |
| --- | ------------------------------------------------------------ | --------------------------------------------------------------- |
| 1   | Wouter is wrapped at SPA bootstrap                           | 3.1 / Test 2 (e2e exercises the wrapper presence behaviourally) |
| 2   | computeRouterBase strips the Vite trailing slash             | 2.1 (unit)                                                      |
| 3   | Production base produces deploy-prefixed URLs                | 3.1 / Test 2 (e2e)                                              |
| 4   | Refreshing a deep SPA URL keeps the SPA                      | 3.1 / Test 1 + Test 3 (e2e)                                     |
| 5   | Dev-mode behaviour is unchanged                              | 1.3 + 4.2                                                       |
| 6   | Analytics paths remain base-relative                         | 3.1 / Test 4 (e2e)                                              |
| 7   | Garbage path under the deploy base resolves to the catch-all | 3.1 / Test 5 (e2e)                                              |

- [ ] 7.1 Confirm the table is bidirectionally in sync with the final spec scenarios at archive time: every scenario maps to a task AND every test/sub-test maps to a scenario.
