## Context

15 open issues. Triage matrix (state at proposal time, 2026-05-01):

| Bucket                                                        | Issues                       | Action                                                                            |
| ------------------------------------------------------------- | ---------------------------- | --------------------------------------------------------------------------------- |
| Stale CI failure auto-issues (commits superseded; main green) | #393, #355, #345             | Phase 1: close with reference to the green follow-up commit.                      |
| Stale security alerts (high-severity criterion no longer met) | #168, #177, #178, #182       | Phase 1: close with per-issue specific CVE / advisory ID + current package state. |
| Tracking meta-issue for an archived change                    | #388                         | Phase 1: close with link to the archive folder.                                   |
| Real user-visible bug                                         | #386 (404 on SPA refresh)    | Phase 2: rafgraph SPA-fallback pattern in `deploy-site.yml`.                      |
| Hardening follow-up                                           | #395 (PII guard)             | Phase 3: new mechanical guard script.                                             |
| Cosmetic polish (single-source `cosmetic-polish` change)      | #266, #267, #268, #269, #270 | Phase 4: bundled UI refinements.                                                  |

Issue **#395** is explicitly the deferred follow-up captured in `openspec/changes/archive/2026-04-30-persistence-read-rule-cleanup/design.md` under "Open Questions / Follow-ups". This change closes that loop. The pattern being generalised is the file-local `packages/workout-spa-editor/src/components/organisms/SettingsPanel/use-ai-tab-handlers.audit.test.ts`, which audited two files; the new repo-wide guard subsumes its scope while the original test stays as defense-in-depth (see D6).

