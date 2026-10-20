## ADDED Requirements

### Requirement: Coverage floors only ratchet up

No coverage floor SHALL be lowered or removed. A floor is any of: a `THRESHOLD=<n>` arm of the coverage step in `.github/workflows/ci.yml` (resolved per package, so a package moved between arms is compared at the value it now gets), a numeric entry of a `thresholds` block in a `packages/*/vitest*.config.*` file, a `target` of a non-informational `coverage.status` check in `codecov.yml`, and the default threshold of `.github/scripts/check-coverage.js`. A codecov `threshold` is the drop a check tolerates, so raising it is a relaxation and SHALL be treated like lowering a floor. Raising a floor, or adding one, is allowed.

The repository SHALL contain `scripts/check-coverage-floors-ratchet.mjs` (+ co-located `*.test.mjs`) that compares every floor in the working tree with the same floor at the merge base of `HEAD` and `origin/main` (overridable with `COVERAGE_FLOORS_BASE_REF`). The rule ID is `R-CoverageFloorsRatchet`. The script SHALL be wired into `pnpm lint` and its suite into `pnpm test:scripts`. It SHALL fail closed: an unresolvable base ref, or a floor source that yields no floor on either side, is a violation, never a pass.

#### Scenario: A floor is lowered

- **GIVEN** the merge base sets the default ci.yml arm to `THRESHOLD=80`
- **WHEN** a PR changes it to `THRESHOLD=75` and `pnpm lint` runs
- **THEN** the process exits non-zero and stderr names `R-CoverageFloorsRatchet`, the arm, and `80 -> 75`

#### Scenario: A floor is removed

- **WHEN** a PR deletes a `thresholds` block from a package's vitest config, makes a codecov status `informational`, or stops passing `$THRESHOLD` to `check-coverage.js`
- **THEN** the guard reports each floor that disappeared as `removed` and exits non-zero

#### Scenario: A floor is raised or added

- **WHEN** a PR raises a floor, adds a vitest config with thresholds, or moves a bridge package from the 60 arm to the default 80 arm
- **THEN** the guard exits 0

#### Scenario: The branch is main itself

- **WHEN** the guard runs on `main` with `origin/main` at `HEAD`
- **THEN** every floor equals its baseline and the guard exits 0

#### Scenario: The base ref is unavailable

- **GIVEN** a checkout where `origin/main` cannot be resolved (a shallow clone)
- **WHEN** the guard runs
- **THEN** it exits non-zero with a `base-unavailable` violation that says to fetch the base or check out with `fetch-depth: 0`
