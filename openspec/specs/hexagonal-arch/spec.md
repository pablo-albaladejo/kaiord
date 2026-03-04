# Hexagonal Architecture

The project follows hexagonal (ports-and-adapters) architecture with strict layer dependency rules.

## Requirements

### Requirement: Layer Hierarchy

The dependency graph SHALL be: `domain` ← `ports` ← `application` ← `adapters`. No layer MAY import from a layer to its right.

### Requirement: Domain Purity

Code in `packages/core/src/domain/` SHALL NOT import from:
- `adapters/`
- `application/`
- Any external library (e.g., `@garmin/fitsdk`, `fast-xml-parser`)

Domain contains only pure TypeScript types and Zod schemas.

### Requirement: Application Isolation

Code in `packages/core/src/application/` SHALL NOT import from:
- `adapters/`
- Any external library

Application contains use cases that depend only on domain types and port interfaces.

### Requirement: Port Contracts

Code in `packages/core/src/ports/` SHALL define pure type aliases or interfaces. Ports MUST depend only on domain types. Ports MUST NOT contain implementation logic.

### Requirement: Adapter Freedom

Adapter packages (`@kaiord/fit`, `@kaiord/tcx`, `@kaiord/zwo`, `@kaiord/garmin`) MAY import external libraries. They SHALL depend on `@kaiord/core` (ports + domain) only, never on other adapter packages.

### Requirement: Strategy Injection

Format conversion SHALL use the strategy pattern. Core use cases (`fromBinary`, `fromText`, `toBinary`, `toText`) accept reader/writer functions as parameters. They MUST NOT hard-code any specific adapter.

## Scenarios

#### Scenario: Domain import violation blocked

- **GIVEN** an edit to a file in `packages/core/src/domain/`
- **WHEN** the file contains `import { X } from '../adapters/...'`
- **THEN** the `check-architecture.js` hook blocks the edit with exit code 2

#### Scenario: Application import violation blocked

- **GIVEN** an edit to a file in `packages/core/src/application/`
- **WHEN** the file contains `import { X } from '@garmin/fitsdk'`
- **THEN** the `check-architecture.js` hook blocks the edit

#### Scenario: Adapter cross-dependency prevented

- **GIVEN** a file in `packages/fit/src/`
- **WHEN** it tries to import from `@kaiord/tcx`
- **THEN** the dependency cruiser (`pnpm arch:check`) reports a violation

#### Scenario: Strategy injection in use case

- **GIVEN** a call to `fromBinary(buffer, fitReader)`
- **WHEN** the reader is swapped to a different adapter
- **THEN** the core use case works identically without code changes
