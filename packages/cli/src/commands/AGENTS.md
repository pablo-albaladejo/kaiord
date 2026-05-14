<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# src/commands/AGENTS.md

Command implementations for the Kaiord CLI.

## Purpose

**What lives here:** Each major command (convert, validate, diff, inspect, extract, garmin) has its own subdirectory with modular implementation.

**Pattern:** Each command has:

- `index.ts` — Main command handler, returns exit code
- `yargs-config.ts` — yargs command metadata (command name, description, argument definitions, handler wrapper)
- `types.ts` — Zod schemas for command options validation
- Supporting files — Specific logic split by concern (batch handlers, formatters, executors, error handlers)

## Commands Overview

### convert

Converts workout files between FIT, KRD, TCX, ZWO formats. Supports single-file and batch (glob pattern) conversion.

**Entry:** `convert/index.ts` → `convertCommand(options)`
**Features:**

- Auto-detect format from file extension, override with `--input-format`, `--output-format`
- Batch mode: glob patterns (`*`, `?`) → multiple files
- Single-file mode: one input, one output
- Config defaults: `defaultInputFormat`, `defaultOutputFormat`, `defaultOutputDir`
- Utilities: `batch.ts` (parallel glob and convert), `single-file.ts` (one file), `batch-output.ts` (progress reporting)

### validate

Validates round-trip conversion integrity with custom tolerances.

**Entry:** `validate/index.ts` → `validateCommand(options)`
**Features:**

- Load file → convert to KRD → convert back to original format → compare tolerances
- Custom tolerance config: `--tolerance-config` JSON file or defaults
- Tolerance fields: `time`, `power`, `heartRate`, `cadence` (absolute/percentage)
- Output: Summary with violations or pass message
- Utilities: `execute-validation.ts` (round-trip logic), `format-results.ts` (output formatting), `handle-error.ts` (error mapping)

### diff

Compares two workout files step-by-step and reports differences.

**Entry:** `diff/index.ts` → `diffCommand(options)`
**Features:**

- Load two files, convert to KRD, compare step by step
- Output: Identical/different status, field-by-field diff if different
- Utilities: `comparators.ts` (comparison logic), `compare-steps.ts` (step records), `formatter.ts` (output), `diff-executor.ts` (orchestration)

### inspect

Introspects a workout file (metadata, summary, or full JSON output).

**Entry:** `inspect/index.ts` → `inspectCommand(options)`
**Features:**

- Load file, convert to KRD
- Output: Summary (human-readable) or full JSON
- Utilities: `build-summary.ts` (text summary), `handle-error.ts` (error mapping)

### extract-workout

Extracts a single `Workout` from a KRD multi-record file.

**Entry:** `extract-workout/index.ts` → `extractWorkoutCommand(options)`
**Features:**

- Load file, call `extractWorkout()` from `@kaiord/core`
- Output: JSON workout object
- Utilities: `handle-error.ts` (error mapping)

### garmin

Garmin Connect integration: login, logout, list, push (upload).

**Entry:** `garmin/index.ts` exports all subcommands
**Subcommands:**

- `login.ts` — SSO auth flow, save session to config
- `logout.ts` — Clear auth session from config
- `list.ts` — List user's Garmin Connect workouts
- `push.ts` — Upload converted workout to Garmin Connect
- `client-factory.ts` — Creates authenticated Garmin client
- `yargs-subcommands.ts` — Registers nested garmin subcommands

## For AI Agents: Working in This Directory

### Command Handler Pattern

```typescript
// 1. Validate options and load config
const opts = myOptionsSchema.parse(mergeWithConfig(options, config));
const logger = await createLogger({ type: opts.logFormat, level: ... });

// 2. Perform work (with optional spinner)
const spinner = ora("Working...").start();
try {
  const result = await doWork(opts, logger);
  spinner?.succeed("Done");

  // 3. Format output
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
```

### File Organization

- Keep `index.ts` to ~40 lines (handler only)
- Extract logic to separate files: `*-executor.ts`, `*-formatter.ts`, `*-handler.ts`
- Put validation in `yargs-config.ts` builder function
- Define CLI options schema in `types.ts`

### Adding a New Command

1. Create `src/commands/mycommand/` directory
2. Create `types.ts` with `myCommandOptionsSchema` (Zod)
3. Create `yargs-config.ts` with metadata, builder, and handler wrapper
4. Create `index.ts` with `myCommand()` handler function
5. Create supporting files for major logic (executor, formatter, error handler)
6. Register in `src/bin/register-commands.ts`
7. Add tests: `mycommand-integration.test.ts`
8. Document in README.md

### Testing

- Integration tests: `*-integration.test.ts` test end-to-end behavior
- Test fixtures: `src/tests/fixtures/` contains sample files
- Test helpers: `src/tests/helpers/fixture-paths.ts`, `cli-test-utils.ts`
- Mock logger for tests, verify exit codes and output

## Dependencies

- `@kaiord/core` — KRD types, conversion functions
- `@kaiord/fit`, `@kaiord/tcx`, `@kaiord/zwo`, `@kaiord/garmin` — Format adapters
- `@kaiord/garmin-connect` — Garmin auth/API client (for garmin subcommand)
- `yargs` — CLI argument parsing
- `ora` — Spinners
- `zod` — Schema validation

## Code Limits

- `index.ts`: ~40 LOC (handler entry point)
- Supporting files: ~80 LOC each
- Total command directory: under 300 LOC (tests exempt)
