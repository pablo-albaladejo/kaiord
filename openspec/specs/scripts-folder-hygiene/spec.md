> Synced: 2026-05-05 (repo-quality-maintenance-waves)

# Scripts folder hygiene

## Purpose

Defines the orphan-prevention invariant for files under `scripts/`. Every file in
that folder MUST be reachable from a known wiring point (root or sub-package
`package.json`, GitHub workflow, husky hook, `.claude/settings.json`, another
script, or a documented manual-maintainer allowlist in `scripts/README.md`).
The rule is enforced mechanically by `scripts/check-scripts-orphans.mjs`; CI
fails on any orphan or any malformed allowlist entry.

In addition, every entry in the root `package.json#pnpm.overrides` field MUST
be either still required to suppress a vulnerable transitive resolution, or
explicitly preserved via an allowlist entry in `scripts/README.md`. The rule
is enforced by `scripts/check-overrides-stale.mjs`.

## Requirements

### Requirement: No orphan scripts

Every regular file under `scripts/` (excluding `*.test.mjs`, the README, and the `lib/`, `cws-api/`, and `fixtures/` subfolders) SHALL be reachable from at least one of the following wiring points:

1. A `scripts.*` value in the root `package.json` or any `packages/*/package.json`.
2. A shell step in `.github/workflows/*.yml` or a composite step in `.github/actions/**/action.yml`.
3. A command in `.husky/*`.
4. A hook command in `.claude/settings.json`.
5. A `node|bash|sh`-style invocation or `import` of the script from another file under `scripts/`.
6. An entry in the **Manual maintainer tools** allowlist of `scripts/README.md`, delimited by the markers `<!-- manual-tools:start -->` and `<!-- manual-tools:end -->`. Each allowlist entry MUST name the file and a one-line "When to run" explanation.

The rule SHALL be enforced by `scripts/check-scripts-orphans.mjs` (rule ID `R-ScriptsNoOrphans`), wired into `pnpm test:scripts` and surfaced via `pnpm lint`.

#### Scenario: Wired script passes

- **GIVEN** `scripts/foo.mjs` exists and root `package.json` declares `"lint:foo": "node scripts/foo.mjs"`
- **WHEN** `pnpm test:scripts` runs
- **THEN** `check-scripts-orphans.mjs` records `foo.mjs` as reachable via wiring point 1 and exits 0

#### Scenario: Workflow-only invocation passes

- **GIVEN** `scripts/bar.mjs` exists and is invoked from `.github/workflows/release.yml` via `node scripts/bar.mjs`
- **WHEN** `pnpm test:scripts` runs
- **THEN** `check-scripts-orphans.mjs` records `bar.mjs` as reachable via wiring point 2 and exits 0

#### Scenario: Manual tool with allowlist entry passes

- **GIVEN** `scripts/baz.sh` exists, has no automated wiring, and `scripts/README.md` contains a row inside the `<!-- manual-tools:start -->` / `<!-- manual-tools:end -->` block naming `baz.sh` with a "When to run" sentence
- **WHEN** `pnpm test:scripts` runs
- **THEN** `check-scripts-orphans.mjs` records `baz.sh` as reachable via wiring point 6 and exits 0

#### Scenario: Orphan script fails

- **GIVEN** `scripts/qux.mjs` exists with no wiring point and no allowlist entry
- **WHEN** `pnpm test:scripts` runs
- **THEN** `check-scripts-orphans.mjs` exits non-zero and the failure message names `qux.mjs` and lists the six wiring options
- **AND** `pnpm lint` propagates the same non-zero exit

#### Scenario: Allowlist marker block missing fails

- **GIVEN** `scripts/README.md` does not contain the `<!-- manual-tools:start -->` / `<!-- manual-tools:end -->` markers
- **WHEN** `pnpm test:scripts` runs
- **THEN** `check-scripts-orphans.mjs` exits non-zero with a message naming the missing markers
- **AND** the script does not silently treat the README as an empty allowlist

#### Scenario: Allowlist entry without "When to run" fails

- **GIVEN** the allowlist block contains a row naming `baz.sh` but no "When to run" explanation
- **WHEN** `pnpm test:scripts` runs
- **THEN** `check-scripts-orphans.mjs` exits non-zero with a message naming `baz.sh` and the missing field

### Requirement: No stale pnpm overrides

Every entry in the root `package.json#pnpm.overrides` field SHALL be either (a) still required because at least one transitive dependency in `pnpm-lock.yaml` resolves to a version inside the patched range without the override, or (b) explicitly preserved via an allowlist entry in `scripts/README.md` between the markers `<!-- overrides-allowlist:start -->` and `<!-- overrides-allowlist:end -->`. Each allowlist entry MUST name the override key (e.g. `qs@>=6.7.0 <=6.14.1`) and a one-line "Why kept" note.

The rule SHALL be enforced by `scripts/check-overrides-stale.mjs` (rule ID `R-OverridesStale`), wired into `pnpm test:scripts` and surfaced via `pnpm lint` (or its parallelized successor introduced by Wave 2.2 of the `repo-quality-maintenance-waves` change).

The check SHALL operate using the following deterministic algorithm:

