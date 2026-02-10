# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kaiord is an open-source health & fitness data framework. A TypeScript monorepo for creating, converting, and managing data across FIT, TCX, ZWO, GCN, and KRD formats.

**Packages:**

- `@kaiord/core` - Domain types, schemas, ports, use cases (no adapter implementations)
- `@kaiord/fit` - FIT format adapter (Garmin FIT SDK)
- `@kaiord/tcx` - TCX format adapter (fast-xml-parser)
- `@kaiord/zwo` - ZWO format adapter (fast-xml-parser, XSD validation)
- `@kaiord/garmin` - Garmin Connect API (GCN) format adapter
- `@kaiord/cli` - Command-line interface
- `@kaiord/workout-spa-editor` - React web application (private)

## Commands

```bash
# Install and build
pnpm install
pnpm -r build

# Test
pnpm -r test                    # All tests
pnpm -r test:watch              # Watch mode
cd packages/core && pnpm test   # Single package

# Lint and format
pnpm lint                       # Lint + type check + format check
pnpm lint:fix                   # Auto-fix all
pnpm format                     # Format with Prettier

# Changesets (for version-worthy changes)
pnpm exec changeset             # Create changeset before PR

# NPM optimization (Claude Code skills)
/check-deps                     # Analyze dependencies (unused, duplicates, security)
/analyze-bundle                 # Check bundle sizes and optimization opportunities
/optimize-imports               # Refactor imports for better tree-shaking
```

## Quality Standards

**CRITICAL: Zero Tolerance for Warnings and Errors**

When working on this codebase, ALL problems must be fixed, regardless of whether they were introduced in the current branch or pre-existing:

- ✅ **Zero ESLint warnings** - All linting rules must pass
- ✅ **Zero TypeScript errors** - Strict type checking with no `any` escapes
- ✅ **Zero test warnings** - Clean test output (React act(), accessibility, etc.)
- ✅ **Zero build warnings** - Vite, ESBuild, etc. must produce clean output
- ✅ **Coverage thresholds met** - 80% for core packages, 70% for frontend
- ✅ **All tests passing** - 100% pass rate across all packages

If you encounter warnings or errors during your work:

1. **Fix them immediately** - Don't defer or document for later
2. **Fix pre-existing issues** - Clean up technical debt proactively
3. **Leave the codebase cleaner** - Boy Scout Rule applies

This policy ensures professional code quality and prevents warning/error accumulation.

## Architecture (Hexagonal + Plugin)

```
packages/
├── core/src/
│   ├── domain/           # Pure types & Zod schemas (no dependencies)
│   ├── application/      # Use cases, provider types (depends only on ports)
│   ├── ports/            # I/O contracts (interfaces)
│   └── adapters/logger/  # Console logger only
├── fit/src/adapters/     # FIT reader/writer implementations
├── tcx/src/adapters/     # TCX reader/writer/validator implementations
├── zwo/src/adapters/     # ZWO reader/writer/validator implementations
├── all/src/              # Meta-package wiring all adapters
└── cli/src/              # CLI commands
```

**Critical rules:**

- `domain` depends on nothing
- `application` MUST NOT import external libs or adapters
- Adapter packages (`fit`, `tcx`, `zwo`) depend on `core` only
- Strategy pattern: readers/writers injected into generic core functions
- KRD is the canonical format; all conversions go through KRD

## Public API

```typescript
// Core: format-agnostic conversion with strategy injection
fromBinary(buffer: Uint8Array, reader: BinaryReader, logger?: Logger): Promise<KRD>
fromText(text: string, reader: TextReader, logger?: Logger): Promise<KRD>
toBinary(krd: KRD, writer: BinaryWriter, logger?: Logger): Promise<Uint8Array>
toText(krd: KRD, writer: TextWriter, logger?: Logger): Promise<string>

// Adapters: dual exports (pre-built + factory)
import { fitReader } from '@kaiord/fit';        // pre-built
import { createFitReader } from '@kaiord/fit';   // factory(logger?)
```

## Language

**All code, comments, documentation, commit messages, and AI-generated content MUST be in English**, regardless of the language the user communicates in. This includes:

- Code comments and documentation
- Commit messages and PR descriptions
- Changeset descriptions
- Error messages and logs
- AI agent responses and plans

## Code Style

- **TypeScript strict mode** - No implicit `any`
- **Max 100 lines per file** (tests exempt)
- **Max 40 lines per function** (60 for React components)
- **Use `type` not `interface`**
- **Separate type imports**: `import type { X } from "..."`
- **Functions over classes** - Factory functions (`createValidator()`) preferred

**Schema conventions:**

- Domain schemas use **snake_case**: `indoor_cycling`, `lap_swimming`
- Adapter schemas use **camelCase**: `indoorCycling`, `lapSwimming`
- Access enum values via `.enum`: `subSportSchema.enum.indoor_cycling`

**File naming:**

- Files: `kebab-case.ts`
- Mappers: `*.mapper.ts` (simple transformation, no logic, no tests)
- Converters: `*.converter.ts` (complex logic, requires tests)

## Testing

- **AAA pattern**: Arrange, Act, Assert (with blank lines between)
- **Round-trip tolerances**: time ±1s, power ±1W or ±1%FTP, HR ±1bpm, cadence ±1rpm
- **Coverage**: 80% for core, 70% for frontend
- Test utilities: `@kaiord/core/test-utils` exports fixture loaders

**Test types:**

- Unit tests for pure functions
- Integration tests for conversion pipelines
- Round-trip tests (FIT ↔ KRD ↔ TCX)
- CLI smoke: `kaiord convert --in sample.krd --out out.tcx`

## Contribution Flow

1. Create feature branch: `feature/my-feature`, `fix/my-fix`
2. Implement following hexagonal architecture
3. Add tests (follow AAA pattern)
4. Run: `pnpm -r test && pnpm -r build && pnpm lint:fix`
5. Add changeset: `pnpm exec changeset` (for features/fixes)
6. Commit: `feat(scope): description` (conventional commits)

## Key References

- `AGENTS.md` - Strict AI guidance (non-negotiables)
- `docs/` - Architecture docs, code style, testing strategies
- `docs/krd-format.md` - KRD format specification
