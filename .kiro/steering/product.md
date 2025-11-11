# Overview

**Kaiord** is an open-source toolkit for structured workout data. It provides a unified JSON-based format (**.krd**) and conversion tools for popular fitness file formats (**FIT**, **TCX**, **PWX**).

## Packages

- **@kaiord/core** — TypeScript library for reading/writing workouts
- **@kaiord/cli** — Command-line tool for converting between formats

## Tech Stack

- **Language**: TypeScript (strict mode)
- **Packages**: pnpm workspaces
- **Build**: tsup
- **Tests**: Vitest
- **Validation**: AJV (JSON Schema)
- **CLI**: yargs

## Common Commands

```bash
pnpm install          # Install dependencies
pnpm -r build         # Build all packages
pnpm -r test          # Run tests across all packages
pnpm kaiord --help    # CLI help
```

## Project Structure

```
kaiord/
├─ packages/
│  ├─ core/          # @kaiord/core - Domain, application, ports, adapters
│  └─ cli/           # @kaiord/cli - Command-line interface
├─ .kiro/            # Kiro configuration (steering, specs, hooks)
├─ LICENSE           # MIT License
└─ pnpm-workspace.yaml
```

## Core Principles

- **Round-trip safety** between all supported formats
- **Schema validation** with AJV for consistent data contracts
- **Hexagonal architecture** with clear ports/adapters separation
- **Spec-driven development** with Kiro