1. **Parse**. Read root `package.json#pnpm.overrides`. For every entry, parse the **key** as `<package-name>(@<vulnerable-range>)?` (e.g. `qs@>=6.7.0 <=6.14.1` ⇒ name `qs`, vulnerable range `>=6.7.0 <=6.14.1`; bare `lodash` ⇒ name `lodash`, vulnerable range `*`). Parse the **value** as the patched-range (e.g. `>=6.14.2`).
2. **Resolve current install**. Read `pnpm-lock.yaml`. For every entry whose package name matches an override's name, collect the resolved version (the `version:` field).
3. **Re-resolve without the override**. Either (a) shell out to `pnpm why <pkg> --json` for each override and read the `wantedDependency` of each leaf — i.e. the version the lock would have picked without the override — or (b) call `pnpm install --no-frozen-lockfile --lockfile-only --config.overrides='{}'` into a temp directory and read the resulting `pnpm-lock.yaml`. Implementations MAY pick the cheaper of the two; both are acceptable.
4. **Decide**. An override is **required** if at least one re-resolved version satisfies the override's `vulnerable-range`. An override is **stale** if every re-resolved version is OUTSIDE the vulnerable range AND inside the patched-range — meaning the upstream tree no longer pulls a vulnerable version, so the pin is dead weight.
5. **Allowlist**. An override that is stale by step 4 SHALL still pass the check if `scripts/README.md` contains a row inside the markers `<!-- overrides-allowlist:start -->` / `<!-- overrides-allowlist:end -->` naming the override key and a one-line "Why kept" justification.
6. **Empty / absent**. If `pnpm.overrides` is absent or `{}`, the check SHALL exit `0` silently — there is nothing to validate.

The check MUST be deterministic on any given `pnpm-lock.yaml`: two consecutive runs against the same inputs SHALL produce identical output. Network access is forbidden during the check; if step 3 requires it, the check SHALL fail closed with a "no network" diagnostic rather than rely on online registry access.

Stale overrides SHALL fail the check unless allowlisted with a justification per step 5.

#### Scenario: Required override passes

- **GIVEN** root `package.json#pnpm.overrides` contains `"qs@>=6.7.0 <=6.14.1": ">=6.14.2"`
- **AND** `pnpm-lock.yaml` records at least one transitive dependency on `qs` whose un-overridden resolution would be inside `>=6.7.0 <=6.14.1`
- **WHEN** `pnpm test:scripts` runs
- **THEN** `check-overrides-stale.mjs` records `qs@...` as required and exits 0 for that entry

#### Scenario: Stale override without allowlist fails

- **GIVEN** root `package.json#pnpm.overrides` contains `"some-pkg@<1.0.0": ">=1.0.1"`
- **AND** every transitive dependency on `some-pkg` in `pnpm-lock.yaml` already resolves to `>=1.0.1` without the override applied
- **AND** `scripts/README.md` does NOT list `some-pkg@<1.0.0` inside the `<!-- overrides-allowlist:start -->` / `<!-- overrides-allowlist:end -->` block
- **WHEN** `pnpm test:scripts` runs
- **THEN** `check-overrides-stale.mjs` reports `some-pkg@<1.0.0` as stale and exits non-zero with rule ID `R-OverridesStale`

#### Scenario: Allowlisted override passes despite being stale

- **GIVEN** root `package.json#pnpm.overrides` contains `"legacy-pkg@<2.0.0": ">=2.0.1"`
- **AND** the override is currently stale by the analysis above
- **AND** `scripts/README.md` contains a row inside the `<!-- overrides-allowlist:start -->` / `<!-- overrides-allowlist:end -->` block naming `legacy-pkg@<2.0.0` with a "Why kept" sentence (e.g. `defensive pin for CVE-XXXX-YYYY pending audit`)
- **WHEN** `pnpm test:scripts` runs
- **THEN** `check-overrides-stale.mjs` records `legacy-pkg@<2.0.0` as allowlisted and exits 0 for that entry

#### Scenario: Malformed allowlist entry fails

- **GIVEN** the `<!-- overrides-allowlist:start -->` / `<!-- overrides-allowlist:end -->` block contains a line that does not include both an override key and a "Why kept" justification
- **WHEN** `pnpm test:scripts` runs
- **THEN** `check-overrides-stale.mjs` exits non-zero with rule ID `R-OverridesStale` and identifies the malformed line

#### Scenario: Empty or absent overrides field exits silently

- **GIVEN** root `package.json` has either no `pnpm.overrides` field at all OR an empty object `pnpm.overrides: {}`
- **WHEN** `pnpm test:scripts` runs
- **THEN** `check-overrides-stale.mjs` exits 0 silently — no diagnostic, no warning — because there is nothing to validate

#### Scenario: Network-required execution fails closed

- **GIVEN** the implementation chose strategy (b) — running `pnpm install --no-frozen-lockfile --lockfile-only --config.overrides='{}'` into a temp directory — and no network access is available (e.g. CI sandbox blocks the pnpm registry)
- **WHEN** `pnpm test:scripts` runs
- **THEN** `check-overrides-stale.mjs` exits non-zero with a `no-network` diagnostic message — the check MUST NOT silently pass when it cannot perform its analysis
