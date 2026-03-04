# Adapter Contracts

Adapters implement port interfaces to convert between external formats and KRD.

## Requirements

### Requirement: Port Types

All adapters SHALL implement one or more of these port types from `packages/core/src/ports/format-strategy.ts`:

- `BinaryReader`: `(buffer: Uint8Array) => Promise<KRD>`
- `TextReader`: `(text: string) => Promise<KRD>`
- `BinaryWriter`: `(krd: KRD) => Promise<Uint8Array>`
- `TextWriter`: `(krd: KRD) => Promise<string>`

### Requirement: Dual Exports

Each adapter package SHALL provide two export styles:

- **Pre-built instance**: `import { fitReader } from '@kaiord/fit'`
- **Factory function**: `import { createFitReader } from '@kaiord/fit'`

The factory accepts an optional `Logger` parameter.

### Requirement: File Naming

- Mappers (`*.mapper.ts`): Simple data transformation, no business logic, no tests required
- Converters (`*.converter.ts`): Complex logic with conditionals, tests required

### Requirement: Schema Conventions

- Adapter-internal schemas SHALL use **camelCase** (e.g., `indoorCycling`)
- When mapping to/from KRD, adapters MUST convert to/from **snake_case** (e.g., `indoor_cycling`)

### Requirement: No Cross-Adapter Dependencies

Adapter packages SHALL NOT import from other adapter packages. All inter-format communication goes through KRD via core use cases.

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
