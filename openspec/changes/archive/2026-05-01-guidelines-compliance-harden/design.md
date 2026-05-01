## Context

The May 2026 guidelines audit revealed two classes of drift:

1. **Documentation-only rules**: rules documented in `.claude/skills/guidelines/*/SKILL.md` (mapper-vs-converter, commit type vocabulary, no-skip-tests, allowed `core/adapters/` folders) with no script enforcement, accumulating quiet violations over time.
2. **Phantom enforcement**: the `hexagonal-arch` spec scenarios reference `check-architecture.js` as the enforcing hook (e.g., "the `check-architecture.js` hook blocks the edit with exit code 2"), but no such script exists. The current pre-commit hook only runs `pnpm build && tsc --noEmit && pnpm test && pnpm test:scripts` — none of which inspects layer boundaries.

The user's standing preference is **mechanical guards > AI review**: every invariant that can be a script, lint rule, or commitlint MUST be one. This change converts the doc-only rules into machine-checked rules and backfills the missing `check-architecture` script the spec already promises.

A secondary discovery: the `architecture-hexagonal` guideline doc says "logger is the only built-in adapter in core", but the live `analytics-port` spec mandates `@kaiord/core/adapters/analytics`. The spec wins (specs are canonical truth); the guideline doc is stale. This change aligns the doc and the new architecture script to a `{logger, analytics}` allowlist.

## Goals / Non-Goals

**Goals:**

- Every rule in the seven guideline SKILL.md files that can be mechanically enforced IS mechanically enforced via `pnpm test:scripts`, `pnpm lint`, husky `pre-commit`, or husky `commit-msg`.
- The `check-architecture.js` reference in the `hexagonal-arch` spec resolves to a real, tested script (`scripts/check-architecture.mjs`) before this change is archived.
- Existing drift (7 mapper-with-tests, 3 converters-without-tests, 5 unconditional `it.skip`, 1 misplaced `*.d.ts`, 1 Spanish README) is cleaned up so the new guards pass on `main` from day one — no allowlist entries for "pre-existing violations".
- The `{logger, analytics}` allowlist for `core/adapters/` is the single source of truth, codified in the spec, the guideline doc, and the script.
- Public APIs of `@kaiord/core` and every adapter package are unchanged.

**Non-Goals:**

