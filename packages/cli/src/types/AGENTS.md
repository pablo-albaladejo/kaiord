<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# src/types/AGENTS.md

Type definitions and interfaces for the CLI.

## Purpose

**What lives here:** Shared TypeScript types, interfaces, and protocols that multiple modules depend on.

Currently: no shared types live here. The planned plugin system (see `docs/plugin-architecture.md`) is design-only; `src/types/plugin.ts` does not exist.

## Key Files

None yet.

## For AI Agents: Working in This Directory

### When to Add Types Here

- Shared across 3+ modules
- Part of a protocol or interface contract
- Plugin system or extensibility concerns
- Configuration schemas

### When to Keep Types Local

- Used by single command or utility
- Command-specific options (keep in `src/commands/mycommand/types.ts`)
- Utility-specific schemas (keep in `src/utils/my-util.ts` as Zod schema)

### Adding New Types

1. Create a focused `.ts` file in `src/types/`
2. Export types, not implementations
3. Document with JSDoc comments
4. Keep definitions under 100 lines
5. Link from parent AGENTS.md

## Testing

- Types are validated by TypeScript compiler (no runtime tests needed)

## Dependencies

- `@kaiord/core` — Core types (KRD, Logger, etc.)

## Code Limits

- Per file: Under 200 lines (types only, no implementation)
- Keep type definitions focused and well-documented
