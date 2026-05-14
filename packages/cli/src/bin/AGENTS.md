<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# src/bin/AGENTS.md

CLI bootstrap and command registration.

## Purpose

**What lives here:** CLI entry point, yargs setup, global error handling, and command registration dispatch.

## Key Files

- **`kaiord.ts`** — Main entry point. Sets up yargs with global options (`--verbose`, `--quiet`, `--json`, `--log-format`), reads package.json for version, registers all commands, handles uncaught errors and unhandled rejections.
- **`register-commands.ts`** — Dispatcher function that iterates over command configs and registers each command with yargs.

## For AI Agents: Working in This Directory

### Responsibilities

1. **Entry point setup:** Load version from package.json, initialize yargs
2. **Global options:** Register `--verbose`, `--quiet`, `--json`, `--log-format` (available to all commands)
3. **Command registration:** Import command yargs configs and register them
4. **Error handling:** Catch uncaught exceptions and unhandled rejections, format errors, and exit with appropriate code
5. **Exit codes:** Map errors to exit codes using `getExitCodeForError()`

### Adding a New Global Option

1. Add option definition in `kaiord.ts` `.option()` chain:
   ```typescript
   .option("my-option", {
     type: "string",
     description: "My option",
     global: true,
   })
   ```
2. Update command handlers to accept the option
3. Document in README.md

### Adding a New Command

1. Create `src/commands/mycommand/` directory
2. Implement `yargs-config.ts` with command metadata, builder, and handler
3. Import yargs config in `register-commands.ts` and add to `commands` array
4. Document in README.md

## Code Structure

- **kaiord.ts:** ~50 lines, handles yargs setup and error handling
- **register-commands.ts:** ~15 lines, simple loop to register commands

## Testing

- CLI smoke tests in `src/tests/cli-smoke.test.ts` verify entry point works
- Integration tests for each command verify end-to-end behavior