- Renaming `spa-quality-gates` to something less SPA-flavored (the capability is repo-wide despite the prefix; renaming is churn for no behavior gain).
- Extracting `@kaiord/core/adapters/analytics` into its own package (the active spec mandates it lives in core; the audit's earlier "extract analytics" instinct contradicted the canonical spec).
- Refactoring the 23 files >100 LOC found in the audit. Size-rule enforcement is a separate, larger conversation (e.g., a `max-lines` ESLint rule with per-package overrides) and would inflate this change beyond a coherent guard-and-cleanup bundle.
- Translating any markdown beyond `packages/core/src/tests/fixtures/README.md` (it was the only Spanish-content file the audit found).
- Adding `--no-verify` detection. There is no reliable way to detect post-bypass; the robust move is removing the hint and relying on CI to re-run the same checks. CI failure is the backstop.

## Decisions

### D1. Architecture guard as a static-source AST script (not an ESLint plugin)

**Choice:** Implement `scripts/check-architecture.mjs` as a `node:test`-tested static-source check using `@typescript-eslint/typescript-estree` (already a transitive dep of the ESLint config) for AST parsing.

**Why over an ESLint plugin:**

- Existing pattern in this repo: `check-no-pii-leakage.mjs`, `check-no-zustand-writethrough.mjs`, `check-spec-format.mjs` all follow the same `scripts/check-*.mjs` + `node:test` shape. Consistency wins.
- Hooks into `pnpm test:scripts` (already wired into the husky `pre-commit` hook) without touching ESLint config across 14 packages.
- A separate process means a layer-rule failure prints a clean focused error, not buried in lint noise.
- Trivial to extend for new layer rules without bumping any ESLint version.

**Rules the script enforces (all hard-fail):**

| Rule ID                      | Forbids                                                                                                                                  | Layer       |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `R-ArchLeftward`             | `packages/core/src/domain/**` importing from `application/`, `adapters/`, or `ports/`                                                    | domain      |
| `R-ArchPortPure`             | `packages/core/src/ports/**` importing from `application/`, `adapters/`, or any non-domain runtime module                                | ports       |
| `R-ArchAppPure`              | `packages/core/src/application/**` importing from `adapters/` or any external library (allowlist: only relative `../domain`, `../ports`) | application |
| `R-ArchDomainExt`            | `packages/core/src/domain/**` importing from any external library other than `zod`                                                       | domain      |
| `R-ArchAdapterCross`         | `packages/{fit,tcx,zwo,garmin}/src/**` importing from a sibling format adapter                                                           | adapters    |
| `R-ArchCoreAdapterAllowlist` | any new folder under `packages/core/src/adapters/` outside `{logger, analytics}`                                                         | core layout |
| `R-ArchCoreAmbientTypes`     | any `*.d.ts` under `packages/core/src/` that contains `declare module "<external-pkg>"`                                                  | core layout |

The script reads only static source under `packages/`; no compilation is required. JSDoc-only references to forbidden symbols (e.g., `@kaiord/fit` inside a `/** ... */` block) are correctly ignored because the AST walker only inspects `ImportDeclaration` and `ExportNamedDeclaration` nodes.

### D2. Commit-format enforcement via commitlint + husky `commit-msg`

**Choice:** Add `@commitlint/cli` + `@commitlint/config-conventional` as dev deps, plus `commitlint.config.mjs` consuming a separate `commitlint.vocab.mjs` const-arrays module:

```js
// commitlint.vocab.mjs
export const TYPE_ENUM = [
  "feat",
  "fix",
  "chore",
  "test",
  "docs",
  "refactor",
  "perf",
];
export const SCOPE_ENUM = [
  "core",
  "fit",
  "tcx",
  "zwo",
  "garmin",
  "garmin-connect",
  "ai",
  "cli",
  "mcp",
  "spa-editor",
  "garmin-bridge",
  "train2go-bridge",
  "analytics",
  "landing",
  "docs-site",
  "openspec",
  "ci",
  "docs",
  "scripts",
  "deploy",
  "release",
  "deps",
  "deps-dev",
  "e2e",
];

// commitlint.config.mjs
import { TYPE_ENUM, SCOPE_ENUM } from "./commitlint.vocab.mjs";
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [2, "always", TYPE_ENUM],
    "scope-enum": [2, "always", SCOPE_ENUM],
    "subject-case": [0],
  },
};
```

Plus `.husky/commit-msg`:

```sh
pnpm exec commitlint --edit "$1"
```

**Drift-detection between docs and rule:** the same arrays are reproduced verbatim inside a fenced block in `git-strategy/SKILL.md` between the markers `<!-- commitlint-source-of-truth:start -->` and `<!-- commitlint-source-of-truth:end -->`. The test in `scripts/check-commitlint-config.test.mjs` parses the SKILL.md block, imports `commitlint.vocab.mjs`, and asserts equality. This is NOT a tautology — the test compares two files against each other, so changing one without the other fails CI.

**Scope-enum, audited from the last 100 commits on `main`** (this captures real usage that the original audit-derived list missed):

The audit revealed scopes used in real history that were absent from the original allowlist: `analytics, landing, docs-site, deploy, release, deps, deps-dev, e2e`. They are added. Scopes that appeared in history but are normalized away (NOT added; contributors must use the canonical form): `bridges` → `garmin-bridge` or `train2go-bridge`; `editor` / `spa` / `workout-spa-editor` → `spa-editor`; `cspell` / `prettier` → `ci`; `cws` → `garmin-bridge` (CWS publish belongs to the bridge package); `bridge-runtime-discovery`, `spec-code-drift` → `openspec` (these were change-slug names misused as scopes).

**Multi-scope subjects:** `@commitlint/config-conventional` rejects comma-separated scopes by default. We KEEP this default (rejecting `refactor(core,fit,tcx): foo`) because the `git-strategy/SKILL.md` example template uses single-scope subjects, AND because multi-scope subjects fragment the changeset/scope-traceability story. The four PR titles in this proposal (D7) are constructed with single scopes accordingly. The test asserts a multi-scope subject is rejected.

**Why over a pure-Node script:**

- `@commitlint/config-conventional` already implements RFC-grade conventional-commit parsing (footers, breaking-change detection, multi-line bodies). Reimplementing that is wasted effort and a future bug surface.
- Standard tool: any contributor familiar with conventional-commit projects already knows commitlint.
- Vocabulary lives in `commitlint.vocab.mjs`; the test parses `git-strategy/SKILL.md` to detect drift, so the doc and the rule cannot diverge silently.

**Why not a `pnpm test:scripts` git-log scan instead:**

- A commit-msg hook fails fast at commit time (immediate, local, fixable) — much better DX than failing in CI after pushing.
- A retroactive log scan would also flag historical commits, which is irrelevant churn.

**CI backstop:** the existing `.github/workflows/ci.yml` already runs `pnpm test:scripts`. To prevent `--no-verify` bypasses from escaping at merge time, this change verifies (and adds, if absent) a `pnpm exec commitlint --from <merge-base> --to HEAD` step that re-validates every commit on the PR branch. Local hook + CI backstop = robust.

### D3. Mapper/converter rules as two separate scripts

**Choice:** Two scripts, not one. `check-mapper-no-tests.mjs` and `check-converter-has-tests.mjs`.

**Why:** They report different violations with different fixes (rename a file vs. add a test). Splitting keeps each script's failure message single-purpose and the test fixtures small.

**Mapper renames (the cleanup half):** all 7 mapper-with-tests files become `*.converter.{ts,tsx}` (preserving the test name change too). Barrel exports (`index.ts`) and call sites are updated. The exported symbol names are unchanged — this is purely a file-rename + import-path update.

The single `.mapper.ts` flagged at 120 LOC (`krd-to-fit-metadata`) becomes a `.converter.ts` and the 100-LOC rule is not re-enforced in this change; that's a separate file-size guard out of scope here.

### D4. No-skip rule with one tightly-scoped allowance

**Choice:** `scripts/check-no-unconditional-skip.mjs` rejects every `it.skip|test.skip|describe.skip|*.only|*.todo` access on `it`/`test`/`describe`, across all four dispatch shapes (member, computed-member, destructured, re-bound — same precedent as `check-no-pii-leakage.mjs`). It explicitly allows `*.skipIf(<expression>)` ONLY when `<expression>` contains at least one runtime-evaluated identifier reference, function call, or member-expression read. Pure-literal arguments (`skipIf(true)`, `skipIf(1)`, `skipIf("x")`, `skipIf(null)`) are rejected — they are functionally equivalent to an unconditional skip.

This carve-out preserves the legitimate env-gated pattern (e.g., `describe.skipIf(!process.env.GARMIN_EMAIL)`) while preventing the obvious bypass `it.skipIf(true)`.

**Hook ordering:** `.husky/pre-commit` is reordered so `pnpm test:scripts` runs BEFORE `pnpm test`. Otherwise an `it.only` could pass the test runner (because `.only` makes it the only test) and the broader suite would silently be masked. Running the no-skip check first catches `.only` before the test runner ever sees it.

**Cleanup of the 5 current unconditional skips:**

| Site                                        | Treatment                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CalendarPage.test.tsx:89,99,113` (3×)      | Fix the underlying drag-and-drop / fixture issue and unskip. RED → GREEN per test.                                                                                                                                                                                                                                                                         |
| `json-parser.test.ts:462` (perf complexity) | Replace the skipped O(n) assertion with a deterministic three-input fast-path test that asserts ONLY what is currently true about `json-parser` (e.g., output equality on three increasing inputs, no time-budget assertion). No production code changes. If a future contributor wants a perf budget, that's a separate `json-parser-perf-budget` change. |
| `xsd-validator.test.ts:47` (Node-only)      | Convert to `it.skipIf(typeof window !== "undefined", "...")` so it actually runs in Node CI.                                                                                                                                                                                                                                                               |

### D5. Stale guideline doc gets the analytics carve-out (with drift-detection)

**Choice:** The `{logger, analytics}` allowlist for `core/adapters/` lives in a single source-of-truth module `scripts/architecture.vocab.mjs` exporting `CORE_ADAPTER_ALLOWLIST`. The same array is reproduced verbatim inside `<!-- arch-vocab:start --> ... <!-- arch-vocab:end -->` markers in `architecture-hexagonal/SKILL.md`. The test in `scripts/check-architecture.test.mjs` parses the SKILL.md block, dynamically imports the vocab module, and asserts array-equality. Drift fails CI.

This pattern mirrors the commitlint-vocab approach (D2): single source-of-truth module + parsed marker block + test asserting array-equality. The same drift-detection technique is applied wherever a doc enumerates a vocabulary that must match a script's allowlist.

**Why not extract analytics:** the active `analytics-port` spec **already mandates** `@kaiord/core/adapters/analytics`. Moving it would require a `analytics-port` spec delta and a new `@kaiord/analytics` package — a larger change with no tangible win, since the noop analytics adapter is dependency-free and tiny.

### D5b. Permanent allowlist invariant

**Choice:** `scripts/check-allowlists-empty.mjs` (`R-AllowlistsEmpty`) is added in PR1 in `--mode=warn` (because seed allowlists are deliberately non-empty during the cleanup PRs) and flipped to `--mode=error` (default) during the final-validation block (task 5.5). After archive, no future PR may re-seed any drained allowlist without an explicit OpenSpec amendment to this change.

**Why this matters:** without the invariant, a future force-push or accidental rebase could silently re-introduce allowlist entries that have already been drained. The `check-no-pii-leakage.mjs` precedent locks its allowlist via review-gating only; this change adds mechanical-gating on top. Once any of the six guards drains during this change, its `ALLOWLIST` is permanently `new Set()`. Adversarial re-seeding fails CI immediately.

**Why two modes (warn vs error):** if PR1 shipped `--mode=error`, PR1 itself would fail (seed allowlists for audit-snapshot violations are intentionally non-empty during PR2/PR3/PR4 cleanups). Two modes lets the script ship in PR1 (where it's informational) and become enforcing in the final validation block, matching the natural lifecycle of the cleanup.

### D6. Husky hook hygiene (framing-aware, not substring-blind)

**Choice:** Remove imperative-voice `--no-verify` instructions from `.husky/pre-commit`. The hook still fails the same way; it just no longer documents how to bypass itself. Backstop the change with `scripts/check-husky-no-bypass-hint.mjs` (+ test) that distinguishes ENDORSEMENT from PROHIBITION line-by-line:

- REJECT lines like `echo "To skip: git commit --no-verify"`, `printf "use --no-verify"`, `: HUSKY=0 ...` — imperative-voice framing endorses the bypass.
- ALLOW lines like `# NEVER use --no-verify; CI re-runs all checks`, `# do not use HUSKY=0`, `# --no-verify is forbidden` — defensive comments reinforce the policy.

The script's regex matches `--no-verify` or `HUSKY=0` only when preceded by an imperative-voice keyword (`use`, `try`, `run`, `execute`, `:`, `echo`, `printf`) AND not preceded by a negation token (`NEVER`, `do not`, `don't`, `forbidden`, `must not`).

`--no-gpg-sign` is OUT OF SCOPE for this rule. It is a signing-policy override, semantically distinct from a hook-bypass. If the team adopts mandatory GPG signing, a separate `R-NoGpgBypass` rule lives in a future `repo-quality-gates` change.

**Why this is robust:** The `git-strategy` guideline says "NEVER use `--no-verify`". A hook that prints instructions for using `--no-verify` is normalizing the bypass. Removing the hint is one of the rare doc-only fixes that actually changes behavior — contributors who don't know about `--no-verify` won't learn it from our hook. The `check-husky-no-bypass-hint.mjs` ensures the hint cannot creep back in via a future "helpful" cleanup.

**CI backstop for actual bypasses:** even if a contributor uses `git commit --no-verify` locally, the GitHub Actions PR workflow re-runs `pnpm test:scripts` AND `pnpm exec commitlint --from <merge-base> --to HEAD`. This catches every rule we enforce locally, again at merge time. The combination of (local hook + CI re-run) makes `--no-verify` unable to land a violation on `main`.

### D7. PR chunking strategy (for `/opsx-ship` later)

This change is one OpenSpec proposal but four sequential PRs. Every PR title is a single-scope conventional-commit subject (validated against the new commitlint config the proposal introduces).

```
P1: Scripts & guards (no behavior change to source)
   Title: chore(scripts): mechanical guards for guideline rules
   - scripts/check-architecture.mjs + .test.mjs
   - scripts/check-package-deps.mjs + .test.mjs
   - scripts/check-mapper-no-tests.mjs + .test.mjs
   - scripts/check-converter-has-tests.mjs + .test.mjs
   - scripts/check-no-unconditional-skip.mjs + .test.mjs
   - scripts/check-husky-no-bypass-hint.mjs + .test.mjs
   - scripts/check-commitlint-config.test.mjs (paired with config)
   - commitlint.config.mjs + commitlint.vocab.mjs + .husky/commit-msg
   - .husky/pre-commit reordered (test:scripts BEFORE test) and stripped of --no-verify hint
   - All scripts wired into pnpm test:scripts and pnpm lint
   - Each script's ALLOWLIST is seeded by a PRE-FLIGHT dry-run (task 1.1.0)
     against current main, capturing the exact set of pre-existing violations
     so CI is green when PR1 lands
   - No changeset (root tooling only; no published-package change)

P2: Architecture compliance cleanup (drains R-ArchCoreAmbientTypes allowlist)
   Title: refactor(core): relocate FIT SDK ambient types to @kaiord/fit
   - git mv packages/core/src/types/garmin-fitsdk.d.ts -> packages/fit/src/types/
   - Update tsconfig typeRoots / include in core and fit
   - Remove packages/core/src/types/ entirely
   - Drain ALLOWLIST in scripts/check-architecture.mjs for that one entry
   - No changeset (internal-only; types are ambient declarations)

P3: Mapper -> converter renames + missing converter tests (drains two allowlists)
   Title: refactor(spa-editor): mapper-to-converter normalization
     (the source-touching scope is split internally per package; the PR
      keeps a single canonical scope so the title passes commitlint;
      affected packages enumerated in the body)
   - Rename 7 .mapper.ts files (+ .mapper.test.ts) to .converter.ts
   - Update imports + barrel index.ts re-exports across packages
   - Add characterization tests for 3 untested .converter.ts files
     (production code unchanged; these are NOT TDD red-greens)
   - Drain mapper-no-tests and converter-has-tests allowlists to empty Set
   - No changeset (file rename, exported symbol names unchanged)

P4: Test hygiene + doc alignment
   Title: test(spa-editor): un-skip masked tests and align guideline docs
   - Un-skip the 5 unconditional skips (per D4 table)
   - Drain no-unconditional-skip allowlist
   - Translate packages/core/src/tests/fixtures/README.md to English
   - Update 4 SKILL.md files (architecture-hexagonal, design-principles,
     testing-standards, git-strategy) to reference the new scripts and
     embed the commitlint source-of-truth block in git-strategy
   - During archive (task 5.7): rewrite every check-architecture.js
     reference in openspec/specs/hexagonal-arch/spec.md to the .mjs path,
     and bump the > Synced: marker on both modified canonical specs
   - No changeset (test/docs only)
```

The empty-allowlist requirement at the end of each PR is mandatory: the change is not archived until every script's `ALLOWLIST` is the empty Set, matching the `spa-quality-gates` precedent.

**Pre-flight ALLOWLIST seeding (task 1.1.0):** Before P1 lands, the implementer runs each new script in dry-run mode against `main`, captures the exact set of pre-existing violations (file paths, line numbers, rule IDs), and seeds each script's `ALLOWLIST` with one inline-commented entry per violation. The comment block on each entry MUST name the rule ID, the violation, and the planned drain PR (P2/P3/P4). This guarantees PR1 is green on first push and that no additional drift slips in unnoticed.

## Risks / Trade-offs

| Risk                                                                                              | Mitigation                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| New commit-msg hook breaks in-flight branches whose commits use `openspec:` as a TYPE             | P1 ships the hook; contributors with non-conformant in-flight branches rebase and reword. The rule was always documented as MUST.                                                                                                                                                                                                          |
| Architecture script over-flags a legitimate import (e.g., a planned `node:` import in a use case) | The script's allowlist for `application/` is "only relative `../domain` + `../ports`". `node:` modules in application code are already a guideline violation. If a real use-case-level `node:` import emerges later, the rule (and this script) is amended together — robust by design.                                                    |
| Mapper→converter renames break consumer import paths                                              | Consumers (CLI, MCP, SPA, tests) import from each adapter's barrel `index.ts`. Renaming the source file but keeping the exported symbol name preserves all consumer call sites. We MUST verify by running `pnpm -r build && pnpm -r test` after each rename batch.                                                                         |
| Coverage thresholds fail after the renames or after un-skipping tests                             | The renames preserve tests one-for-one (no coverage loss). Un-skipping the 3 CalendarPage tests increases coverage. The json-parser perf test rewrite is deterministic and runs every time. The xsd-validator `skipIf` only skips in browser-mode runs (Node CI is unaffected). All four sub-PRs run `pnpm -r test:coverage` before merge. |
| commitlint config drifts from the guideline doc                                                   | A fixture test in `commitlint.config.test.mjs` (P1) imports the config and asserts that `type-enum` and `scope-enum` literals match a hard-coded string array; the same array is referenced in a comment inside `git-strategy/SKILL.md`. Drift fails CI.                                                                                   |
| Removing `--no-verify` hint surprises contributors                                                | The husky hook still works exactly as before; only the printed message changes. Contributors who actually need `--no-verify` for legitimate reasons (none documented today) can still type it manually — the rule against `--no-verify` lives in the guideline, not the hook.                                                              |

## Migration Plan

This change has no migration in the public-API sense (no consumer of `@kaiord/*` packages is affected). The repo-internal migration is the four-PR sequence in §D7. After P1 lands on `main`:

1. Existing branches with `openspec:` TYPE commits MUST be rebased with reworded commit messages (e.g., `chore(openspec): ...`).
2. Existing branches with new `.mapper.ts` + `.mapper.test.ts` pairs MUST be rebased over P3, or rebased over P1 with a temporary allowlist entry that clears in P3.
3. Branches that add `.converter.ts` files MUST add a sibling test before the converter-has-tests guard runs (P1+ on `main`).

After P4 lands and all four allowlists are empty, the change is archived (`openspec/changes/archive/YYYY-MM-DD-guidelines-compliance-harden/`) and the `> Completed:` marker in `proposal.md` is set to the archive date. CI's `pnpm lint:archive` enforces the date invariant.

## Open Questions

1. ~~**Should the architecture script also enforce `@kaiord/core` as the only allowed `@kaiord/*` import in adapter packages?**~~ **Resolved YES.** A separate `scripts/check-package-deps.mjs` (rule `R-ArchPackageDeps`) reads every `packages/*/package.json` `dependencies` block against the documented `Package Dependencies` table. Lifting this from "open question" to a P1 deliverable closes the largest documented-but-unenforced rule in `hexagonal-arch`.
2. **Should `it.todo` be allowed (with a deadline comment) or always rejected?** The proposal rejects all `*.todo`. The `R-NoUnconditionalSkip` requirement body in `spa-quality-gates/spec.md` documents this trade-off explicitly: rejection conflicts with Vitest's planned-test workflow, and contributors blocked by the rule SHOULD open an issue rather than work around it with an empty `it("planned", () => {})`. A follow-up `repo-quality-gates` change MAY introduce a deadline-gated `it.todo` allowance — out of scope here.
3. ~~**Should `commitlint` also lint commit subjects on push (server-side)?**~~ **Resolved YES.** The CI workflow gains `pnpm exec commitlint --from <merge-base> --to HEAD` as a merge-time backstop against `--no-verify` bypasses. Verified by task 4.6.4.
