<!-- opsx-ship: chunking
PR 0 (openspec-proposal): the proposal artifacts themselves (proposal.md, design.md, tasks.md, specs/**); merged before any task in §1-§4 starts
PR 1 (guards-and-husky): §1 (1.0 audit + 1.1-1.7 guards + 1.8 husky reorder + 1.9 CI backstop + 1.10 close-out)
PR 2 (arch-cleanup): §2 (relocate FIT SDK ambient types, drain R-ArchCoreAmbientTypes allowlist)
PR 3 (mapper-converter-rename): §3 (rename 7 mappers to converters, add tests for 3 untested converters, drain two allowlists)
PR 4 (test-hygiene-and-docs): §4 (un-skip 5 tests, translate fixtures README, update 5 SKILL.md files, sweep stale check-architecture.js refs)
Then §5 final-validation block runs and the change is archived.
-->

## 1. PR1 — Mechanical guards & husky hooks (no source-code behavior change)

### 1.0 Pre-flight audit (seed every ALLOWLIST exactly)

- [ ] 1.0.0 author `scripts/audit-snapshot.mjs` (NOT wired into `pnpm test:scripts` or any hook — invoked manually exactly once at the start of P1). The script SHALL run each of the 6 new checks in dry-run mode (no allowlist applied) and write a JSON file at `scripts/.audit-snapshot.json` with shape `{ <ruleId>: [{ file, line?, detail }] }`. Each new check MUST expose a `--dry-run` flag that emits its violations as JSON on stdout (no allowlist filtering); the snapshot script aggregates them
- [ ] 1.0.1 run `node scripts/audit-snapshot.mjs > scripts/.audit-snapshot.json` against current `main`. Coverage of the snapshot: every external-library import under `domain/`/`application/`/`ports/`; every cross-format-adapter import under `packages/{fit,tcx,zwo,garmin}/`; every `@kaiord/*` workspace dep not on the documented allowlist; every `*.skip|*.only|*.todo` site (member, computed, destructured, re-bound) under `*.test.{ts,tsx}` / `*.spec.{ts,tsx}`; every ambient `declare module` declaration under `packages/core/src/types/`. Commit `scripts/.audit-snapshot.json`
- [ ] 1.0.2 confirm exact counts vs. the audit narrative: 1 `garmin-fitsdk.d.ts` ambient, 7 `*.mapper.test.{ts,tsx}` files, 3 `*.converter.{ts,tsx}` without sibling test, 5 unconditional `it.skip` sites, 0 cross-adapter imports, 0 disallowed `@kaiord/*` workspace deps. Discrepancies between the snapshot and the proposal MUST be reconciled (proposal updated, or implementer aborts and reports) before continuing
- [ ] 1.0.3 confirm no domain-layer external library imports beyond `zod` exist, no application-layer external imports exist, no ports-layer runtime code exists. If any do, treat them as new in-scope cleanup or seed with a labeled allowlist entry

### 1.1 Architecture guard script (+ shared architecture vocab module)

- [x] 1.1.0 create `scripts/architecture.vocab.mjs` exporting `CORE_ADAPTER_ALLOWLIST = ["analytics", "logger"]` (alphabetical, single source of truth for the `R-ArchCoreAdapterAllowlist` rule). Update `.claude/skills/guidelines/architecture-hexagonal/SKILL.md` to insert markers `<!-- arch-vocab:start -->` and `<!-- arch-vocab:end -->` around a fenced block reproducing the array verbatim and order-preserved (the test in 1.1.1 enforces array-equality between the two)
- [x] 1.1.1 write failing test `scripts/check-architecture.test.mjs` covering every rule ID (`R-ArchLeftward`, `R-ArchPortPure`, `R-ArchAppPure`, `R-ArchDomainExt`, `R-ArchAdapterCross`, `R-ArchCoreAdapterAllowlist`, `R-ArchCoreAmbientTypes`) with positive and negative fixtures (RED). Negative fixtures MUST include: `application/X.test.ts` importing `vitest`; `application/X.test.ts` importing `@kaiord/core/test-utils`; `domain/X.test.ts` importing `vitest`; `garmin-connect/X.ts` importing `@kaiord/garmin`; a JSDoc `/** @see @kaiord/fit */` block in a non-test file under `tcx/` (must NOT trigger). The test SHALL also parse the `<!-- arch-vocab -->` block from `architecture-hexagonal/SKILL.md`, dynamically import `architecture.vocab.mjs`, and assert array-equality (order-sensitive) on `CORE_ADAPTER_ALLOWLIST`
- [x] 1.1.2 implement `scripts/check-architecture.mjs` parsing TS/TSX with `@typescript-eslint/typescript-estree`, walking `ImportDeclaration` + `ExportNamedDeclaration` nodes, classifying by package + folder; importing `CORE_ADAPTER_ALLOWLIST` from `scripts/architecture.vocab.mjs`; explicitly excluding `*.test.{ts,tsx}`, `*.spec.{ts,tsx}`, `*.stories.{ts,tsx}`, `dist/`, `node_modules/` from layer evaluation; recognizing the `garmin-connect → garmin` exception; supporting a `--dry-run` flag that emits violations as JSON on stdout without allowlist filtering (used by `audit-snapshot.mjs`) (GREEN)
- [x] 1.1.3 refactor `scripts/check-architecture.mjs` for clarity: extract per-rule predicates, share fixture loader with siblings (REFACTOR)
- [x] 1.1.4 seed `ALLOWLIST` exactly from `scripts/.audit-snapshot.json` rule-by-rule; each entry MUST carry a comment block: rule ID, file path, planned drain PR (per `check-no-pii-leakage.mjs` precedent). Failure messages MUST include rule ID, file path, import specifier, and (for `R-ArchCoreAdapterAllowlist`) a "create packages/<name>/ instead" hint
- [x] 1.1.5 wire `scripts/check-architecture.mjs` into the repo-root `package.json` `test:scripts` script
- [x] 1.1.6 wire `scripts/check-architecture.mjs` into the repo-root `package.json` `lint` script alongside `lint:specs`, `lint:archive`, `lint:archive-index`
- [x] 1.1.7 husky `pre-commit` already runs `pnpm test:scripts`; verify the new check executes there with no extra wiring (`git commit --allow-empty -m "chore(scripts): smoke" 2>&1 | tee /tmp/hook.txt` and grep for `R-Arch`)

### 1.2 Package-deps guard

- [x] 1.2.1 write failing test `scripts/check-package-deps.test.mjs` (RED): positive fixture is a `package.json` adding `@kaiord/tcx` to `@kaiord/fit`'s deps; negative is the canonical allowed set per the spec table
- [x] 1.2.2 implement `scripts/check-package-deps.mjs` (GREEN): hard-code the allowlist as `PACKAGE_DEPS` constant mirroring the `Package Dependencies` table in `hexagonal-arch/spec.md`; iterate every `packages/*/package.json`, flag any `@kaiord/*` entry not on its allowlist; rule ID `R-ArchPackageDeps`. Support a `--dry-run` flag emitting violations as JSON on stdout (used by `audit-snapshot.mjs`)
- [x] 1.2.3 refactor: extract the `package.json` reader to a small helper (REFACTOR)
- [x] 1.2.4 seed `ALLOWLIST` from the audit snapshot (expected: empty)
- [x] 1.2.5 wire into `pnpm test:scripts` and `pnpm lint`

### 1.3 Mapper-no-tests guard

- [x] 1.3.1 write failing test `scripts/check-mapper-no-tests.test.mjs` (RED): positive fixture is a tree with one `*.mapper.test.ts`; negative is a tree with only `*.mapper.ts`
- [x] 1.3.2 implement `scripts/check-mapper-no-tests.mjs` (GREEN): glob `packages/**/*.mapper.test.{ts,tsx}` excluding `node_modules/`, `dist/`; rule ID `R-MapperNoTests`. Support a `--dry-run` flag emitting violations as JSON on stdout
- [x] 1.3.3 refactor: share the path-glob helper with `check-converter-has-tests` (REFACTOR)
- [x] 1.3.4 seed `ALLOWLIST` from the audit snapshot (the 7 known mapper test files; drained in PR3)
- [x] 1.3.5 wire into `pnpm test:scripts` and `pnpm lint`

### 1.4 Converter-has-tests guard

- [x] 1.4.1 write failing test `scripts/check-converter-has-tests.test.mjs` (RED): positive is a converter without sibling test; negative is a paired set
- [x] 1.4.2 implement `scripts/check-converter-has-tests.mjs` (GREEN): glob `packages/**/*.converter.{ts,tsx}` and assert co-located `*.converter.test.{ts,tsx}` exists; rule ID `R-ConverterHasTests`. Support a `--dry-run` flag emitting violations as JSON on stdout
- [x] 1.4.3 refactor: use the shared path-glob helper from 1.3.3 (REFACTOR)
- [x] 1.4.4 seed `ALLOWLIST` from the audit snapshot (the 3 known untested converters; drained in PR3)
- [x] 1.4.5 wire into `pnpm test:scripts` and `pnpm lint`

### 1.5 No-unconditional-skip guard

- [x] 1.5.1 write failing test `scripts/check-no-unconditional-skip.test.mjs` (RED): positive fixtures cover all four dispatch shapes for each forbidden form: member (`it.skip`, `test.only`, `describe.todo`); computed-member (`it["skip"]`, `test["only"]`, `describe["todo"]`); destructured (`const { skip } = it; skip(...)`); re-bound (`const my = it; my.skip(...)`). Adversarial literal-only `skipIf` fixtures: `it.skipIf(true)`, `it.skipIf(1)`, `it.skipIf("x")`, `it.skipIf(null)`, `it.skipIf(!!1)`, `it.skipIf(1+1)`, `it.skipIf(true && true)`, ``it.skipIf(`true`)`` (TemplateLiteral without `${...}`). Negative fixtures (must PASS): `it.skipIf(process.env.X)`, `it.skipIf(typeof window !== 'undefined')`, `it.skipIf(someFn())`, `it.skipIf(!hasFlag())`, `it.skipIf(new URL(import.meta.url).hostname === "ci")` (NewExpression contributes runtime evaluation)
- [x] 1.5.2 implement `scripts/check-no-unconditional-skip.mjs` (GREEN): AST-walk `*.test.{ts,tsx}` and `*.spec.{ts,tsx}` files for all four dispatch shapes (member, computed, destructured, re-bound). For `skipIf`, traverse the argument AST and ACCEPT only when at least one reachable node is of kind `Identifier`, `MemberExpression`, `CallExpression`, or `NewExpression`. All other constructs (`Literal`, `TemplateLiteral` without `${...}` substitutions, and `UnaryExpression` / `BinaryExpression` / `LogicalExpression` whose every reachable leaf is one of those) are REJECTED as literal-only. Rule ID `R-NoUnconditionalSkip`. Support a `--dry-run` flag emitting violations as JSON on stdout
- [x] 1.5.3 refactor: extract the dispatch-shape detector into a reusable helper (REFACTOR)
- [x] 1.5.4 seed `ALLOWLIST` from the audit snapshot (the 5 known unconditional skips; drained in PR4)
- [x] 1.5.5 wire into `pnpm test:scripts` and `pnpm lint`

### 1.6 Husky no-bypass-hint guard

- [x] 1.6.1 write failing test `scripts/check-husky-no-bypass-hint.test.mjs` (RED): positive (REJECT) fixtures: lines with imperative-voice bypass, e.g., `echo "To skip: git commit --no-verify"`, `printf "use --no-verify"`, `: HUSKY=0 git commit ...`, `eval "HUSKY=0 git commit"`, `env HUSKY=0 git commit`, `something && HUSKY=0 git commit`, `$(HUSKY=0 git commit)`. Negative (ALLOW) fixtures: defensive comments, e.g., `# NEVER use --no-verify; CI re-runs all checks anyway`, `# do not use HUSKY=0`, `# --no-verify is forbidden`. Bare-`#`-comment-without-negation case `# use --no-verify`: REJECT (the rule requires explicit negation; the bare `#` is not enough). Cover this case explicitly in fixtures. The script MUST distinguish framing — endorsement is REJECTED, prohibition is ALLOWED
- [x] 1.6.2 implement `scripts/check-husky-no-bypass-hint.mjs` (GREEN): read every file under `.husky/` line-by-line. For each line containing `--no-verify` or `HUSKY=0`, REJECT only if the line matches the imperative-voice pattern (regex `/(use|try|run|execute|exec|eval|env|export|:\s|&&|\|\||\$\(|echo|printf|bash\s+-c|sh\s+-c)\s.*(--no-verify|HUSKY=0)/i`) AND does NOT contain any of the negation tokens `NEVER`, `do not`, `don't`, `forbidden`, `never use`, `must not`. Rule ID `R-NoBypassHint`. Document at the script header: (a) `--no-gpg-sign` is OUT OF SCOPE for this rule (separate signing concern; deferred to a future `R-NoGpgBypass` rule); (b) bare-`#`-comment-without-negation is REJECTED — contributors MUST include an explicit negation token; (c) known evasions accepted as residual risk: `bash <<<` here-strings with internal vars (rare in husky hooks)
- [x] 1.6.3 refactor (REFACTOR): extract the imperative-voice and negation-token sets to top-level consts; document them in a header block
- [x] 1.6.4 wire into `pnpm test:scripts` and `pnpm lint`

### 1.7 Commit-format gate

- [x] 1.7.1 add devDeps `@commitlint/cli` and `@commitlint/config-conventional` at the repo root (`pnpm add -Dw @commitlint/cli @commitlint/config-conventional`)
- [x] 1.7.2 create `commitlint.vocab.mjs` exporting:
      `js
    export const TYPE_ENUM = ["feat","fix","chore","test","docs","refactor","perf"];
    export const SCOPE_ENUM = [
      "core","fit","tcx","zwo","garmin","garmin-connect","ai","cli","mcp",
      "spa-editor","garmin-bridge","train2go-bridge",
      "analytics","landing","docs-site",
      "openspec","ci","docs","scripts",
      "deploy","release","deps","deps-dev","e2e",
    ];
    `
      Order is normative (alphabetical-by-tier; the test asserts array-equality, not Set-equality)
- [x] 1.7.3 create `commitlint.config.mjs` importing `TYPE_ENUM` and `SCOPE_ENUM` from `commitlint.vocab.mjs`. The config explicitly preserves `@commitlint/config-conventional` default single-scope behavior (no multi-scope opt-in). Per design D2, multi-scope subjects MUST be rejected
- [x] 1.7.4 update `.claude/skills/guidelines/git-strategy/SKILL.md`: REPLACE the existing scope list at lines 24-28 with a fenced markdown block bracketed by `<!-- commitlint-source-of-truth:start -->` and `<!-- commitlint-source-of-truth:end -->`. The block uses a STRICTLY MACHINE-READABLE shape: one entry per line, no prefixes, no indentation, blank lines and lines starting with `#` are comments and ignored by the parser. Section headers `# types` and `# scopes` separate the two arrays. The block contents MUST be EXACTLY (line-for-line, order-preserved):

      ```
      # types
      feat
      fix
      chore
      test
      docs
      refactor
      perf

      # scopes
      core
      fit
      tcx
      zwo
      garmin
      garmin-connect
      ai
      cli
      mcp
      spa-editor
      garmin-bridge
      train2go-bridge
      analytics
      landing
      docs-site
      openspec
      ci
      docs
      scripts
      deploy
      release
      deps
      deps-dev
      e2e
      ```

      Add an explicit note above the block: "Source of truth: `commitlint.vocab.mjs` + this block. Drift between the two (insertion, deletion, or reorder) fails CI via `scripts/check-commitlint-config.test.mjs`."

- [x] 1.7.5 write `scripts/check-commitlint-config.test.mjs` (`node:test`): (a) parse the `<!-- commitlint-source-of-truth -->` block from `git-strategy/SKILL.md` with a trivial line-by-line parser — strip blank lines, strip lines starting with `#` BUT use the `# types`/`# scopes` markers as section separators; emit two arrays in document order; (b) dynamically import `commitlint.vocab.mjs`; (c) `assert.deepStrictEqual(parsedTypes, TYPE_ENUM)` and `assert.deepStrictEqual(parsedScopes, SCOPE_ENUM)` (array-equality, order-sensitive); (d) pipe four subjects through `pnpm exec commitlint` and assert exit codes: - `chore(openspec): archive cleanup-may-2026` → exit 0 - `feat(banana): add new flow` → non-zero (unknown scope) - `openspec: archive cleanup-may-2026` → non-zero (TYPE not allowed) - `refactor(core,fit,tcx): unify foo` → non-zero (multi-scope rejected)
      Parser tests: include a positive fixture (the canonical block) and three negative fixtures stressing parser correctness — block with extra blank lines (still parses correctly), block with extra non-`#` comment line (parser treats it as a list item, test FAILS — this is the desired strict behavior), block with reordered entries (test FAILS via `deepStrictEqual`). The parser MUST be ≤ 30 lines and unit-tested in isolation.

      Subprocess strategy for the four commit-subject pipes: invoke `node_modules/.bin/commitlint` directly (NOT `pnpm exec commitlint`) to avoid the 200-500ms `pnpm`-wrapper overhead per call. Total target latency for the four pipes: ≤ 1 second. Use `node:child_process.spawnSync` with `{ input: subject, encoding: 'utf8' }` — synchronous (the test is short and sequential ordering is fine). Document this choice at the top of the test file
- [x] 1.7.6 add `.husky/commit-msg` running `pnpm exec commitlint --edit "$1"`; mark executable; verify the file contains no imperative-voice bypass instruction (the `R-NoBypassHint` rule applies to ALL `.husky/*` files including this new one — defensive comments are still allowed)
- [x] 1.7.7 wire `scripts/check-commitlint-config.test.mjs` into `pnpm test:scripts`

### 1.8 Husky pre-commit hygiene & ordering

- [x] 1.8.1 reorder `.husky/pre-commit` so `pnpm test:scripts` runs BEFORE `pnpm test`. The new order is: build → tsc --noEmit → test:scripts → test → (no further scripts:tests step). This guarantees `it.only` is rejected before the test runner can mask the suite
- [x] 1.8.2 remove from `.husky/pre-commit` every imperative-voice instruction line containing `--no-verify` or `HUSKY=0` (e.g., `echo "To skip: git commit --no-verify"`). The hook still fails the same way; only the bypass hint is gone. The `R-NoBypassHint` script in 1.6 enforces this invariant going forward (defensive comments such as `# NEVER use --no-verify; CI re-runs all checks` are kept and explicitly allowed by the rule)
- [ ] 1.8.3 manual smoke: `git commit --allow-empty -m "chore(scripts): hook hygiene smoke" 2>&1 | tee /tmp/hook-out.txt`; assert NO imperative-voice bypass instruction appears in the output (run `scripts/check-husky-no-bypass-hint.mjs --dry-run` for a JSON enumeration as a cross-check)
- [x] 1.8.4 add `scripts/check-allowlists-empty.mjs` + `scripts/check-allowlists-empty.test.mjs` (RED → GREEN → wire-in subsequence below):
  - [x] 1.8.4a write failing test `scripts/check-allowlists-empty.test.mjs` (RED): positive (REJECT in `--mode=error`) fixtures: `export const ALLOWLIST = new Set(["packages/X/Y.ts"])`, plus a stress fixture with a path containing brackets `export const ALLOWLIST = new Set(["packages/landing/src/pages/[slug].ts"])` (must still be flagged). Negative (ALLOW) fixtures: `export const ALLOWLIST = new Set()`, `export const ALLOWLIST = new Set([])` (both empty forms), AND a comment fixture: `// historical: ALLOWLIST = new Set(["X"]) was the old form` (must NOT be flagged — comments mentioning the rule are not violations)
  - [x] 1.8.4b implement `scripts/check-allowlists-empty.mjs` (GREEN): glob `scripts/check-*.mjs` (excluding the script itself and any `*.test.mjs`); strip line comments (`//.*$`) and block comments (`/\*[\s\S]*?\*/`) from the file source before regex matching, so commentary about the rule is not flagged as a violation. Match `^(?:\s*export\s+)?const\s+ALLOWLIST\s*=\s*new\s+Set\(\s*\[\s*['"]/m` — anchored on a real `const` declaration, requires the opening quote of a string entry after `[`, so `new Set([])` (empty array) does NOT match while `new Set(["X"])` DOES, regardless of whether `"X"` itself contains `]`. Rule ID `R-AllowlistsEmpty`. Support `--mode=warn` (exit 0, prints warnings) and `--mode=error` (default; exit non-zero on any match)
  - [x] 1.8.4c wire into `pnpm test:scripts` (default `--mode=error`) and `pnpm lint`. The script is wired into PR1 but its first run will FAIL because PR1 seeds non-empty allowlists for the audit-snapshot violations — therefore the script SHALL be invoked with `--mode=warn` during PR1, PR2, PR3 (override at the call site), then flipped to default `--mode=error` at the start of task 5.5 in the final validation block. Document this two-mode lifecycle in the script header. Once flipped at archive time, the script enforces the permanent invariant: no future PR may re-seed any drained allowlist without an OpenSpec amendment to this change

### 1.9 CI backstop

- [x] 1.9.1 inspect `.github/workflows/ci.yml`; if `pnpm test:scripts` is already a step (it is — confirmed at audit time), no change needed for that gate
- [x] 1.9.2 add a `commitlint` step to `.github/workflows/ci.yml` running `pnpm exec commitlint --from "${{ github.event.pull_request.base.sha }}" --to "${{ github.event.pull_request.head.sha }}"` on every pull_request event so `--no-verify`-bypassed commits are caught at merge time
- [x] 1.9.3 verify on a draft PR by deliberately committing a `feat(banana): x` with `--no-verify` and confirming the CI commitlint step fails

### 1.10 PR1 close-out

- [ ] 1.10.1 `pnpm test:scripts` (zero failures)
- [ ] 1.10.2 `pnpm -r test` (zero failures)
- [ ] 1.10.3 `pnpm -r build` (zero warnings)
- [ ] 1.10.4 `pnpm lint` (zero errors/warnings; includes the 8 new checks: `check-architecture`, `check-package-deps`, `check-mapper-no-tests`, `check-converter-has-tests`, `check-no-unconditional-skip`, `check-husky-no-bypass-hint`, `check-commitlint-config`, `check-allowlists-empty` (warn-mode in PR1))
- [ ] 1.10.5 NO changeset for this PR (root-tooling-only change, no published-package version change — per `git-strategy/SKILL.md`'s "changeset only when a published package's behavior changes")
- [ ] 1.10.6 open PR titled `chore(scripts): mechanical guards for guideline rules` (single-scope, validates against the new commitlint config)

## 2. PR2 — Architecture cleanup (drain `R-ArchCoreAmbientTypes` allowlist)

- [ ] 2.1 create `packages/fit/src/types/` directory
- [ ] 2.2 `git mv packages/core/src/types/garmin-fitsdk.d.ts packages/fit/src/types/garmin-fitsdk.d.ts` (preserve history)
- [ ] 2.3 update `packages/fit/tsconfig.json` `typeRoots` (or `include`) so the moved `*.d.ts` is picked up
- [ ] 2.4 remove `packages/core/src/types/` folder entirely
- [ ] 2.5 update `packages/core/tsconfig.json` if it referenced `src/types/`
- [ ] 2.6 verify with `pnpm -r build`: `@kaiord/fit` still type-checks against `@garmin/fitsdk`; `@kaiord/core` no longer references it
- [ ] 2.7 drain `scripts/check-architecture.mjs` `ALLOWLIST` for the `R-ArchCoreAmbientTypes` entry
- [ ] 2.8 PR2 close-out: `pnpm -r test:coverage` (thresholds hold) → `pnpm -r build` → `pnpm lint` → NO changeset (internal-only ambient-type relocation) → open PR titled `refactor(core): relocate FIT SDK ambient types to fit package`

## 3. PR3 — Mapper→converter renames + missing converter tests (drain two allowlists)

For each rename (3.1–3.7), the cycle is: rename source + rename test + update imports + update barrel `index.ts` re-exports + verify per-package test pass. These are non-behavioral wiring tasks (the production logic is unchanged), so no RED/GREEN/REFACTOR labels apply.

### 3.1 Garmin target mapper → converter

- [ ] 3.1.1 `git mv packages/garmin/src/adapters/mappers/target.mapper.ts → target.converter.ts`
- [ ] 3.1.2 `git mv packages/garmin/src/adapters/mappers/target.mapper.test.ts → target.converter.test.ts`
- [ ] 3.1.3 update imports across `packages/garmin/src/**/*.ts` and any consumer that referenced the old path; update the package barrel `packages/garmin/src/index.ts` (or sub-barrel) so the exported symbol name is unchanged
- [ ] 3.1.4 `pnpm --filter @kaiord/garmin test` passes; `pnpm --filter @kaiord/garmin build` passes (consumers' imports resolve via unchanged exported symbols)

### 3.2 FIT krd-to-fit-target-power mapper → converter

- [ ] 3.2.1 rename source + test (`git mv` ×2)
- [ ] 3.2.2 update imports + `packages/fit/src/index.ts` barrel
- [ ] 3.2.3 `pnpm --filter @kaiord/fit test` and `build` pass

### 3.3 FIT krd-to-fit-target-heart-rate mapper → converter

- [ ] 3.3.1 rename source + test (`git mv` ×2)
- [ ] 3.3.2 update imports + barrel
- [ ] 3.3.3 `pnpm --filter @kaiord/fit test` and `build` pass

### 3.4 FIT krd-to-fit-metadata mapper → converter

- [ ] 3.4.1 rename source + test (`git mv` ×2)
- [ ] 3.4.2 update imports + barrel
- [ ] 3.4.3 `pnpm --filter @kaiord/fit test` and `build` pass

### 3.5 TCX tcx-to-krd target mapper → converter

- [ ] 3.5.1 rename source + test under `packages/tcx/src/adapters/target/`
- [ ] 3.5.2 update imports + `packages/tcx/src/index.ts` barrel
- [ ] 3.5.3 `pnpm --filter @kaiord/tcx test` and `build` pass

### 3.6 TCX duration mapper → converter

- [ ] 3.6.1 rename source + test under `packages/tcx/src/adapters/duration/`
- [ ] 3.6.2 update imports + barrel
- [ ] 3.6.3 `pnpm --filter @kaiord/tcx test` and `build` pass

### 3.7 SPA train2go coaching-record mapper → converter

- [ ] 3.7.1 rename source + test under `packages/workout-spa-editor/src/adapters/train2go/`
- [ ] 3.7.2 update imports + barrel (if any)
- [ ] 3.7.3 `pnpm --filter @kaiord/workout-spa-editor test` and `build` pass

### 3.8 Drain mapper-no-tests allowlist

- [ ] 3.8.1 set `ALLOWLIST` in `scripts/check-mapper-no-tests.mjs` to `new Set()` (empty)
- [ ] 3.8.2 `pnpm test:scripts` passes (no remaining `*.mapper.test.{ts,tsx}` exist)

### 3.9 Add characterization tests for ZWO krd-to-zwift converter (production code unchanged)

- [ ] 3.9.1 write characterization tests at `packages/zwo/src/adapters/krd-to-zwift.converter.test.ts` covering current behavior on canonical KRD fixtures (loaded via `@kaiord/core/test-utils`); each test asserts the converter's CURRENT output, not a desired output
- [ ] 3.9.2 verify `pnpm --filter @kaiord/zwo test` passes (production code is unchanged; tests should be green on first run)

### 3.10 Add characterization tests for ZWO zwift-to-krd converter

- [ ] 3.10.1 write characterization tests at `packages/zwo/src/adapters/zwift-to-krd.converter.test.ts` for current behavior
- [ ] 3.10.2 verify `pnpm --filter @kaiord/zwo test` passes

### 3.11 Add characterization tests for Garmin garmin-repetition converter

- [ ] 3.11.1 write characterization tests at `packages/garmin/src/adapters/converters/garmin-repetition.converter.test.ts` for current behavior
- [ ] 3.11.2 verify `pnpm --filter @kaiord/garmin test` passes

### 3.12 Drain converter-has-tests allowlist

- [ ] 3.12.1 set `ALLOWLIST` in `scripts/check-converter-has-tests.mjs` to `new Set()` (empty)
- [ ] 3.12.2 `pnpm test:scripts` passes

### 3.13 PR3 close-out

- [ ] 3.13.1 `pnpm -r test:coverage` (thresholds: 80% core, 70% frontend) — coverage MUST hold; renames preserve all tests, new converter tests can only raise coverage
- [ ] 3.13.2 `pnpm -r build` zero warnings (consumer barrels still resolve every export; build verifies the rename did not break the public API of any package)
- [ ] 3.13.3 `pnpm lint` zero errors/warnings
- [ ] 3.13.4 NO changeset (file rename, exported symbol names unchanged → no behavioral change for consumers of `@kaiord/garmin`, `@kaiord/fit`, `@kaiord/tcx`, `@kaiord/zwo`, or `@kaiord/workout-spa-editor`). The "internal-rename-no-changeset" exception is codified in `git-strategy/SKILL.md` (see task 4.6.4)
- [ ] 3.13.5 open PR titled `chore(scripts): mapper-to-converter rename driven by guideline guards` (the rename is mechanically driven by the `R-MapperNoTests` and `R-ConverterHasTests` scripts shipped in PR1, so `chore(scripts)` is the honest single scope; affected packages enumerated in PR body)

## 4. PR4 — Test hygiene + doc alignment (drain `R-NoUnconditionalSkip` + finish docs)

### 4.1 CalendarPage.test.tsx un-skip

For each of the three skipped sites (lines 89, 99, 113), the cycle is RED → GREEN → REFACTOR with a contingency: if un-skipping the test passes immediately on first run (i.e., the underlying fixture/setup issue was already fixed by an unrelated change in the meantime), collapse RED+GREEN into a single combined checkbox marked "characterization-on-un-skip" and proceed to REFACTOR if needed. Otherwise apply the full RED/GREEN/REFACTOR cycle.

- [ ] 4.1.1 line 89: flip `it.skip` → `it`; if the test fails (RED), fix the underlying drag-and-drop / `userEvent` setup issue (GREEN); if it passes immediately, mark as characterization-on-un-skip
- [ ] 4.1.2 line 89: refactor the test for AAA clarity if needed (REFACTOR)
- [ ] 4.1.3 line 99: same flow as 4.1.1
- [ ] 4.1.4 line 99: REFACTOR
- [ ] 4.1.5 line 113: same flow as 4.1.1
- [ ] 4.1.6 line 113: REFACTOR
- [ ] 4.1.7 `pnpm --filter @kaiord/workout-spa-editor test packages/workout-spa-editor/src/components/pages/CalendarPage.test.tsx` passes (zero skips)

### 4.2 json-parser.test.ts:462 perf complexity (path-(b) replacement per `R-NoUnconditionalSkip`)

This task takes path (b) of the `R-NoUnconditionalSkip` requirement: "moved to a separate non-skipped fast-path test". Production code is NOT touched.

- [ ] 4.2.1 read the existing `it.skip` block to understand what it intended to test
- [ ] 4.2.2 write a deterministic three-input fast-path test that asserts ONLY what is currently true about `json-parser` (output equality on three increasing inputs, e.g., 100/200/400 tokens). Do NOT assert any timing budget — adding a perf budget is a separate change. The new test must pass against the CURRENT implementation without any production-code changes
- [ ] 4.2.3 REPLACE (not merely delete) the existing `it.skip` block with the new fast-path test from 4.2.2
- [ ] 4.2.4 verify `pnpm --filter @kaiord/workout-spa-editor test packages/workout-spa-editor/src/utils/json-parser.test.ts` passes; no production file is touched

### 4.3 xsd-validator.test.ts:47 Node-only

- [ ] 4.3.1 replace `it.skip("should use XSD validator in Node.js environment", ...)` with `it.skipIf(typeof window !== "undefined", ...)` so the test runs unconditionally in Node CI and skips cleanly in browser-mode runs
- [ ] 4.3.2 verify the test passes locally with `pnpm --filter @kaiord/zwo test`; the `R-NoUnconditionalSkip` script accepts this form because `typeof window !== "undefined"` is a runtime-evaluated expression

### 4.4 Drain no-unconditional-skip allowlist

- [ ] 4.4.1 set `ALLOWLIST` in `scripts/check-no-unconditional-skip.mjs` to `new Set()` (empty)
- [ ] 4.4.2 `pnpm test:scripts` passes (only `*.skipIf(<runtime-expr>)` patterns remain)

### 4.5 Translate fixtures README to English

- [ ] 4.5.1 translate `packages/core/src/tests/fixtures/README.md` to English (preserve markdown structure and any code-block content unchanged)
- [ ] 4.5.2 `pnpm lint:specs` and `pnpm lint:archive` still pass

### 4.6 Update guideline docs (5 files)

- [ ] 4.6.1 update `.claude/skills/guidelines/architecture-hexagonal/SKILL.md`: replace every `check-architecture.js` reference with `scripts/check-architecture.mjs`; replace "only built-in adapter in core" with explicit `{logger, analytics}` allowlist; the `<!-- arch-vocab -->` block (added in 1.1.0) is already present here. Add the FIT-SDK-types-live-in-fit clause; add a pointer to `scripts/check-package-deps.mjs` for the package-dependency table
- [ ] 4.6.2 update `.claude/skills/guidelines/design-principles/SKILL.md`: in the Mappers-vs-converters table, append a column "Enforcement" pointing at `scripts/check-mapper-no-tests.mjs` and `scripts/check-converter-has-tests.mjs`
- [ ] 4.6.3 update `.claude/skills/guidelines/testing-standards/SKILL.md`: in the "Never skip a test" rule, append "Enforcement: `scripts/check-no-unconditional-skip.mjs`"; document the four dispatch shapes the rule covers (member, computed-member, destructured, re-bound), the `skipIf(<runtime-expr>)` allowance, and the literal-only rejection (including `!!1`, `1+1`, `true && true`, `` `true` `` template literals)
- [ ] 4.6.4 update `.claude/skills/guidelines/git-strategy/SKILL.md`: (a) the `<!-- commitlint-source-of-truth -->` block was inserted in 1.7.4 — confirm it is byte-identical to the arrays in `commitlint.vocab.mjs` (the test in 1.7.5 enforces this; this task is a manual cross-check); (b) in the conventional-commit table, append "Enforcement: `commitlint.config.mjs` + `.husky/commit-msg` + `scripts/check-commitlint-config.test.mjs`"; (c) document the `--no-verify`-hint removal and the CI commitlint backstop; (d) add a new "Changeset exceptions" subsection codifying the rule used by PR1/PR2/PR3/PR4 in this change: "A changeset is NOT required when (i) the change touches only repo-root tooling (scripts/, .husky/, root package.json devDeps), (ii) the change is internal to a published package and exported symbol names are unchanged (e.g., file renames preserving the public API), or (iii) the change is test-only or docs-only. Examples in `openspec/changes/archive/<date>-guidelines-compliance-harden/` are illustrative."
- [ ] 4.6.5 update `.claude/skills/guidelines/xp-tdd-practices/SKILL.md`: under the "Tasks without behavior" section, add a one-line example: "Characterization tests for unchanged production code (e.g., adding tests to a `*.converter.ts` whose logic is not modified) use plain checkboxes — they describe current behavior, not new behavior."

### 4.7 Sweep for stale `check-architecture.js` references

- [ ] 4.7.1 `grep -rn "check-architecture\.js" openspec/ .claude/` to enumerate every stale reference
- [ ] 4.7.2 rewrite each occurrence to `scripts/check-architecture.mjs`
- [ ] 4.7.3 confirm `grep -rn "check-architecture\.js" openspec/ .claude/` returns no lines

### 4.8 PR4 close-out

- [ ] 4.8.1 `pnpm -r test:coverage` thresholds hold
- [ ] 4.8.2 `pnpm -r build` zero warnings
- [ ] 4.8.3 `pnpm lint` zero errors/warnings (includes `lint:specs`, `lint:archive`, `lint:archive-index`)
- [ ] 4.8.4 `/opsx-verify guidelines-compliance-harden` against all spec scenarios
- [ ] 4.8.5 NO changeset (test/docs only — no published-package behavior change)
- [ ] 4.8.6 open PR titled `test(spa-editor): un-skip masked tests and align guideline docs` (single-scope; the json-parser, xsd-validator, fixtures-README, and SKILL.md updates are enumerated in the PR body)

## 5. Final validation block (run before archiving)

- [ ] 5.1 `pnpm -r test:coverage` (thresholds: 80% core, 70% frontend)
- [ ] 5.2 `pnpm -r build` (zero warnings)
- [ ] 5.3 `pnpm lint` (zero errors/warnings; includes `lint:specs`, `lint:archive`, `lint:archive-index`)
- [ ] 5.4 `/opsx-verify guidelines-compliance-harden` against all spec scenarios
- [ ] 5.5 flip `scripts/check-allowlists-empty.mjs` from `--mode=warn` (used during PR1) to `--mode=error` (default). Run `pnpm test:scripts`; confirm `R-AllowlistsEmpty` passes — every `ALLOWLIST` Set in the 6 source-of-truth check scripts is `new Set()` (empty). Cross-check: `grep -rE "ALLOWLIST = new Set\(\[" scripts/check-architecture.mjs scripts/check-package-deps.mjs scripts/check-mapper-no-tests.mjs scripts/check-converter-has-tests.mjs scripts/check-no-unconditional-skip.mjs scripts/check-husky-no-bypass-hint.mjs` returns no lines
- [ ] 5.6 `pnpm exec changeset status` shows no pending bumps (every PR landed as no-changeset; if any did add one, that's an audit failure to investigate). Cross-check the "Changeset exceptions" subsection added to `git-strategy/SKILL.md` in 4.6.4 — every PR matches one of the three documented exceptions
- [ ] 5.7 absorb the change deltas into the canonical specs: - rewrite every `check-architecture.js` reference in `openspec/specs/hexagonal-arch/spec.md` to `scripts/check-architecture.mjs` (`grep -rn "check-architecture\.js" openspec/ .claude/` MUST return no lines after this step) - merge the `## ADDED Requirements` and `## MODIFIED Requirements` from `openspec/changes/guidelines-compliance-harden/specs/hexagonal-arch/spec.md` into `openspec/specs/hexagonal-arch/spec.md`. The five `## MODIFIED Requirements` (Layer Hierarchy, Domain Purity, Application Isolation, Port Contracts, Adapter Freedom) REPLACE their canonical counterparts; the four `## ADDED Requirements` (Architecture mechanical guard exists, Core adapter allowlist, Vendor SDK ambient types, Package dependency table is mechanically enforced) are appended. The `Package Dependencies` requirement table on the canonical spec MUST remain byte-identical for `@kaiord/docs` and `@kaiord/landing` rows - merge the `## ADDED Requirements` from `openspec/changes/guidelines-compliance-harden/specs/spa-quality-gates/spec.md` into `openspec/specs/spa-quality-gates/spec.md` (eight new requirements appended; existing toast/PII/Zustand requirements untouched) - update the `> Synced:` marker on BOTH canonical specs to `> Synced: <archive-date> (guidelines-compliance-harden)` (the archive-date is set in 5.8 and MUST match) - run `pnpm lint:specs` (zero violations)
- [ ] 5.8 `/opsx-archive guidelines-compliance-harden` (sets `> Completed: YYYY-MM-DD` to today and moves to `openspec/changes/archive/YYYY-MM-DD-guidelines-compliance-harden/`); the `> Synced:` markers updated in 5.7 MUST equal the archive date