The five phases are ordered to maximise short-term cleanup value (Phase 1 alone takes 8 issues out of the queue) while putting the highest-risk batch (Phase 4 #266 remap) behind the smaller fixes so reviewers see a steady drip of green main commits.

## Goals / Non-Goals

**Goals**

- Issue queue empties to ≤1 (only an issue opened during the rollout can survive).
- Every phase ends with main green on every CI lane (`test`, `lint`, `build`, `e2e-frontend`, `test-cli`, `test-frontend`, `test:scripts`).
- One real user-visible bug fixed and verified in production (#386), with a CI smoke step so regressions are caught.
- One hardening guard landed and wired into CI so future PRs cannot regress on the rule (#395), with a structural rule that does not allow indirection bypasses.

**Non-Goals**

- Migrating off GitHub Pages — the rafgraph SPA-fallback workaround is sufficient and reversible.
- Closing the 7 moderate `pnpm audit` findings — out of the auto-bot's high-severity criterion. Tracked as a separate sweep if any of them upgrades.
- Migrating the existing "No Zustand-to-Dexie write-through" requirement from `spa-persistence-port` to `spa-quality-gates`. The new capability houses only the new PII rule for now; consolidation is a future cleanup.

## Decisions

### D1. SPA fallback strategy for #386 — rafgraph/spa-github-pages root-redirect pattern.

GitHub Pages with a custom domain (kaiord.com is a CNAME → GitHub Pages model) serves the **root-level** `404.html` for unmatched paths regardless of the requested subdirectory. Per-subdirectory `404.html` files are unreliable (some Pages configs serve them, some don't, and the behaviour has changed silently across Pages updates). The empirical-spike approach ("just drop a 404.html in /editor/ and see if it works") is fragile; we adopt the documented, widely-deployed rafgraph pattern instead.

Mechanism (https://github.com/rafgraph/spa-github-pages):

1. **Root `404.html`** contains a small inline script that:
   - Captures `window.location.pathname` and `window.location.search`.
   - Encodes the **absolute path** (always leading `/`, e.g., `/editor/calendar`, never relative `editor/calendar`) into a single query string (`?p=%2Feditor%2Fcalendar`), URL-encoding `&` and `=` characters within the original path/query.
   - Calls `window.location.replace(...)` to redirect to the SPA's `index.html` at `/editor/?p=%2Feditor%2Fcalendar`.
   - Absolute-path emission is required so the SPA's `history.replaceState` is unambiguous regardless of any `<base href="/editor/">` declaration in `index.html`.
2. **SPA `index.html`** (the editor's entry point) contains an inline script that runs **before** the React bundle:
   - Detects the `?p=` query parameter.
   - Decodes it and calls `window.history.replaceState(null, null, decodedPath)` to restore the original URL.
   - The user sees `/editor/calendar` in the address bar; React Router resolves the route normally.

The redirect is server-driven (Pages serves `404.html`), so refresh, deep-link, and back-button all work uniformly. The decoder runs synchronously before React Router boots, so there is no flicker of `?p=...` in the URL bar.

The deploy workflow change (`.github/workflows/deploy-site.yml`):

- Replaces the root `merged-dist/404.html` with a rafgraph-shaped 404 (the existing landing's blue 404 markup PLUS the redirect script — the script triggers only if the path starts with `/editor/`, otherwise it lets the blue 404 render normally for landing routes).
- Injects the decoder script into `merged-dist/editor/index.html` after the SPA build, before artifact upload.
- VitePress already produces `docs/404.html`; docs is unaffected.

Why not a per-subdirectory `editor/404.html` copy? Pages behaviour is not contractually documented for that case; the rafgraph pattern works against any Pages config and is the standard SPA-on-Pages-subpath fix.

### D2. PII guard scope: SPA editor only, components AND hooks AND lib.

The existing `use-ai-tab-handlers.audit.test.ts` covers two files. The generalised guard scans:

- `packages/workout-spa-editor/src/components/**/*.{ts,tsx}` (UI consumers)
- `packages/workout-spa-editor/src/hooks/**/*.{ts,tsx}` (cross-cutting hooks that may toast)
- `packages/workout-spa-editor/src/lib/**/*.{ts,tsx}` (utility helpers that may `console.error`)
- excluding `*.test.{ts,tsx}` and `*.stories.{ts,tsx}`

Other packages (core, fit, tcx, zwo, garmin, garmin-connect, cli, mcp, garmin-bridge, train2go-bridge) are out of scope: they have no toast surface and their `console.*` is logger-internal (`@kaiord/core/adapters/logger`), already disciplined.

### D3. PII guard rule shape: SCREAMING_SNAKE_CASE identifier OR string literal — no chains, no indirection.

Two accepted argument shapes for `toast.{error,success,info,warning}(...)`, `useToastContext().{error,success,info,warning}(...)`, and `console.{log,warn,error,info,debug}(...)`:

1. A bare string literal: `toast.error("Failed to save profile")`.
2. A bare SCREAMING*SNAKE_CASE identifier (`/^[A-Z]A-Z0-9*]\*$/`) that resolves to a top-level `const X = "string-literal"` declaration whose right-hand side is **itself** a bare string literal — no template, no concatenation, no call, no other identifier.

Rejected:

- Template literals: `` `Failed to save: ${error.message}` ``.
- String concatenation: `"Failed: " + error.message`.
- Identifier reference to a `catch (err)` binding, function parameter, or any closure-captured variable.
- Bare lowercase / camelCase identifiers (the existing audit at `use-ai-tab-handlers.audit.test.ts:46` enforces SCREAMING_SNAKE_CASE; the new guard does not weaken that).
- Identifier chains (`const A = B; const B = "x"; toast.error(A);`) — the rule is depth-1 only. The const must directly equal a string literal, not transitively.
- Helper-function indirection at definition time (`const SAVE_FAILED_TOAST = formatError(err); toast.error(SAVE_FAILED_TOAST);` — the RHS is a `CallExpression`, not a literal, so the identifier reference fails the rule).

The rule is **structural**: it forbids interpolation in any form, regardless of which field gets interpolated. The threat model lists `apiKey`, `externalUserId`, `externalUserName`, `error.message` as illustrative leak categories that the structural rule covers, but the script does not inspect identifier names — it inspects argument shape.

The script's parser is regex-grade (matching the style of `check-no-zustand-writethrough.mjs`). The canonical implementation list lives in tasks.md `3.2.3`; this paragraph is a high-level English summary. Four dispatch shapes are recognized as call-site anchors:

1. Member dispatch (including `console.*`): `(toast|useToastContext\(\))\s*\.\s*(error|success|info|warning)\(...)` and `console\.(log|warn|error|info|debug)\(...)`.
2. Computed-member dispatch: `(toast|useToastContext\(\))\s*\[\s*["'](error|success|info|warning)["']\s*\]\s*\(...)`.
3. Destructured dispatch (`const { error } = useToastContext(); error(...);`) — the script tracks `useToastContext()` destructuring patterns within a file and treats subsequent calls to those bindings as in-scope.
4. Re-bound dispatch (`const ctx = useToastContext(); ctx.error(...);`) — the script tracks `const <ID> = useToastContext()` re-bindings and treats subsequent `<ID>.<method>(...)` calls as member dispatch on a known toast receiver.

If a file contains conflicting bindings (multiple destructures from different sources, or a destructure plus a re-bind), the script biases to false-positives: every `<name>(` or `<name>.<method>(` call is treated as in-scope. See tasks 3.2.2.

For each call site, extract the first argument's source text and trim whitespace. The acceptance check runs in this order (see tasks 3.2.3 for the implementation):

1. **Bare-literal accept first**: if the trimmed text matches `/^"[^"\\]*(?:\\.[^"\\]*)*"$/` or the equivalent single-quote regex, ACCEPT regardless of inner content (so `toast.error("URL: example.com")` is accepted even though the body contains `:`).
2. **Bare-identifier accept second**: if the trimmed text matches `/^[A-Z][A-Z0-9_]*$/`, scan the same file for a top-level `const <ID>\s*=\s*("...")|('...');` whose RHS is exactly a bare string literal (depth-1 only; no chains, no calls, no expressions). If found, ACCEPT.
3. **Reject everything else**: any remaining shape (template literals, concatenation, parenthesized expressions, TS type assertions `as`/`<>`/`satisfies`, TS post-fix operators `!`/`as const`, unary operators `void`/`+`, member access, calls, lowercase identifiers, identifier chains) is rejected. The rejection message names the offending operator/shape verbatim so contributors can fix without consulting the spec.

Parenthesized literals (e.g., `toast.error(("Failed"))`), non-null assertions (`SAVE_FAILED!`), and `as const` post-fixes are rejected as a strict-shape false positive. Contributors strip the operator at the call site; the rejection message recommends this.

Encoders for D1 SHALL emit absolute paths (`/editor/calendar`, never relative `editor/calendar`) so the `history.replaceState` call is unambiguous regardless of any `<base href="/editor/">` declaration in the SPA's `index.html`.

### D4. Cosmetic polish bundle: one PR with internal commit-per-chore, screenshot-diff gate.

Single PR. The five chores total ≤300 lines of CSS + index.html changes (excluding the gray→slate remap, which is a single `@theme` alias block). Splitting them creates five trivial PRs each requiring its own CI pass; bundling reflects the user's recorded preference for fatter PRs over thinner ones.

The high-risk one (#266 gray→slate via Tailwind 4 `@theme` alias) gets:

- A **spike task** at Phase 4 task 4.5.1 that validates the `@theme` override actually propagates to already-emitted utility classes (`bg-gray-*`, `text-gray-*`, `dark:bg-gray-*`, etc.) before committing to the approach. The spike runs `pnpm dev` and inspects DevTools' computed-style values for at least one element using each gray utility shade.
- An **explicit fallback** at Phase 4 task 4.5.X: if the `@theme` alias does not propagate (Tailwind 4's emission strategy may inline values at build time), the fallback is a per-file `gray-*` → `slate-*` find-and-replace across the ~90 files. The fallback is pre-decided here, not a runtime panic decision.
- A **screenshot-diff gate** via Playwright fixtures: at minimum calendar week view, editor full-form, AI Tab + Privacy Tab in settings, library dialog. Before/after diffs posted in the PR description for human visual review.

### D5. Phase 5 archive: lint:archive invariant.

Same convention as `2026-04-30-persistence-read-rule-cleanup`: archive folder is `YYYY-MM-DD-cleanup-open-issues-may-2026` where `YYYY-MM-DD` matches the `> Completed:` marker added to the archived `proposal.md`. `pnpm lint:archive` enforces the invariant; `pnpm archive:index` regenerates `openspec/changes/archive/README.md`. Both run in CI.

### D6. Existing audit reconciliation: KEEP `use-ai-tab-handlers.audit.test.ts` as defense-in-depth.

CLAUDE.md states: "Never delete a test. Never skip a test." The existing audit at `packages/workout-spa-editor/src/components/organisms/SettingsPanel/use-ai-tab-handlers.audit.test.ts` audits two files via vitest (runs in `pnpm --filter @kaiord/workout-spa-editor test`). The new repo-wide guard runs in `pnpm test:scripts`. Two test surfaces catching the same regression is defense-in-depth, not duplication. The two are kept side-by-side; if the AiTab audit ever drifts (e.g., the SCREAMING_SNAKE_CASE allowlist grows in a way the broader script's allowlist does not), reviewers see the divergence in two places.

If a future contributor finds the duplication burdensome, they may propose a separate change to remove the focused audit, but it is **not** removed by this rollout.

### D7. Spec capability scope: NEW `spa-quality-gates` capability houses the PII rule.

`spa-persistence-port`'s `## Purpose` is "PersistencePort contract (workouts, templates, profiles, AI providers, sync state, monthly usage) and the Dexie adapter that backs editor-local state in IndexedDB." Toast strings and console messages are not part of that contract; placing the PII rule there stretches the capability beyond its purpose.

The new `spa-quality-gates` capability houses the PII rule and serves as a home for future static-source-style guards (e.g., the existing No Zustand-to-Dexie write-through requirement could migrate here in a future cleanup, but that consolidation is **not** in this rollout's scope per the proposal's Out-of-Scope list).

The new capability's `## Purpose`: "Mechanically enforced repo-wide quality gates implemented as static-source `pnpm test:scripts` checks. Each requirement specifies a structural rule the SPA editor source code SHALL obey, plus the script that enforces it in CI."

### D8. Identifier-chain depth: depth-1 only, no recursion.

Per Spec Analyst's finding, the spec language must bound the identifier chain. **Decision**: depth-1 only. The const's right-hand side must be a string literal directly; transitively-resolved chains (`A → B → "x"`) are rejected.

Rationale: matches the existing audit (no chain following). Avoids cycle-detection complexity in the script. Keeps the rule trivially auditable by a reviewer reading the code (the toast call's identifier resolves to a literal in one hop).

### D9. Allowlist criterion: narrowly constrained.

D3's structural rule is strict; legitimate exceptions exist (e.g., echoing a user-typed value back in the same render frame, where the value is the user's own data and not PII in the GDPR sense). To prevent the allowlist from becoming a leaky abstraction:

**Allowlist criterion** (codified in the script's allowlist comment block):

1. The interpolated value MUST originate from the same user's same-render-frame input (no traversal across a network boundary, no read from persisted storage of another entity, no read from any field named `apiKey` / `externalUserId` / `externalUserName` / `email` / `phone` / `address`).
2. The interpolated value MUST never be written to a persistent log (`console.error`, `console.warn`, analytics events, server logs).
3. Each allowlist entry MUST carry a one-line comment with: (a) the file path + line, (b) the value being interpolated, (c) why it satisfies criteria (1) and (2).

Initial allowlist: empty. Phase 3 sweep is expected to surface zero legitimate exceptions (the existing audit already enforces SCREAMING_SNAKE_CASE in AiTab; the broader sweep will surface debug `console.error` template literals that should be refactored to constants, not allowlisted).

A PR adding to the allowlist must include a reviewer comment confirming criteria (1) and (2). Reviewers cite this design decision when rejecting inappropriate allowlist additions.

## Risks / Trade-offs

- **R1 — Bot reopens a stale issue mid-sweep.** A new CI failure between Phase 1 close-out and the final main-green commit would reopen one of the auto-categories. Acceptable: the close-out comments document the specific CVE/commit, and the new issue would point at a fresh commit anyway.
- **R2 — Phase 4 #266 visual regression.** Tailwind `gray-*` and `slate-*` differ in undertone (warm vs cool); some component combinations look fine in isolation but jarring side-by-side. Mitigations: the spike task validates the `@theme` mechanic before commit, the per-file fallback is pre-decided, the screenshot-diff gate runs against a representative fixture set, and the PR description carries before/after screenshots.
- **R3 — Phase 3 PII guard false positives.** Sweep across all of `components/**`, `hooks/**`, `lib/**` will surface legitimate-but-not-allowlisted call sites. Mitigation: each surfaced site refactors to a SCREAMING_SNAKE_CASE constant; allowlist remains empty unless D9 criteria are met.
- **R4 — Phase 2 rafgraph script edge cases.** The redirect-then-decode mechanic has known edge cases: hash fragments in the original URL, deep query strings, and routes that legitimately want a literal `?p=...` parameter. Mitigations: the rafgraph reference implementation handles fragments and double-encoding; route table contains no `p` query param today; the CI smoke step exercises the round-trip on at least one representative route.
- **R5 — Phase 3 regex parser brittleness.** Iteration-3 closed the high-likelihood bypasses (`toast["error"](...)`, `const { error } = ...`, `const ctx = ...`). Genuinely exotic shapes remain known limitations: receiver type-assertions (`(toast as any).error(...)`), decorator-modified toast functions, dynamic `Function`-constructed dispatch. These are out-of-scope for the structural script — they fail human review on aesthetic grounds long before they fail a CI check. Mitigations: D2 scope excludes test files where these tricks are most likely; the existing AiTab audit (D6 keep) catches the _covered_ shapes redundantly but does NOT extend coverage to type-assertion bypasses; the D9-criteria allowlist is the controlled escape hatch.

## Migration Plan

This change is internally consistent and forward-rollable; nothing here is a destructive migration. The phases are sequential because each one is a reviewable PR, but Phase 4 could merge before Phase 3 without correctness risk (the order chosen is by triage value, not by dependency).

## Follow-ups

All design questions are resolved by D1–D9; the items below are deliberately out-of-scope follow-ups.

- **Follow-up: 7 moderate-severity `pnpm audit` findings.** Out of scope for this change (the auto-bot fires on high/critical). If any moderate upgrades to high during the rollout, the new auto-issue gets handled in the next sweep. Closure rationale in Phase 1 cites the criterion explicitly so the paper trail is clear.
- **Follow-up: visual regression test infrastructure.** Phase 4 #266 leans on Playwright screenshots. If the existing fixture set is thin, the visual diff is partial coverage, not a guarantee. Tracked as a candidate for a future sweep — not blocking this rollout.
- **Follow-up: consolidate static-source guards under `spa-quality-gates`.** The existing "No Zustand-to-Dexie write-through" requirement under `spa-persistence-port` could migrate to the new `spa-quality-gates` capability for a cleaner separation of concerns. Out of scope for this rollout; a future spec-only refactor.
