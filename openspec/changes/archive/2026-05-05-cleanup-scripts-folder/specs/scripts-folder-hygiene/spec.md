## ADDED Requirements

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
