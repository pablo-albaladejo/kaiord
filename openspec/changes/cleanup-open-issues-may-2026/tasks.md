## 1. Phase 1 — Triage sweep (no code; GitHub bookkeeping only)

This phase ships as a comment on the proposal PR (or as standalone `gh issue close` invocations after the proposal merges). No worktree, no code change, no changeset. Each closure carries an issue-specific rationale.

### 1.1 — Stale CI failure auto-issues

For each issue, look up the failing commit in the issue body, confirm via `gh run list --branch main --workflow CI` that subsequent runs on later commits are green, then close with a comment naming the resolving commit SHA.

- [ ] 1.1.1 Close `#393` (CI failure on `e59efe1`). Look up the latest green CI run on main at execution time via `gh run list --branch main --workflow CI --status success --limit 1 --json headSha,createdAt -q '.[0]'`. Substitute its SHA + date into the closure-comment template: "Resolved on commit `<SHA>`; main green as of `<date>`. Original failure was a Phase 3 e2e flake; the resolving commit is among the post-Phase-3 commits that landed before this lookup."
- [ ] 1.1.2 Close `#355` (CI failure on `a1b6264`). Look up the resolving commit by `gh run list --branch main --workflow CI --created '>2026-04-24'` and citing the first green run on a commit newer than `a1b6264`. Closure comment template: `Resolved on commit <SHA>; CI green on main from <date> onward.`
- [ ] 1.1.3 Close `#345` (Link Checker failure on `fec3a92`). Same lookup pattern as 1.1.2 against the Link Checker workflow.

### 1.2 — Stale security alerts

- [ ] 1.2.1 Run `pnpm audit --json | jq '.metadata.vulnerabilities'` and capture the result. Confirm `critical: 0` and `high: 0`.
- [ ] 1.2.2 For each of `#168, #177, #178, #182`, read the issue body to identify the specific CVE / GitHub Advisory ID(s) referenced. For each:
  - Run `pnpm why <package>` to confirm whether the package is still in the dep tree.
  - If absent: closure comment "Package `<name>` is no longer in the dependency tree as of `pnpm-lock.yaml` commit `<SHA>` (`pnpm why <name>` returns no results). Advisory `<GHSA-id>` is no longer applicable."
  - If present at a patched version: closure comment "Package `<name>` is at version `<X.Y.Z>` (locked in commit `<SHA>`); advisory `<GHSA-id>` patched in `<X.Y.W>`. Current `pnpm audit` reports 0 critical and 0 high; the bot's high-severity criterion is no longer met."
  - If present at the still-vulnerable version but the advisory has been re-categorised: closure comment cites the re-categorisation.

### 1.3 — Tracking meta-issue

- [ ] 1.3.1 Close `#388`. Closure comment looks up the actual PR numbers at execution time via `gh pr list --state merged --search 'persistence-read-rule-cleanup' --limit 10 --json number,mergedAt,title` and lists them in chronological order. Template: "All `<N>` phase PRs (#<list>) merged; change archived as `openspec/changes/archive/2026-04-30-persistence-read-rule-cleanup/`. Tracking issue closed."

### 1.4 — Validation

