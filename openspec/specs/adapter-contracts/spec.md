> Synced: 2026-03-06

# Adapter Contracts

Adapters implement port interfaces to convert between external formats and KRD, or provide API/protocol integration.

## Requirements

### Requirement: Format Adapter Port Types

Format adapters SHALL implement one or more of these port types from `packages/core/src/ports/format-strategy.ts`:
- `BinaryReader`: `(buffer: Uint8Array) => Promise<KRD>`
- `TextReader`: `(text: string) => Promise<KRD>`
- `BinaryWriter`: `(krd: KRD) => Promise<Uint8Array>`
- `TextWriter`: `(krd: KRD) => Promise<string>`

### Requirement: Dual Exports

Each format adapter package SHALL provide two export styles:
- **Pre-built instance**: `import { fitReader } from '@kaiord/fit'`
- **Factory function**: `import { createFitReader } from '@kaiord/fit'`

The factory accepts an optional `Logger` parameter.

### Requirement: File Naming

- Mappers (`*.mapper.ts`): Simple data transformation, no business logic, no tests required
- Converters (`*.converter.ts`): Complex logic with conditionals, tests required

### Requirement: Schema Conventions

- KRD field names use **camelCase** (e.g., `serialNumber`, `heartRate`)
- Domain enum values use **snake_case** (e.g., `indoor_cycling`, `lap_swimming`)
- Adapter-internal schemas MAY use any convention but MUST map correctly to KRD

### Requirement: No Cross-Adapter Dependencies

Format adapter packages SHALL NOT import from other adapter packages. All inter-format communication goes through KRD via core use cases.

### Requirement: API Adapter Pattern

API adapters (e.g., `@kaiord/garmin-connect`) SHALL export factory functions for clients, auth providers, and token stores. They SHALL depend on `@kaiord/core` only and SHALL NOT import format adapters.

### Requirement: LLM Adapter Pattern

The AI adapter (`@kaiord/ai`) SHALL export factory functions that accept a `LanguageModel` parameter (provider-agnostic via Vercel AI SDK). It SHALL depend on `@kaiord/core` only with `ai` as a peer dependency.

## Scenarios

#### Scenario: FIT adapter dual export

- **GIVEN** a consumer imports `fitReader` from `@kaiord/fit`
- **WHEN** they call `fromBinary(buffer, fitReader)`
- **THEN** the FIT buffer is converted to a valid KRD object

#### Scenario: Factory with custom logger

- **GIVEN** a consumer calls `createFitReader(customLogger)`
- **WHEN** the reader processes a FIT file
- **THEN** all log output goes through the custom logger

#### Scenario: Mapper vs converter naming

- **GIVEN** a new file that maps Garmin sport enums to KRD sport enums
- **WHEN** the mapping is a simple lookup table with no conditionals
- **THEN** the file is named `sport.mapper.ts` and has no test file

#### Scenario: Converter requires tests

- **GIVEN** a new file that converts FIT workout steps to KRD steps
- **WHEN** the conversion involves conditional logic or data transformation
- **THEN** the file is named `step.converter.ts` and has a corresponding `step.converter.test.ts`

#### Scenario: AI adapter text-to-workout

- **GIVEN** a consumer calls `createTextToWorkout({ model })` from `@kaiord/ai`
- **WHEN** they pass a natural language description
- **THEN** the AI adapter returns a validated `Workout` object using the injected LLM model

#### Scenario: Garmin Connect API client

- **GIVEN** a consumer calls `createGarminConnectClient()` from `@kaiord/garmin-connect`
- **WHEN** they authenticate and push a KRD workout
- **THEN** the client handles SSO login and returns a `PushResult` with Garmin Connect URL
