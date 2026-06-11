# Test Minimality

## ADDED Requirements

### Requirement: Test suites SHALL NOT target pure re-export barrel modules

A `*.test.{ts,tsx}` file under `packages/**` SHALL NOT have a subject module (the test file's path minus the `.test` segment) that consists solely of `export ... from` / `export type ... from` re-export statements, ignoring comments and blank lines. Such suites duplicate the source-level suites of the re-exported modules verbatim and add no discrimination.

This requirement SHALL be mechanically enforced by `scripts/check-no-barrel-test-suites.mjs` (rule id `R-NoBarrelTestSuite`), wired into `pnpm test:scripts` (husky pre-commit and the CI lint job), with the same in-scope file pattern and exclusion list as `R-ItTitleShould`. The guard SHALL support a `--changed-files` flag restricting inspection to the staged file set, and SHALL emit one stderr line per violation in the format `R-NoBarrelTestSuite: <repo-relative-test-path> — subject module <repo-relative-subject-path> is a pure re-export barrel; test the source modules instead.`

#### Scenario: Barrel-backed test suite fails the guard

- **GIVEN** `packages/tcx/src/adapters/duration/duration.converter.ts` contains only `export { convertTcxDuration } from "./tcx-to-krd.converter";` and `export { convertKrdDurationToTcx } from "./krd-to-tcx.converter";`
- **WHEN** `packages/tcx/src/adapters/duration/duration.converter.test.ts` exists and `pnpm test:scripts` runs
- **THEN** the guard SHALL exit non-zero
- **AND** stderr SHALL contain `R-NoBarrelTestSuite:` followed by the test file path

#### Scenario: Test suite over a module with executable logic passes

- **GIVEN** a subject module that contains at least one statement other than a re-export (a function body, a constant with an initializer expression, a class, or a type with structural members defined locally)
- **WHEN** its co-located `*.test.ts` file is inspected by the guard
- **THEN** the guard SHALL NOT report it

#### Scenario: Changed-files mode with no staged test files exits zero silently

- **WHEN** the guard runs with `--changed-files` and the staged set contains no in-scope test files
- **THEN** it SHALL exit zero with no output

### Requirement: Test files named `*round-trip*` SHALL exercise both conversion legs

A test file under `packages/**` whose basename contains `round-trip` SHALL convert at least one fixture through both directions of the pair it names (source format → KRD → source format, or KRD → format → KRD) and SHALL assert tolerance-bounded equality on the returned representation. A file that only encodes or only decodes SHALL be renamed to state its real direction (e.g. `*-fit-to-krd.test.ts`). Enforcement is review-level.

#### Scenario: Encode-only file may not carry a round-trip name

- **GIVEN** a test file named `round-trip-duration.test.ts` whose every test performs `reader(fixture) → mutate → convertKRDToMessages → assert message fields` without re-decoding
- **WHEN** the file is reviewed against this capability
- **THEN** the file SHALL be renamed to a direction-honest name or extended with the missing decode leg

#### Scenario: Genuine round-trip file passes

- **WHEN** a test file named `weight-round-trip.test.ts` reads a FIT fixture to KRD, writes it back to FIT, re-reads it, and asserts field equality within the configured tolerances
- **THEN** the file satisfies this requirement

### Requirement: Every test SHALL assert an observable outcome

Each `it()` body SHALL contain at least one assertion that can fail when the behavior under test regresses. Assertions that are vacuously true regardless of behavior — `toBeDefined()` on a value the harness always defines, presence checks on mocks created in the same test, `expect(true)`-equivalents — SHALL NOT be a test's only proof. Mock-call assertions (`toHaveBeenCalledWith`) are acceptable only alongside an assertion on an observable result (returned value, emitted output, thrown error, rendered content, exit code with expected value). Enforcement is review-level.

#### Scenario: exit-code existence is not a proof

- **GIVEN** an integration test that runs the CLI via `execa(..., { reject: false })`
- **WHEN** its only assertion is `expect(result.exitCode).toBeDefined()`
- **THEN** the test SHALL be rewritten to assert the expected exit code value and an observable effect (output file content, stdout/stderr message), or deleted

#### Scenario: Mock-call assertion paired with observable outcome passes

- **WHEN** a test asserts `expect(service.push).toHaveBeenCalledWith(workoutId)` **and** asserts the command's success output message
- **THEN** the test satisfies this requirement

### Requirement: Dispatcher test suites SHALL assert routing only

When a module's sole logic is dispatching to per-type leaf converters that own their value logic and have their own suites, the dispatcher's suite SHALL contain at most one routing assertion per dispatch branch (input of type X produces output of leaf-converter X's shape). Value-level correctness (scaling, offsets, boundaries, unit conversions) SHALL be asserted only in the leaf suites.

#### Scenario: Dispatcher suite re-testing leaf values is reduced

- **GIVEN** `convertFitTarget` dispatches on `targetType` to five leaf converters, each with an exhaustive leaf suite
- **WHEN** the dispatcher suite asserts watts-offset decoding, zone boundaries, and range priority for every type
- **THEN** the dispatcher suite SHALL be reduced to one routing assertion per branch

#### Scenario: Leaf-only branch coverage is preserved

- **WHEN** a dispatch branch exists whose leaf converter has no co-located suite
- **THEN** the dispatcher suite MAY keep the value-level assertions for that branch until the leaf suite exists

### Requirement: Test titles SHALL describe domain behavior above the implementation

`it()` titles (beyond the mechanical `should ` prefix governed by `test-conventions`) SHALL describe the observable domain behavior, not the implementation: titles SHALL NOT name internal functions, mock objects, or fixture file names, and SHALL NOT state a code path that does not exist. Enforcement is review-level; the `test-conventions` mechanical guards are unchanged by this requirement.

#### Scenario: Internal-symbol title is rewritten

- **WHEN** a test is titled `should dispatch power → convertPowerTarget`
- **THEN** it SHALL be retitled to the behavior, e.g. `should encode a power target as FIT targetType power`

#### Scenario: Title asserting a non-existent code state is corrected

- **GIVEN** `convertKRDToMessages` is implemented and invoked by the FIT writer
- **WHEN** a test is titled `should throw FitParsingError when conversion not implemented`
- **THEN** the title SHALL be corrected to the real failure mode (e.g. the encoder rejecting unserializable messages)