- [ ] 1.4.1 `gh issue list --state open --json number | jq 'length'` returns ≤7 (15 minus the 8 closed).
- [ ] 1.4.2 Phase 1 ships with **no PR**. The closures are manual `gh issue close` invocations after the proposal merges (or as part of the proposal-PR's description if the user prefers to bundle).

## 2. Phase 2 — Fix #386 (SPA route 404 on refresh) via rafgraph SPA-fallback

- [ ] 2.0 Worktree setup: `git worktree add -b feature/cleanup-issues-2-spa-fallback /Users/pablo/development/personal/kaiord-cleanup-2 main`. Run `pnpm install` and rebuild workspace deps.

### 2.1 — Implement the rafgraph pattern in the deploy workflow

- [ ] 2.1.1 Inspect `.github/workflows/deploy-site.yml` to identify the step that produces `merged-dist/404.html` (the landing's blue 404). Confirm the deploy structure matches the issue body's description.
- [ ] 2.1.2 Replace the `merged-dist/404.html` build step with a rafgraph-shaped 404. The script captures `window.location.pathname + window.location.search`, encodes the path into a `?p=<encoded>` query, and `window.location.replace`s to `/editor/?p=<encoded>` ONLY IF the original path begins with `/editor/`. For non-`/editor/` 404s, the script no-ops and the existing landing 404 markup renders.
- [ ] 2.1.3 Inject the decoder snippet into `merged-dist/editor/index.html` (post-SPA-build, pre-artifact-upload). The decoder runs synchronously before the React bundle; it reads `?p=<encoded>`, decodes via `decodeURIComponent`, and calls `window.history.replaceState(null, null, decoded)` to restore the original URL.
- [ ] 2.1.4 Verify VitePress already produces `docs/404.html` (it does); no docs-side change.

### 2.2 — CI smoke step (self-monitoring)

- [ ] 2.2.1 Add a post-deploy smoke step in `.github/workflows/deploy-site.yml` that runs after the `actions/deploy-pages@v5` step completes. The step:
  - Targets `${{ steps.deployment.outputs.page_url }}editor/calendar` (the GitHub Pages-issued `*.github.io` host, which propagates faster than the custom domain). Falls back to `https://kaiord.com/editor/calendar` only if the workflow is triggered on `main` AND the page-url output is unavailable.
  - **Build-derived marker**: read the SPA's emitted `index.html` post-build to extract a unique `<script src="...">` reference (e.g., `MARKER=$(grep -oE 'src="/editor/assets/index-[^"]+\.js"' merged-dist/editor/index.html | head -1)`). Hardcoded path prefixes break silently if `vite.config.ts` ever changes `base` or `build.assetsDir`; deriving the marker from the actual build output keeps the smoke step robust to those refactors.
  - **Retry-with-backoff**: Pages CDN propagation is eventually consistent (typical 30s–2min). The step runs `for i in $(seq 1 10); do curl -sL "$URL" > resp.html && grep -qF "$MARKER" resp.html && break || sleep 10; done` so an early-cache miss does not flake CI.
  - Final assertion: response body contains the build-derived `$MARKER` (positive: SPA bundle served) AND does NOT contain the landing's 404 marker (negative: `error-page-blue` or whatever the post-rafgraph 404 markup uses).
  - Fails the workflow on regression after the retry loop exhausts, pinging via the existing failure-notification path.
- [ ] 2.2.2 Run the smoke step locally against `pnpm preview` or a deploy-preview branch before merging.

### 2.3 — Manual verification (not gated, complementary)

- [ ] 2.3.1 GET `/editor/calendar` after a hard refresh returns the SPA bundle.
- [ ] 2.3.2 GET `/editor/this-route-does-not-exist` returns the SPA bundle, which then renders the SPA's in-app 404 screen (router-driven), not the landing's blue 404.
- [ ] 2.3.3 GET `/this-route-does-not-exist` (root, outside `/editor`) still returns the landing's `404.html` blue page.
- [ ] 2.3.4 Hash fragments survive the round-trip: `/editor/workout/abc#step-3` after refresh restores both path and fragment.

### 2.4 — Validation, changeset, PR

- [ ] 2.4.1 Run `pnpm lint` and `pnpm test` — no expected impact (workflow change), but confirm clean.
- [ ] 2.4.2 No changeset: Phase 2 modifies `.github/workflows/deploy-site.yml` only, which does not ship in any npm package. Verify against `.changeset/config.json` `ignore` list. (If repo policy requires a `none`-typed changeset for the audit trail, add one; otherwise skip.)
- [ ] 2.4.3 Commit: `fix(deploy): add SPA fallback for editor routes via rafgraph pattern (closes #386)`.
- [ ] 2.4.4 Open PR; ensure CI green (especially the new smoke step); squash merge.
- [ ] 2.4.5 Verify in production: `curl -I https://kaiord.com/editor/calendar` returns the SPA bundle; navigate manually to confirm refresh no longer wipes the URL.
- [ ] 2.4.6 After merge: clean local worktree (`git worktree remove /Users/pablo/development/personal/kaiord-cleanup-2`) and delete the local branch.

## 3. Phase 3 — PII / secret-leakage mechanical guard (#395)

### 3.1 — Shared parser primitive (extracted from existing script)

- [ ] 3.0 Worktree setup: `git worktree add -b feature/cleanup-issues-3-pii-guard /Users/pablo/development/personal/kaiord-cleanup-3 main`.
- [ ] 3.1.1 Extract the string-aware JSONC stripper from `scripts/check-no-zustand-writethrough.mjs` into `scripts/lib/strip-jsonc.mjs`. Update `check-no-zustand-writethrough.mjs` to import from the shared module. Re-run `pnpm test:scripts` to confirm no behavioural regression in the existing 11 fixtures.

### 3.2 — Guard script

- [ ] 3.2.1 Create `scripts/check-no-pii-leakage.mjs` per design D2 / D3. Walk `packages/workout-spa-editor/src/{components,hooks,lib}/**/*.{ts,tsx}` excluding `*.test.{ts,tsx}` and `*.stories.{ts,tsx}`.
- [ ] 3.2.2 Parse each file for four call-site dispatch shapes (canonical anchors):
  - **Member dispatch**: `(toast|useToastContext\(\))\s*\.\s*(error|success|info|warning)\(` and `console\.(log|warn|error|info|debug)\(`.
  - **Computed-member dispatch**: `(toast|useToastContext\(\))\s*\[\s*["'](error|success|info|warning)["']\s*\]\s*\(` — catches `toast["error"](...)` bypass.
  - **Destructured dispatch**: scan the file for `const\s*\{\s*([^}]+)\s*\}\s*=\s*useToastContext\(\)` and capture the bound names (e.g., `error`, `success`). Subsequent calls of the form `<bound-name>\(` within the same file are treated as in-scope; their first argument is checked.
  - **Re-bound dispatch**: scan the file for `const\s+([A-Za-z_$][\w$]*)\s*=\s*useToastContext\(\)` and capture the receiver name (e.g., `ctx`). Subsequent member-dispatch calls of the form `<ID>\.\s*(error|success|info|warning)\(` are treated as in-scope.
  - **Multi-binding ambiguity policy**: if a file contains conflicting bindings (e.g., a destructure and a re-bind, or two destructures from different sources), the script treats every potentially-toast `<name>(` or `<name>.<method>(` call as in-scope (false-positive bias is the safe default). The contributor either renames the conflict, refactors, or — last resort — allowlists the file under D9 criteria.
  Extract the first argument's source text using a balanced-paren scanner that respects string literals (so `toast.error("oops, ).")` parses correctly).
- [ ] 3.2.3 Validate the first argument shape per D3 in this exact order (bare-literal accept comes BEFORE rejection, so `toast.error("URL: example.com")` and `toast.error("a + b")` are accepted as bare literals despite their inner `:` and `+` characters):
  1. Trim leading/trailing whitespace.
  2. **Bare-literal accept first**: if the trimmed text matches `/^"[^"\\]*(?:\\.[^"\\]*)*"$/` or the equivalent single-quote regex, ACCEPT and continue to the next call site. Inner content is irrelevant — the bare-literal cannot interpolate.
  3. **Bare-identifier accept second**: if the trimmed text matches `/^[A-Z][A-Z0-9_]*$/`, scan the same file for a top-level `const <ID>\s*=\s*("[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*');` whose RHS is exactly a bare string literal. Depth-1 only per D8 — chains (`A → B → "x"`) are rejected at this step. If found, ACCEPT.
  4. **Reject everything else**: template literals, concatenation, parenthesized expressions (e.g., `("Failed")`), TS type assertions (`SAVE_FAILED as string`, `<string>SAVE_FAILED`, `SAVE_FAILED satisfies string`), TS post-fix operators (`SAVE_FAILED!`, `SAVE_FAILED as const`), unary operators (`void "Failed"`, `+SAVE_FAILED`), member access, function calls, lowercase / camelCase identifiers, identifier chains. The rejection message names the offending operator/shape verbatim so contributors can fix without consulting the spec: e.g., "rule R-PIIInterpolation: `SAVE_FAILED!` rejected — strip the non-null assertion; the constant is already statically known not-null".
- [ ] 3.2.4 Hard-coded allowlist — empty initially. The allowlist mechanism mirrors `check-no-zustand-writethrough.mjs`'s exported `ALLOWLIST` Set so test fixtures can manipulate it. Each entry MUST carry a comment satisfying D9 criteria.
- [ ] 3.2.5 CLI behaviour: print `✅ No PII / secret leakage detected.` on success; print one line per violation with file path, line number, call site, and the offending argument shape on failure. Exit 0 / 1.
- [ ] 3.2.6 The script must be ESM (`.mjs`), use no external dependencies (`node --test`-compatible), and follow the existing `scripts/check-no-zustand-writethrough.mjs` style (export `runCheck` and `ALLOWLIST` for test injection).

### 3.3 — Co-located test + fixtures

- [ ] 3.3.1 Create `scripts/check-no-pii-leakage.test.mjs` (`node:test`) covering twelve fixtures under `scripts/__fixtures__/check-no-pii-leakage/`:
- [ ] 3.3.1.1 Positive: post-rollout codebase passes — `runCheck()` against the real SPA editor source returns no violations.
- [ ] 3.3.1.2 Negative: template literal interpolating `error.message` is flagged (`toast.error(\`Failed: ${error.message}\`)`).
- [ ] 3.3.1.3 Negative: string concatenation with a closure-captured error is flagged (`console.error("Failed: " + err.message)`).
- [ ] 3.3.1.4 Negative: identifier reference to a non-top-level binding is flagged. Fixture: `try { ... } catch (err) { const msg = err.message; toast.error(msg); }` — `msg` is a function-local const, not top-level, so the depth-1 lookup fails and the call is rejected.
- [ ] 3.3.1.5 Negative: helper-call indirection at definition time is flagged (`const SAVE_FAILED = formatError(err); toast.error(SAVE_FAILED);` — RHS is a `CallExpression`, not a literal).
- [ ] 3.3.1.6 Negative: computed-member dispatch is flagged (`toast["error"](\`Failed: ${err.message}\`)` — the dispatch regex catches the bracket form).
- [ ] 3.3.1.7 Negative: destructured dispatch is flagged (`const { error } = useToastContext(); error(\`Failed: ${err.message}\`);` — the destructure scan binds `error` to the toast context, and the subsequent call is treated as in-scope).
- [ ] 3.3.1.8 Positive: bare string literal containing colons / plus signs is accepted (`toast.error("URL: https://example.com")`, `toast.error("a + b")`) — verifies that bare-literal acceptance runs BEFORE the rejection char-class.
- [ ] 3.3.1.9 Positive: bare SCREAMING_SNAKE_CASE identifier resolving to a top-level string-literal const is accepted (`const SAVE_FAILED_TOAST = "Failed to save"; toast.error(SAVE_FAILED_TOAST);`).
- [ ] 3.3.1.10 Positive: allowlist exemption — an allowlisted file with a template literal passes; the production allowlist is empty, the fixture injects an entry into the exported `ALLOWLIST` Set.
- [ ] 3.3.1.11 Negative: re-bound dispatch is flagged (`const ctx = useToastContext(); ctx.error(\`Failed: ${err.message}\`);` — the re-binding scan binds `ctx` to the toast context, treats `ctx.error(...)` as member dispatch).
- [ ] 3.3.1.12 Negative: identifier chain is flagged (`const A = B; const B = "x"; toast.error(A);` — depth-1 lookup of `A` finds the identifier `B` on the RHS, not a string literal).

### 3.4 — Wire into CI

- [ ] 3.4.1 Confirm `pnpm test:scripts` glob (`node --test scripts/*.test.mjs`) picks up `scripts/check-no-pii-leakage.test.mjs` automatically.
- [ ] 3.4.2 Run `pnpm test:scripts` locally — all green including the new file plus the existing 11 no-Zustand-writethrough fixtures (confirming D7 shared-primitive extraction did not regress).

### 3.5 — Existing audit reconciliation per D6

- [ ] 3.5.1 **Keep** `packages/workout-spa-editor/src/components/organisms/SettingsPanel/use-ai-tab-handlers.audit.test.ts` per D6 (CLAUDE.md "Never delete a test"). Add a one-line header comment to the audit file: `// Defense-in-depth: scripts/check-no-pii-leakage.mjs provides repo-wide coverage of the same rule. This focused vitest variant catches regressions in the package's test surface.`

### 3.6 — Validation

- [ ] 3.6.1 Run the new guard against the current SPA editor source: `node scripts/check-no-pii-leakage.mjs`. Address every flagged call site (refactor to a SCREAMING_SNAKE_CASE constant; do NOT allowlist unless D9 criteria are met).
- [ ] 3.6.2 Run `pnpm --filter @kaiord/workout-spa-editor test` — passing, including the kept AiTab audit.
- [ ] 3.6.3 Run `pnpm --filter @kaiord/workout-spa-editor lint` — clean.
- [ ] 3.6.4 Run `pnpm test:scripts` — passing.
- [ ] 3.6.5 Run `pnpm -r build` — clean.
- [ ] 3.6.6 Update internal docs (`CLAUDE.md` "Quality Standards" section): add a bullet referencing the new guard alongside the existing no-Zustand-writethrough one.
- [ ] 3.6.7 Add a `none` changeset unconditionally. The PR adds repo scripts (not packaged) and a comment-only edit to a `.test.ts` file inside the SPA editor; neither is a user-facing change. If the changeset bot complains, the right fix is to update `.changeset/config.json` `ignore` rules — never to misrepresent the change as `patch`.
- [ ] 3.6.8 Open PR; ensure CI green; squash merge.
- [ ] 3.6.9 After merge: clean local worktree and delete local branch.

## 4. Phase 4 — Cosmetic polish bundle (#266, #267, #268, #269, #270)

- [ ] 4.0 Worktree setup: `git worktree add -b feature/cleanup-issues-4-cosmetic-polish /Users/pablo/development/personal/kaiord-cleanup-4 main`.

### 4.1 — Shared @font-face extraction (#270)

- [ ] 4.1.1 Identify the three duplicate `@font-face` blocks: `packages/workout-spa-editor/src/index.css`, `packages/landing/src/styles/custom.css`, `packages/docs/.vitepress/theme/styles/brand-tokens.css`.
- [ ] 4.1.2 Extract into `packages/workout-spa-editor/src/styles/brand-fontface.css` (or a workspace-shared location if landing/docs cannot import from the editor's path due to build-system constraints; in that case create parallel files that import from a shared `packages/shared-styles/`).
- [ ] 4.1.3 Replace the inline blocks with `@import` references; verify each surface's font still loads in dev (`pnpm --filter @kaiord/workout-spa-editor dev`, `pnpm --filter @kaiord/landing dev`, `pnpm --filter @kaiord/docs dev`).

### 4.2 — Inter font size-adjust (#269)

- [ ] 4.2.1 Add `size-adjust: 100%` (or measured value if Inter's metrics differ from the system fallback) to the consolidated `@font-face` block, eliminating CLS on first paint.
- [ ] 4.2.2 Lighthouse CLS measurement: capture a one-before / one-after value; target reduction is non-zero. Capture in the PR description.

### 4.3 — Unified focus-visible (#268)

- [ ] 4.3.1 Copy the editor's `:focus-visible` ring rule into landing and docs CSS so all three surfaces show the same focus indicator.
- [ ] 4.3.2 Manual keyboard-tab smoke check: tab through landing nav, docs nav, editor calendar — focus ring identical width / colour / offset on all three.

### 4.4 — Viewport-fit + safe-area-inset (#267)

- [ ] 4.4.1 Update `packages/workout-spa-editor/index.html` `<meta name="viewport">` to include `viewport-fit=cover`.
- [ ] 4.4.2 Add `padding-{left,right,bottom}: env(safe-area-inset-{left,right,bottom})` to the SPA's root layout container.
- [ ] 4.4.3 Manual check using Playwright's `iPhone 14 Pro` device descriptor confirms no content under the notch and no white bars in landscape.

### 4.5 — gray → slate remap (#266)

- [ ] 4.5.1 **Spike — validate Tailwind 4 `@theme` mechanism BEFORE committing to the approach, with a captured artifact.** In a temporary branch, add the following to `packages/workout-spa-editor/src/index.css`:
  ```css
  @theme {
    --color-gray-50: var(--color-slate-50);
    --color-gray-500: var(--color-slate-500);
    --color-gray-800: var(--color-slate-800);
    --color-gray-950: var(--color-slate-950);
  }
  ```
  Create a temporary spike component `packages/workout-spa-editor/src/__spike__/gray-slate-spike.tsx` (excluded from production build) that renders one element per (utility-family × shade-extreme × dark-mode) cell. Minimum **10 cells**, covering all utility-emission pathways Tailwind 4 may treat differently: `bg-gray-50`, `bg-gray-500`, `bg-gray-950`, `text-gray-500`, `border-gray-500`, `ring-gray-500`, `outline-gray-500`, `divide-gray-500`, `placeholder-gray-400`, `dark:bg-gray-800`. Use `getComputedStyle()` in a Vitest at `__spike__/gray-slate-spike.test.tsx` to assert each gray utility's computed colour byte-equals the corresponding slate utility's value. Capture the test output (pass/fail per cell) and paste it in the spike PR description as the canonical artifact. If all cells pass → the `@theme` alias propagates; proceed to 4.5.2. If any cell fails → Tailwind 4 has inlined the gray values at build time; SKIP 4.5.2 and proceed to 4.5.4 (per-file fallback).
- [ ] 4.5.1a **Spike cleanup**: before the Phase 4 PR opens, `git rm -r packages/workout-spa-editor/src/__spike__` and confirm `find packages -type d -name __spike__` returns empty. Add a CI grep guard (one-line shell step in `.github/workflows/ci.yml` lint job): `! find packages -type d -name __spike__ | grep -q .` so a forgotten spike folder fails CI on any future PR.
- [ ] 4.5.2 (Conditional on 4.5.1 success) Edit the SPA editor's Tailwind 4 `@theme` block to remap every `--color-gray-*` shade (50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950) to the corresponding `--color-slate-*` value via `var()` aliases.
- [ ] 4.5.3 (Conditional on 4.5.1 success) Skip directly to 4.5.5 (screenshot diff).
- [ ] 4.5.4 (Conditional on 4.5.1 failure) Per-file fallback: `grep -rl 'gray-' packages/workout-spa-editor/src` and run a careful sed across each file replacing `(text|bg|border|ring|outline)-gray-(\d+)` → `\1-slate-\2`. Manually review the diff for any standalone `gray-` references (CSS custom property names, comments) that should not be touched.
- [ ] 4.5.5 Generate Playwright screenshot fixtures for at least: calendar week view, editor full-form, settings dialog (AI Tab + Privacy Tab), library dialog. Capture before / after screenshots. Post the diff in the PR description.
- [ ] 4.5.6 Spot-check for combinations that look jarring under slate (any stale hand-tinted colour that no longer matches the new neutral). Patch those few files individually if needed.

### 4.6 — Validation

- [ ] 4.6.1 Run `pnpm --filter @kaiord/workout-spa-editor test` — passing.
- [ ] 4.6.2 Run `pnpm --filter @kaiord/workout-spa-editor lint` — clean.
- [ ] 4.6.3 Run `pnpm -r build` — clean.
- [ ] 4.6.4 Run the Playwright e2e suite — passing; visual screenshot diff posted in PR description.
- [ ] 4.6.5 Add a `patch` changeset for `@kaiord/workout-spa-editor` titled `chore(spa-editor): cosmetic polish bundle (closes #266, #267, #268, #269, #270)`.
- [ ] 4.6.6 Open PR; ensure CI green; squash merge.
- [ ] 4.6.7 After merge: clean local worktree and delete local branch.

## 5. Phase 5 — Verify and archive

- [ ] 5.1 `git checkout main && git pull` to sync the merge commits from Phases 2, 3, 4.
- [ ] 5.2 Confirm `gh issue list --state open --json number | jq 'length'` returns 0 (or only newly auto-bot-opened issues post Phase 1).
- [ ] 5.3 Run `pnpm -r test`, `pnpm -r build`, `pnpm lint`, `pnpm test:scripts` on main — all green.
- [ ] 5.4 Confirm the change-scoped delta is well-formed: `openspec validate cleanup-open-issues-may-2026 --strict` passes. (Repo-wide `openspec validate --specs --strict` runs AFTER archive at task 5.6.5, when the new `spa-quality-gates` spec exists in `openspec/specs/`.)

### 5.5 — Spec-scenario coverage map (validated at archive time)

For each scenario in this change's `specs/spa-quality-gates/spec.md` ADDED block, identify the task that delivers the test. The order matches the spec's scenario order:

| # | Scenario | Task that adds the test |
| - | --- | --- |
| 1 | Toast string with template-literal interpolation is rejected | 3.3.1.2 |
| 2 | Concatenation with a closure-captured error is rejected | 3.3.1.3 |
| 3 | Identifier reference to a `catch` / function-parameter binding is rejected | 3.3.1.4 |
| 4 | Helper-call indirection at definition time is rejected | 3.3.1.5 |
| 5 | Computed-member dispatch (`toast["error"]`) is rejected | 3.3.1.6 |
| 6 | Destructured dispatch (`const { error } = useToastContext()`) is rejected | 3.3.1.7 |
| 7 | Re-bound dispatch (`const ctx = useToastContext(); ctx.error(...)`) is rejected | 3.3.1.11 |
| 8 | Identifier chain (`A → B → "x"`) is rejected (depth-1 only) | 3.3.1.12 |
| 9 | Bare string literal (including inner `:` / `+`) is accepted | 3.3.1.8 |
| 10 | Bare SCREAMING_SNAKE_CASE identifier with literal RHS is accepted | 3.3.1.9 |
| 11 | Allowlisted file with a template literal passes (test-injected `ALLOWLIST` Set) | 3.3.1.10 |
| 12 | Post-rollout codebase passes the static check | 3.3.1.1 |

- [ ] 5.5.1 Confirm the table above is bidirectionally in sync with the final spec scenarios at archive time: every scenario maps to a task AND every fixture (3.3.1.X) maps to a scenario. Adjust either side if drift is detected during the rollout.

### 5.6 — Archive

- [ ] 5.6.0a **Pre-flight**: run `pnpm lint:specs` against the change-scoped spec delta (`openspec/changes/cleanup-open-issues-may-2026/specs/spa-quality-gates/spec.md`) and `openspec validate cleanup-open-issues-may-2026 --strict` once more. Both green before invoking archive — the goal is to avoid discovering a spec-format issue mid-archive.
- [ ] 5.6.1 Run `openspec archive cleanup-open-issues-may-2026 --yes` — moves the change to `openspec/changes/archive/YYYY-MM-DD-cleanup-open-issues-may-2026/` and applies spec deltas to `openspec/specs/spa-quality-gates/spec.md` (creating the new capability spec).
- [ ] 5.6.2 **Verify the new capability spec was materialised correctly with H1 + `## Purpose` + `> Synced:` header.** The `openspec archive` CLI auto-emits these for new capabilities; double-check because new-capability creation is rare. Open `openspec/specs/spa-quality-gates/spec.md` and confirm: (a) line 1 is `> Synced: YYYY-MM-DD` matching the archive folder; (b) the H1 is exactly `# SPA Quality Gates` (no "or equivalent" — lock the wording to avoid drift across archive runs); (c) a `## Purpose` paragraph copied from the design.md D7 paragraph that begins "Mechanically enforced repo-wide quality gates" (search design.md for that exact opening). If any of (a)/(b)/(c) is absent, hand-write the trio. **PR-description guidance**: if the trio is hand-written, the archive PR's body MUST include a one-line note like "Hand-wrote H1+Purpose+Synced for new capability `spa-quality-gates` because `openspec archive` did not auto-emit them." so future archive PRs can be audited mechanically by grepping descriptions.
- [ ] 5.6.3 Add the `> Completed: YYYY-MM-DD` marker at the top of the archived `proposal.md`, where `YYYY-MM-DD` matches the folder prefix.
- [ ] 5.6.4 Run `pnpm archive:index` to regenerate `openspec/changes/archive/README.md`. Run `pnpm lint:archive` and `pnpm lint:archive-index` — both clean.
- [ ] 5.6.5 Run `openspec validate --specs --strict` and `pnpm lint:specs` against the materialised specs — the new `spa-quality-gates` spec must pass alongside the existing 27 specs, total 28 passing.
- [ ] 5.6.6 Open the archive PR; ensure CI green; squash merge.
