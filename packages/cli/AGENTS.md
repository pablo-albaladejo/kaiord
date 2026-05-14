<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# @kaiord/cli AGENTS.md

Command-line interface for Kaiord workout file conversion. Wires format adapters into core strategy functions and provides a user-facing CLI with commands for convert, validate, diff, inspect, extract, and Garmin integration.

## Purpose

**What lives here:** CLI entrypoint (`bin/`), command implementations, utilities for file I/O, error handling, logging, and configuration management.

**Core responsibility:** Orchestrate user input → core conversion pipeline → filesystem output. Handle CLI ergonomics (verbosity, output formats, batch processing, glob patterns).

**Dependency direction:** Depends on `@kaiord/core`, format adapters (`@kaiord/fit`, `@kaiord/tcx`, `@kaiord/zwo`, `@kaiord/garmin`), and `@kaiord/garmin-connect` for auth workflows.

## Key Files

- `src/bin/kaiord.ts` — CLI entry point, yargs setup, error handling, exit codes
- `src/bin/register-commands.ts` — Command registration dispatch
- `src/commands/` — Modular command implementations (convert, validate, diff, inspect, extract, garmin)
- `src/utils/` — Shared utilities: format detection, error formatting, config loading, logging, file handling
- `src/adapters/logger/` — Pretty and structured logger implementations
- `src/types/plugin.ts` — Plugin system interfaces (future extensibility)
- `docs/` — Plugin architecture, publish verification, examples
- `README.md` — User-facing CLI documentation

## Subdirectories

- **`src/bin/`** — Bootstrap and command registration
- **`src/commands/`** — Command implementations (one per major command)
  - `convert/` — Single-file and batch conversion with format detection
  - `validate/` — Round-trip validation with custom tolerances
  - `diff/` — File comparison and step-by-step analysis
  - `inspect/` — KRD introspection (metadata, summary, JSON output)
  - `extract-workout/` — Workout extraction from KRD
  - `garmin/` — Garmin Connect integration (login, logout, list, push)
- **`src/adapters/logger/`** — Logger adapters (pretty terminal, structured JSON)
- **`src/utils/`** — Shared utilities (format detection, error handling, file I/O, config, logging)
- **`src/types/`** — Type definitions (plugin system interfaces)
- **`src/tests/`** — Test utilities and smoke tests
- **`docs/`** — Architecture docs (plugin system, publish verification)

## For AI Agents: Working in This Directory

### Key Concepts

1. **Command pattern**: Each command is registered in `register-commands.ts` with yargs config (`yargs-config.ts`) that defines CLI args, then delegates to an `index.ts` handler
2. **Logger factory**: All commands use `createLogger()` which auto-detects pretty vs. structured based on CI environment
3. **Config merging**: CLI args override `.kaiordrc.json` config file (searched in cwd and home)
4. **Batch detection**: Convert command detects glob patterns (`*`, `?`) to route to batch vs. single-file handler
5. **Error exit codes**: `ExitCode` enum (0=success, 1=error, 2=tolerance exceeded, 3=diff found) and `getExitCodeForError()` mapper
6. **Format detection**: Infer format from file extension; override with `--input-format` / `--output-format`

### File Size Limits & Structure

- Target: Files under 100 lines (tests exempt)
- Commands typically: main entry ~40 LOC, modular sub-functions per concern
- Utilities: Pure functions, no side effects except logging/I/O

### Testing Requirements

- **Unit tests**: Pure function utilities (format detector, config loader, error formatting)
- **Integration tests**: Command end-to-end with fixtures (convert, validate, diff, inspect, extract)
- **Smoke tests**: CLI binary behavior (`.test.ts` files in `src/tests/cli-smoke.test.ts`)
- **Fixtures**: Use `src/tests/helpers/fixture-paths.ts` to locate test data
- **Test conventions**: Every `it()` title starts with `"should "`, bodies contain `// Arrange`, `// Act`, `// Assert`

### Common Patterns

**Command handler pattern:**

```typescript
export const myCommand = async (options: MyOptions): Promise<number> => {
  // 1. Load config, merge with CLI args, validate schema
  const config = await loadConfigWithMetadata();
  const opts = myOptionsSchema.parse(mergeWithConfig(options, config.config));

  // 2. Create logger
  const logger = await createLogger({
    type: opts.logFormat,
    level: opts.verbose ? "debug" : "info",
  });

  // 3. Optional spinner for user feedback
  let spinner = ora("Working...").start();

  try {
    // 4. Perform work
    const result = await doWork(opts, logger);

    spinner?.succeed("Done");

    // 5. Format and output
    if (opts.json) {
      console.log(JSON.stringify(result));
    } else {
      console.log(formatResult(result));
    }

    return ExitCode.SUCCESS;
  } catch (error) {
    spinner?.fail("Failed");
    logger.error("Failed", { error });
    const formatted = formatError(error, { json: opts.json });
    console.error(formatted);
    return mapErrorToExitCode(error);
  } finally {
    spinner?.stop();
  }
};
```

**Batch vs. single-file routing:**

```typescript
const isBatchMode = (input: string): boolean =>
  input.includes("*") || input.includes("?");
if (isBatchMode(validated.input)) {
  return await executeBatchConversion(validated, logger);
} else {
  await executeSingleFileConversion(validated, logger);
}
```

**Error formatting:**

- Use `formatError(error, { json: boolean })` for user output
- Use `getExitCodeForError(error)` to map errors to exit codes
- Pretty errors go to stderr, JSON errors to stdout (when `--json` flag)

## Dependencies

### Internal (`@kaiord/*` workspace)

- `@kaiord/core` — Core conversion functions, KRD types, logger interface
- `@kaiord/fit` — FIT format reader/writer
- `@kaiord/tcx` — TCX format reader/writer
- `@kaiord/zwo` — ZWO format reader/writer
- `@kaiord/garmin` — GCN format adapter
- `@kaiord/garmin-connect` — Garmin Connect API client (auth, push/list)

### External

- **yargs** — CLI argument parsing and command registration
- **chalk** — Terminal color output
- **ora** — Spinners and progress indicators
- **winston** — Structured logging (for structured logger adapter)
- **zod** — Runtime schema validation (CLI options, config files)
- **glob** — File glob pattern matching for batch operations
- **fast-xml-parser** — (via adapters) XML parsing for TCX/ZWO

## MANUAL

Non-generated files beyond the AI agent's responsibility:

- `README.md` — User documentation (command examples, config, installation)
- `.kaiordrc.example.json` — Configuration file template
- `tsup.config.ts`, `vitest.config.ts`, `tsconfig.json` — Build and test config
- `package.json` — npm metadata and dependencies
- `CHANGELOG.md` — Version history
