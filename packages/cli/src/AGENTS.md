<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# src/AGENTS.md

Source code for the Kaiord CLI. Organized by command (bin, commands), adapters, utilities, and types.

## Purpose

**What lives here:** All TypeScript source code for the CLI. Entry point is `bin/kaiord.ts`, which registers commands and delegates to implementations in `commands/`.

## Structure

- **`bin/`** — CLI bootstrap and command registration
- **`commands/`** — Command implementations (convert, validate, diff, inspect, extract, garmin)
- **`adapters/`** — Logger adapters (pretty, structured)
- **`utils/`** — Shared utilities (format detection, config, error handling, file I/O, logging)
- **`types/`** — TypeScript type definitions (plugin system)
- **`tests/`** — Test fixtures, helpers, and smoke tests

## For AI Agents

Each subdirectory has its own AGENTS.md. Start there for specific implementation details.

**Quick reference:**

- Add a new command? Create `src/commands/mycommand/` with `index.ts`, `yargs-config.ts`, `types.ts`
- Refactor utilities? Keep under 100 lines, use pure functions, test with `.test.ts`
- Add a logger? Implement `Logger` interface from `@kaiord/core`, register in factory
- Understand flow? CLI entrypoint → register-commands → command handler → yargs parsing
