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
