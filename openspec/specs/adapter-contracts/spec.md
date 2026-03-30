> Synced: 2026-03-30

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

The factory accepts an optional `Logger` parameter. Adapters that require additional configuration (e.g., `@kaiord/garmin`) MAY accept an options object as an alternative to a plain `Logger`. When an options object is accepted, the `Logger` form SHALL remain supported for backward compatibility.

### Requirement: Garmin Writer Options

The `createGarminWriter` factory SHALL accept either a `Logger` or a `GarminWriterOptions` object:

- `GarminWriterOptions.logger` (Logger, optional): Custom logger
- `GarminWriterOptions.paceZones` (PaceZoneTable, optional): Pace zone lookup table for resolving pace zone references to m/s ranges

The `PaceZoneTable` type is an array of `PaceZoneEntry` objects, each with `zone` (number), `minMps` (number), and `maxMps` (number) fields.

### Requirement: No Use-Case Orchestration in Adapters

Format adapter packages SHALL NOT import or invoke core use-case functions (`toText`, `fromText`, `toBinary`, `fromBinary`) or domain converters (e.g., `createWorkoutKRD`). Adapters implement port interfaces only. Composing KRD creation with format conversion is the consumer's responsibility.

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

The AI adapter (`@kaiord/ai`) SHALL export a `createTextToWorkout` factory that accepts a `TextToWorkoutConfig` object containing a required `model` (LanguageModel, provider-agnostic via Vercel AI SDK) and optional `logger`, `maxRetries`, `maxOutputTokens`, and `temperature` fields. No pre-built singleton is exported because `model` has no sensible default. The factory returns a function `(text: string, options?: TextToWorkoutOptions) => Promise<Workout>`. It SHALL depend on `@kaiord/core` only with `ai` as a peer dependency.

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
- **WHEN** they invoke the returned function with a natural language description and optional `TextToWorkoutOptions` (sport, name)
- **THEN** the AI adapter returns a validated `Workout` object using the injected LLM model, with automatic retry on parse failure

#### Scenario: Garmin writer with pace zones

- **GIVEN** a consumer calls `createGarminWriter({ paceZones })` with a `PaceZoneTable`
- **WHEN** a KRD workout containing pace zone references is written
- **THEN** the writer resolves zone numbers to m/s ranges in the GCN output

#### Scenario: Garmin Connect API client

- **GIVEN** a consumer calls `createGarminConnectClient()` from `@kaiord/garmin-connect`
- **WHEN** they authenticate and push a KRD workout
- **THEN** the client handles SSO login and returns a `PushResult` with Garmin Connect URL
