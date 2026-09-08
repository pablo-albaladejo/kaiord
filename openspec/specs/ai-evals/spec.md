> Synced: 2026-07-09 (add-lab-extraction-agent)

# ai-evals Specification

## Purpose

Defines the deterministic, keyless eval smoke lane (built on `MockLanguageModelV4`) that exercises the real agent runtime in CI, and the provider-generalized manual eval loader driven by `EVAL_PROVIDER`/`EVAL_MODEL`.

## Requirements

### Requirement: Deterministic eval smoke lane in CI

`packages/ai` SHALL contain a keyless, deterministic smoke lane built on
`MockLanguageModelV4` from `ai/test` that exercises the REAL agent runtime
end to end — prompt assembly from the registry, file-part passthrough,
the validation retry loop, telemetry emission, and usage mapping — and this
lane SHALL run as part of the package's standard `pnpm test` so it gates CI
without any provider credentials.

#### Scenario: Runtime behavior gated without keys

- **GIVEN** a CI environment with no provider API keys
- **WHEN** the package test suite runs
- **THEN** the smoke lane SHALL execute scripted model responses through `runGenerateAgent` and fail the build on any regression in prompt assembly, retry behavior, file forwarding, or telemetry

#### Scenario: Extractor covered by the lane

- **WHEN** the smoke lane runs the `lab-extractor` definition with a scripted extraction response
- **THEN** it SHALL assert the catalog listing was injected into the system prompt and the document file part reached the model

### Requirement: Provider-generalized manual eval loader

The manual eval CLIs SHALL load their model through a shared loader that
reads `EVAL_PROVIDER` (defaulting to `anthropic`) and `EVAL_MODEL`, building
the model via `@kaiord/ai/providers` with the matching provider API key from
the environment. Anthropic-only loading SHALL no longer be hardcoded.

#### Scenario: Evals run against another provider

- **GIVEN** `EVAL_PROVIDER=google` and a Google API key in the environment
- **WHEN** `pnpm eval` runs
- **THEN** the benchmarks SHALL execute against the Google model without code changes

### Requirement: A suite that cannot execute declares its own inertness

An eval suite whose runner cannot obtain a model in this project SHALL state, in
the runner itself, that it cannot execute, why, and what would change that. Such
a runner SHALL NOT exit non-zero on the basis of a score, because a comparison
that cannot run is not a gate and presenting one as a gate is the failure this
capability exists to prevent.

The obligation is on the **runner's exit behaviour**, not on any syntactic form
of it: extracting the comparison to a variable does not satisfy it. A runner
that CAN obtain a model without a credential is unaffected and MAY gate.

#### Scenario: An unrunnable runner says so

- **WHEN** a reader opens a runner whose model loader requires a credential the project does not have
- **THEN** the file SHALL state its inert status and the condition that would lift it

#### Scenario: No score decides the exit code of an inert runner

- **GIVEN** a runner that obtains its model through a loader requiring a credential the project does not have
- **WHEN** its exit path is inspected
- **THEN** no score, rate or threshold comparison SHALL determine the exit code, whether written inline or bound to a variable first

#### Scenario: A keyless runner may still gate

- **GIVEN** a runner that obtains everything it needs without a credential
- **WHEN** it computes a result
- **THEN** it MAY exit non-zero on that result, and this requirement SHALL NOT be read to forbid it

### Requirement: Benchmark fixtures are validated without a model

The structural claims a benchmark fixture makes about itself SHALL be checked by
a keyless test that runs on every commit. A zone check SHALL declare at least
one bound **that its comparison can use**; a zone check whose bounds are absent,
or present but unusable by the comparison that reads them, SHALL be rejected,
because it asserts nothing while appearing to assert something.

#### Scenario: A bounds-less zone check fails the build

- **GIVEN** a benchmark whose `zoneCheck` declares neither a minimum nor a maximum
- **WHEN** the package test suite runs
- **THEN** it SHALL fail, naming the benchmark

#### Scenario: A bound the comparison cannot reach is not a bound

- **GIVEN** a `zoneCheck` declaring a bound whose value the reading comparison skips
- **WHEN** the package test suite runs
- **THEN** it SHALL fail, and the comparison SHALL test for the bound's presence rather than its truthiness

#### Scenario: Fixture validation needs no credential

- **GIVEN** an environment with no provider API key
- **WHEN** the package test suite runs
- **THEN** the fixture invariants SHALL still be enforced

### Requirement: An unmatched assertion is never a silent pass

When an assertion finds no subject to evaluate — no step of the target type, no
row for an expected label — it SHALL report a named failure or an explicitly
unmeasured result. It SHALL NOT return success by virtue of having found nothing
to check.

#### Scenario: No matching steps is not a pass

- **GIVEN** a workout containing no active step of the zone check's target type
- **WHEN** the zone assertion runs
- **THEN** it SHALL NOT contribute a passing result

### Requirement: Absence of measurement is a distinct result

An eval result SHALL distinguish "measured and failed" from "never measured".
The unmeasured state SHALL be a member of the result union carrying a stated
reason and no score, so it cannot be averaged, summed or compared as though it
were one.

#### Scenario: An unmeasured criterion cannot inflate a rate

- **GIVEN** a criterion that produced no measurement
- **WHEN** the suite computes its pass rate
- **THEN** the criterion SHALL be excluded from the rate and reported separately with its reason

#### Scenario: Counts are reported as a pair

- **WHEN** a suite reports results
- **THEN** it SHALL report how many criteria were measured alongside how many passed

### Requirement: A reported rate names its scale

Any rate this capability reports SHALL carry its scale in the name or the type,
not in a reader's assumption. A field that is a fraction SHALL NOT be named as
though it were a percentage, and two rates that a reader may compare SHALL be on
one scale.

This exists because the suites it governs once carried three floors in two
scales — two in percent, one as a fraction, with the numerically smaller number
the looser gate — and because the field feeding them was rounded to an integer
percentage before the comparison read it, so a display concern and a gate
concern shared one field.

#### Scenario: A fraction is not named as a percentage

- **GIVEN** a reported value that is a ratio in `0..1`
- **WHEN** it is named
- **THEN** the name or type SHALL make the scale explicit, and rounding for display SHALL NOT alter the value any comparison reads

#### Scenario: Two comparable rates share a scale

- **WHEN** a report carries more than one rate a reader may compare
- **THEN** they SHALL be on the same scale

### Requirement: A scorer refuses input it does not understand

A scorer SHALL treat malformed input as a harness fault and fail, naming the
value received and the shape expected. Genuinely absent expectations SHALL
remain a clean pass; a malformed expectation SHALL NOT be read as an absent one.

#### Scenario: A reshaped input fails loudly

- **GIVEN** a scorer whose expectations arrive as a scalar where a list is required
- **WHEN** the scorer runs
- **THEN** it SHALL report a harness fault rather than take its "no expectations" branch

#### Scenario: Genuinely absent expectations still pass

- **GIVEN** a case declaring no expectations for a scorer
- **WHEN** the scorer runs
- **THEN** it SHALL pass cleanly

### Requirement: Documented gates match implemented gates

Documentation describing this capability's thresholds SHALL describe gates the
code implements. A documented threshold with no implementation SHALL be either
implemented or removed, and SHALL NOT be carried forward by a documentation
refresh.

#### Scenario: A documented threshold with no code is settled, not restated

- **GIVEN** documentation asserting a per-dimension threshold that no code enforces
- **WHEN** that documentation is revised
- **THEN** the threshold SHALL be implemented or the claim removed, and the revision SHALL NOT restate it unchanged
