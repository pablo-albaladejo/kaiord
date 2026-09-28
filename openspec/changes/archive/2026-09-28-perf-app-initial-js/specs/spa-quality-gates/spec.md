## ADDED Requirements

### Requirement: SPA initial JS budget

The CI `size-limit` job SHALL run `pnpm size:spa` (`scripts/check-spa-initial-js.mjs`) over the SPA build it consumes. The script SHALL sum the gzip size of the entry `<script type="module">` and every `<link rel="modulepreload">` in `packages/workout-spa-editor/dist/index.html`, and SHALL fail when the sum exceeds `SPA_INITIAL_JS_BUDGET_KB` or when `dist/index.html` is missing. The budget SHALL be the size measured when it was last set, times 1.05, and SHALL be raised only with that measurement recorded. The repository variable `vars.SIZE_LIMIT_BOT_ENABLED=false` gates the whole `size-limit` job, so it SHALL disable this budget together with `pnpm size`.

#### Scenario: A lazy route becomes a static import

- **WHEN** a change imports a lazy page statically into the entry graph and the initial JS grows past the budget
- **THEN** `pnpm size:spa` exits non-zero and names the measured and budgeted sizes

#### Scenario: The SPA build is missing

- **WHEN** `pnpm size:spa` runs and `packages/workout-spa-editor/dist/index.html` does not exist
- **THEN** it exits non-zero with an explicit error instead of passing on nothing

#### Scenario: The kill switch is set

- **WHEN** `vars.SIZE_LIMIT_BOT_ENABLED` is `false`
- **THEN** the `size-limit` job is skipped, and neither `pnpm size` nor `pnpm size:spa` runs

### Requirement: /app Lighthouse mobile score

The SPA at `https://kaiord.com/app/` SHALL score Lighthouse Performance >= 70 on mobile, measured as the median of 3 runs of `lighthouse@12 --only-categories=performance --form-factor=mobile --throttling-method=simulate`. CI enforces the bytes (the initial JS budget), not the score; the score is measured before and after any change that targets it and recorded in its PR.

#### Scenario: Measuring a performance change

- **WHEN** a PR changes the SPA entry graph to improve performance
- **THEN** its description records the 3-run median before and after, with the configuration used
