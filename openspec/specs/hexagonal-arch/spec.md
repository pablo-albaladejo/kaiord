> Synced: 2026-04-20

# Hexagonal Architecture

## Purpose

Hexagonal (ports-and-adapters) layer structure and dependency rules that every package in the monorepo MUST follow so the domain layer stays pure and adapters stay swappable.

## Requirements

### Requirement: Layer Hierarchy

The dependency graph SHALL be: `domain` ← `ports` ← `application` ← `adapters`. No layer MAY import from a layer to its right.

#### Scenario: Upstream import blocked

- **GIVEN** an edit that makes `packages/core/src/domain/` import from `packages/core/src/application/`
- **WHEN** the pre-commit architecture check runs
- **THEN** the commit is rejected with an error pointing to the offending import

### Requirement: Domain Purity

Code in `packages/core/src/domain/` SHALL NOT import from:

- `adapters/`
- `application/`
- Any external library (e.g., `@garmin/fitsdk`, `fast-xml-parser`)

Domain contains only pure TypeScript types and Zod schemas.

#### Scenario: Domain import violation blocked

- **GIVEN** an edit to a file in `packages/core/src/domain/`
- **WHEN** the file contains `import { X } from '../adapters/...'`
- **THEN** the `check-architecture.js` hook blocks the edit with exit code 2

### Requirement: Application Isolation

Code in `packages/core/src/application/` SHALL NOT import from:

- `adapters/`
- Any external library

Application contains use cases that depend only on domain types and port interfaces.

#### Scenario: Application import violation blocked

- **GIVEN** an edit to a file in `packages/core/src/application/`
- **WHEN** the file contains `import { X } from '@garmin/fitsdk'`
- **THEN** the `check-architecture.js` hook blocks the edit

### Requirement: Port Contracts

Code in `packages/core/src/ports/` SHALL define pure type aliases or interfaces. Ports MUST depend only on domain types. Ports MUST NOT contain implementation logic.

#### Scenario: Port file contains only type declarations

- **GIVEN** any file under `packages/core/src/ports/`
- **WHEN** its AST is inspected
- **THEN** it contains only `type`, `interface`, or re-export statements — no runtime code

### Requirement: Adapter Freedom

Adapter packages (`@kaiord/fit`, `@kaiord/tcx`, `@kaiord/zwo`, `@kaiord/garmin`) MAY import external libraries. They SHALL depend on `@kaiord/core` (ports + domain) only, never on other adapter packages.

#### Scenario: Adapter imports another adapter

- **GIVEN** an edit to `packages/fit/src/` that imports from `@kaiord/tcx`
- **WHEN** the architecture check runs
- **THEN** the check fails and the violation is reported

### Requirement: Strategy Injection

Format conversion SHALL use the strategy pattern. Core use cases (`fromBinary`, `fromText`, `toBinary`, `toText`) accept reader/writer functions as parameters. They MUST NOT hard-code any specific adapter.

#### Scenario: Strategy injection in use case

- **GIVEN** a call to `fromBinary(buffer, fitReader)`
- **WHEN** the reader is swapped to a different adapter
- **THEN** the core use case works identically without code changes

### Requirement: Package Dependencies

Each package SHALL respect the following dependency rules:

| Package                                                       | Allowed Dependencies                                            |
| ------------------------------------------------------------- | --------------------------------------------------------------- |
| `@kaiord/core`                                                | No workspace deps (root of the graph)                           |
| `@kaiord/fit`, `@kaiord/tcx`, `@kaiord/zwo`, `@kaiord/garmin` | `@kaiord/core` only                                             |
| `@kaiord/garmin-connect`                                      | `@kaiord/core`, `@kaiord/garmin`                                |
| `@kaiord/ai`                                                  | `@kaiord/core` only (+ `ai` as peer dependency)                 |
| `@kaiord/mcp`                                                 | `@kaiord/core` + all format adapters + `@kaiord/garmin-connect` |
| `@kaiord/cli`                                                 | `@kaiord/core` + all adapters + `@kaiord/garmin-connect`        |

#### Scenario: Core declares no workspace dependencies

- **GIVEN** `packages/core/package.json`
- **WHEN** its `dependencies` block is inspected
- **THEN** no `@kaiord/*` workspace package appears
