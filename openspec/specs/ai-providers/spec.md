> Synced: 2026-07-09 (add-ai-platform-foundation)

# ai-providers Specification

## Purpose

Defines `@kaiord/ai/providers` — provider model instantiation, the SDK-sourced model catalog and its generation machinery, purpose→model resolution, optional-peer packaging, and the `@ai-sdk/*` containment guard.

## Requirements

### Requirement: Provider model factory owned by @kaiord/ai

`@kaiord/ai/providers` SHALL export `createLanguageModel(credential, modelId, options?)`
covering the provider types `anthropic`, `openai`, and `google`. Each provider's
`@ai-sdk/*` package SHALL be loaded lazily via dynamic `import()` only when that
provider type is instantiated. The Anthropic direct-browser-access header SHALL
be emitted only when `options.browser` is true — never hardcoded — so Node
consumers get standard headers.

#### Scenario: Browser flag controls the Anthropic header

- **GIVEN** an `anthropic` credential
- **WHEN** `createLanguageModel` is called with `options.browser: true`
- **THEN** the created provider SHALL include the `anthropic-dangerous-direct-browser-access` header, and a call without the flag SHALL NOT include it

#### Scenario: Only the selected provider's SDK loads

- **WHEN** `createLanguageModel` is called for a `google` credential
- **THEN** only `@ai-sdk/google` SHALL be dynamically imported; the other provider SDKs SHALL NOT load

### Requirement: Purpose→model resolution owned by @kaiord/ai

`@kaiord/ai/providers` SHALL export `resolveModelForPurpose(purpose, providers, bindings)`
and the supporting types (`ProviderCredential`, `LlmProviderType`,
`AiModelPurpose`, `AiModelBinding`, `ResolvedModel`). `AiModelPurpose` SHALL be
the open union `"default" | "chat" | "workout_generation" | (string & {})` so
future purposes need no type change in `@kaiord/ai`. Resolution semantics are
defined by `spa-ai-model-selection` and SHALL NOT change in this move.

#### Scenario: SPA resolves through the package export

- **WHEN** any SPA AI feature resolves its provider and model
- **THEN** it SHALL call `resolveModelForPurpose` imported from `@kaiord/ai/providers`, and no copy of the resolution algorithm SHALL remain in the SPA source

#### Scenario: Unknown purpose strings typecheck

- **WHEN** a consumer passes a future purpose string (e.g. `"lab_extraction"`) not in the literal union
- **THEN** the call SHALL typecheck via the open union and resolve through the standard binding order

### Requirement: Model catalog machinery colocated with the SDKs

The model-catalog machinery SHALL live wholly in `packages/ai`: the generator,
the type-union extractor, the freshness test, and the generated catalog output,
with the `generate:model-catalog` script owned by `packages/ai`. No catalog
artifact or `@ai-sdk/*` type extraction SHALL remain in the SPA.

#### Scenario: Regeneration is self-contained

- **WHEN** `pnpm generate:model-catalog` runs in `packages/ai`
- **THEN** it SHALL regenerate the committed catalog from the pinned `@ai-sdk/*` packages without reading or writing any other package's sources

#### Scenario: Freshness guard runs where the catalog lives

- **GIVEN** the committed catalog no longer matches regeneration against the pinned SDKs
- **WHEN** the `packages/ai` test suite runs
- **THEN** the relocated freshness test SHALL fail and report the drift

### Requirement: Optional provider peer dependencies

`packages/ai/package.json` SHALL declare `@ai-sdk/anthropic`, `@ai-sdk/openai`,
and `@ai-sdk/google` as `peerDependencies` marked optional via
`peerDependenciesMeta`, and as `devDependencies` for its own typecheck. A
consumer that never instantiates a given provider SHALL NOT need that provider's
SDK installed.

#### Scenario: Install without provider SDKs is clean

- **WHEN** a Node consumer installs `@kaiord/ai` without any `@ai-sdk/*` package
- **THEN** the install SHALL complete without unmet-peer warnings for the optional peers

### Requirement: Subpath exports preserve module identity

`@kaiord/ai` SHALL publish `./providers` (and sibling subpaths) via its
`exports` map with `import` and `types` conditions, built with code-splitting
enabled so that internal modules shared between entries resolve to a single
module instance.

#### Scenario: Cross-subpath identity holds

- **WHEN** the same internal module is reached through two different subpath entries in one process
- **THEN** both references SHALL be the identical module instance (verified by the identity smoke test)

### Requirement: @ai-sdk containment guard

The repository SHALL contain `scripts/check-ai-sdk-containment.mjs`, tested by
a co-located `node:test` suite and executed as part of `pnpm test:scripts`,
that rejects any `@ai-sdk/*` import declaration in `packages/*/src/**` outside
`packages/ai`. Build-configuration references (package manifests, bundler alias
strings) are out of the guard's scope.

#### Scenario: SPA source import is rejected

- **GIVEN** a file under `packages/workout-spa-editor/src/` containing `import { createOpenAI } from "@ai-sdk/openai"`
- **WHEN** the guard runs
- **THEN** it SHALL exit non-zero naming the offending file

#### Scenario: packages/ai imports are allowed

- **GIVEN** a file under `packages/ai/src/` importing `@ai-sdk/google`
- **WHEN** the guard runs
- **THEN** it SHALL pass
