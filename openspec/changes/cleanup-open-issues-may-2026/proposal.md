## Why

The repo has 15 open issues. Triage shows the queue is mostly noise:

- **8 stale auto-bot artefacts** that no longer reflect reality. Three CI failure tickets (#393, #355, #345) point at commits that have since been superseded — `gh run list` confirms main is green from `cf14aa4` onward. Four security alerts (#168, #177, #178, #182) reported "high" severity dependency findings; today `pnpm audit` reports 0 high and 0 critical (7 moderate remain — out of scope for the high-severity bot rule). The tracking meta-issue #388 is for the persistence-read-rule-cleanup change, archived as `2026-04-30-persistence-read-rule-cleanup`.
- **1 user-visible bug**: #386 — refreshing `kaiord.com/calendar` (or any in-app SPA route) returns the landing's static `404.html` because GitHub Pages has no SPA fallback configured.
- **1 hardening follow-up**: #395 — the deferred PII / secret-leakage mechanical guard documented in the archived `persistence-read-rule-cleanup`'s `design.md` "Open Questions / Follow-ups" section. The pattern exists locally (`use-ai-tab-handlers.audit.test.ts`); it has not been generalised across the SPA editor.
- **5 cosmetic chores** (#266, #267, #268, #269, #270) from a prior `cosmetic-polish` change: gray→slate remap (~90 affected files; resolved via a one-line Tailwind `@theme` alias per Phase 4 task 4.5.2), viewport `safe-area-inset` for notch devices, focus-visible unification across landing/docs/editor, Inter `size-adjust` for CLS, and shared `@font-face` extraction.

The list as-is creates triage friction: every time a contributor opens issues, they have to mentally filter out the noise to find real work. Closing them in coordinated phases — each ending with main green on every CI lane — clears the queue, keeps progress visible, and lands the one real fix (#386) and the one hardening item (#395) without losing them in the cosmetic batch.

## What Changes

Five phases, each shipping as a single squash-merged PR with main green at end-of-phase:

1. **Triage sweep** (no code, just GitHub bookkeeping) — close #388, #393, #355, #345, #168, #177, #178, #182. Each closure carries an issue-specific rationale (resolving commit SHA for CI failures; specific CVE/advisory ID + current package state for security alerts; archive-folder reference for the meta-issue).
2. **SPA refresh 404 fix** (#386) — add the rafgraph/spa-github-pages SPA-fallback pattern: root `404.html` contains a redirect script that captures the requested path, encodes it into a query string, and redirects to the SPA's `index.html`; the SPA's `index.html` contains a decoder that restores the path via `history.replaceState` before React Router boots. A CI smoke step `curl`s a representative deep route post-deploy and asserts the SPA bundle bytes are returned, so the fix is self-monitoring.
3. **PII / secret-leakage mechanical guard** (#395) — generalise `use-ai-tab-handlers.audit.test.ts` into `scripts/check-no-pii-leakage.mjs`. Walk every file under `packages/workout-spa-editor/src/{components,hooks,lib}/**` that calls `useToastContext().{error,success,info,warning}(...)`, `toast.{...}(...)`, or `console.{log,warn,error,info,debug}(...)`. Each call's first argument MUST be either (a) a bare string literal, OR (b) a bare SCREAMING_SNAKE_CASE identifier resolving to a top-level `const X = "string-literal"` whose right-hand side is itself a bare string literal — no template literals, no concatenation, no helper indirection, no chain following beyond depth 1. Wired into `pnpm test:scripts` with a fixture matrix covering the structural-bypass cases. The existing `use-ai-tab-handlers.audit.test.ts` is **kept** as defense-in-depth (per CLAUDE.md "Never delete a test").
4. **Cosmetic polish bundle** (#266–#270) — five small UI refinements:
   - **#270** extract a shared `styles/brand-fontface.css` and import it from `brand-tokens.css`, `custom.css`, and `index.css` so a unicode-range or weight change happens in one place.
   - **#269** add `size-adjust: 100%` (or measured value) to the Inter `@font-face` rules to reduce Cumulative Layout Shift on first paint.
   - **#268** copy the editor's `:focus-visible` ring into landing and docs CSS so all three surfaces show the same focus indicator.
   - **#267** add `<meta name="viewport" content="..., viewport-fit=cover">` and `padding: env(safe-area-inset-*)` on the SPA's root layout for notch-device support.
   - **#266** remap Tailwind `gray-*` to `slate-*` editor-wide via a single `@theme` alias block. A spike task validates the override actually propagates to compiled utility classes before committing to the approach; if it does not, the design's reserved fallback (per-file `gray-*` → `slate-*` find-and-replace) ships instead. Visual-diff gate via Playwright screenshot fixtures.
5. **Verify and archive** — `pnpm -r test`, `pnpm -r build`, `pnpm lint`, `pnpm test:scripts` all green on main. Archive this change to `openspec/changes/archive/YYYY-MM-DD-cleanup-open-issues-may-2026/`. Confirm the GitHub issue list is empty (modulo any new auto-bot issue opened during the rollout — those become the next sweep, not this change's responsibility).

## Impact

- **Affected specs**:
  - **NEW capability** `spa-quality-gates` (1 ADDED requirement: "User-facing string hygiene"). The PII / secret-leakage guard is mechanically enforced by `scripts/check-no-pii-leakage.mjs`, parallel in style to the existing `scripts/check-no-zustand-writethrough.mjs`. Housing the rule under a new `spa-quality-gates` capability avoids stretching `spa-persistence-port` (whose `## Purpose` is the PersistencePort contract) to cover UI-presentation hygiene. Long-term, the existing "No Zustand-to-Dexie write-through" requirement could migrate to `spa-quality-gates` too; that migration is a separate change, not this one.
- **Affected code**:
  - `.github/workflows/deploy-site.yml` (Phase 2): replace the root `404.html` build with the rafgraph redirect script; inject the decoder snippet into the SPA's `index.html`; add a post-deploy smoke step that curls a representative deep route.
  - `scripts/check-no-pii-leakage.mjs` + `scripts/check-no-pii-leakage.test.mjs` + `scripts/__fixtures__/check-no-pii-leakage/` (Phase 3, new files).
  - `scripts/lib/strip-jsonc.mjs` (Phase 3, extracted from `check-no-zustand-writethrough.mjs` and shared with the new script).
  - `packages/workout-spa-editor/src/styles/brand-fontface.css` (Phase 4 / #270, new file).
  - `packages/workout-spa-editor/src/index.css`, `packages/landing/src/styles/custom.css`, `packages/docs/.vitepress/theme/styles/brand-tokens.css` (Phase 4 / #268, #269, #270).
  - `packages/workout-spa-editor/index.html` and `packages/workout-spa-editor/src/components/templates/MainLayout/MainLayout.tsx` (Phase 4 / #267).
  - `packages/workout-spa-editor/src/index.css` Tailwind `@theme` block (Phase 4 / #266).
- **Affected tests**: new `scripts/check-no-pii-leakage.test.mjs` with twelve fixtures listed in the same order as the spec scenarios: (1) template-literal rejection, (2) concatenation rejection, (3) `catch` / function-parameter binding rejection, (4) helper-call indirection rejection, (5) computed-member dispatch (`toast["error"]`) rejection, (6) destructured dispatch (`const { error } = useToastContext()`) rejection, (7) re-bound dispatch (`const ctx = useToastContext(); ctx.error(...)`) rejection, (8) identifier-chain rejection (depth-1 only), (9) bare-literal positive (including inner `:` / `+`), (10) SCREAMING_SNAKE_CASE positive, (11) allowlist-injected positive, (12) post-rollout positive. The existing AiTab audit at `use-ai-tab-handlers.audit.test.ts` stays as defense-in-depth.
- **Risk**:
  - **Phase 2 SPA fallback**: the rafgraph pattern is a documented, widely-deployed workaround; the empirical risk is the SPA `index.html`'s decoder running before React Router boots. Mitigation: smoke-test in a deploy-preview branch before the production merge; CI smoke step catches future regressions.
  - **Phase 3 PII guard false positives**: extending the rule across all of `components/**`, `hooks/**`, and `lib/**` will likely surface a few legitimate template literals in `console.error` debug paths. Mitigation: each call site refactors to a SCREAMING_SNAKE_CASE constant; the allowlist mechanism is intentionally narrow per design D9.
  - **Phase 4 #266 visual regression**: gray and slate differ in undertone; the screenshot-diff gate may surface unexpected combinations. Mitigation: the per-file fallback is pre-decided in design.md D4 and an explicit task branch in 4.5.
- **Out of scope**:
  - Fixing the 7 moderate-severity `pnpm audit` findings (the auto-bot fires only on high/critical; track separately if any of them upgrades).
  - Migrating off GitHub Pages — the rafgraph workaround in Phase 2 is sufficient and reversible.
  - Migrating the existing "No Zustand-to-Dexie write-through" requirement from `spa-persistence-port` to the new `spa-quality-gates` capability — out of scope; tracked as a future cleanup if needed.
  - Any new `useWorkoutStore` write paths or persistence-port surface changes — Phase 4 is presentation-only.
