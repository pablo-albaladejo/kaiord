# Implementation Plan

## Status: ✅ COMPLETE

All tasks have been successfully implemented and tested. The CLI package is fully functional with:

- ✅ 98 tests passing (8 test files)
- ✅ All core functionality implemented (convert, validate commands)
- ✅ Comprehensive error handling and logging
- ✅ Batch conversion support with glob patterns
- ✅ Round-trip validation with custom tolerances
- ✅ Complete documentation (README.md)
- ✅ Package ready for npm publishing

The CLI is production-ready and can be published to npm at https://www.npmjs.com/package/@kaiord/cli

---

## Completed Tasks

- [x] 1. Set up CLI package structure and configuration
  - Create `packages/cli/` directory with package.json
  - Configure tsup for CLI bundling with shebang banner
  - Add production dependencies: yargs (^17.7.2), chalk (^5.3.0), ora (^8.0.1), winston (^3.11.0), glob (^10.3.10), zod (^3.22.4), @kaiord/core (workspace:^)
  - Add dev dependencies: execa (^8.0.1), tmp-promise (^3.0.3), strip-ansi (^7.1.0), vitest (^1.2.0), tsx (^4.7.0), @types/yargs (^17.0.32)
  - Create src/bin/kaiord.ts entry point file
  - Configure TypeScript for ESM modules with strict mode
  - Add test scripts to package.json: test, test:unit, test:integration, test:smoke, test:watch
  - Create src/tests/ directory structure with fixtures/ and helpers/ subdirectories
  - Configure vitest.config.ts for test patterns
  - _Requirements: 1.1, 1.2_

- [x] 2. Implement format detection and file handling utilities
  - [x] 2.0 Create test helpers and fixtures
    - Create `src/tests/helpers/cli-test-utils.ts` with runCli and createTempDir utilities
    - Copy fixture files from @kaiord/core to `src/tests/fixtures/fit-files/` directory
    - Include WorkoutIndividualSteps.fit, WorkoutRepeatSteps.fit, and corresponding KRD files
    - Create minimal test fixtures (< 20KB each) for smoke tests
    - _Requirements: Testing infrastructure_

  - [x] 2.1 Create format detector utility with tests
    - Write `src/utils/format-detector.ts` with detectFormat function
    - Define FileFormat type as z.enum(["fit", "krd", "tcx", "zwo"]) using Zod
    - Map file extensions (.fit, .krd, .tcx, .zwo) to format types
    - Implement validateFormat type guard using Zod schema
    - Write co-located `src/utils/format-detector.test.ts` with tests for extension mapping
    - Test all supported extensions and unknown extensions
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 2.2 Create file handler utility with tests
    - Write `src/utils/file-handler.ts` with readFile and writeFile functions
    - Handle binary files (FIT) and text files (KRD, TCX, ZWO) differently
    - Implement proper error handling for missing files and permission errors
    - Add findFiles function for glob pattern expansion using glob library
    - Write co-located `src/utils/file-handler.test.ts` with tests for file I/O operations
    - Test glob pattern expansion with various patterns
    - Test error handling for missing files and permission errors
    - _Requirements: 2.4, 3.4, 8.1_

- [x] 3. Implement logger factory with environment detection
  - [x] 3.1 Create logger factory utility with tests
    - Write `src/utils/logger-factory.ts` with createLogger function
    - Implement Logger type matching @kaiord/core Logger interface (debug, info, warn, error)
    - Detect environment (TTY, CI, NODE_ENV) for automatic logger selection
    - Implement logger type selection based on options and environment
    - Write co-located `src/utils/logger-factory.test.ts` with environment detection tests
    - Test logger creation for TTY and CI environments
    - Mock process.stdout.isTTY and process.env for testing
    - _Requirements: 10.5, 11.1_

  - [x] 3.2 Implement pretty terminal logger
    - Create pretty logger adapter in `src/adapters/logger/pretty-logger.ts`
    - Use chalk for colors (ESM import)
    - Add emoji/icon prefixes for different log levels (ℹ, ⚠, ✖, 🐛)
    - Implement color coding: green for success, yellow for warnings, red for errors, gray for debug
    - Return Logger interface compatible with @kaiord/core
    - _Requirements: 10.1, 10.2, 10.3_

  - [x] 3.3 Implement structured JSON logger
    - Create structured logger adapter in `src/adapters/logger/structured-logger.ts`
    - Use winston for structured logging
    - Configure JSON format with timestamp, level, message, and context
    - Write logs to stderr using winston transports
    - Return Logger interface compatible with @kaiord/core
    - _Requirements: 11.2, 11.3_

- [x] 4. Implement error formatting utilities
  - [x] 4.1 Create error formatter utility with tests
    - Write `src/utils/error-formatter.ts` with formatError function
    - Import error types from @kaiord/core (FitParsingError, KrdValidationError, ToleranceExceededError)
    - Handle all domain error types with instanceof checks
    - Format errors for pretty terminal output with chalk colors
    - Format errors for JSON output with structured data
    - Create formatValidationErrors helper for ValidationError arrays
    - Create formatToleranceViolations helper for ToleranceViolation arrays
    - Write co-located `src/utils/error-formatter.test.ts` with tests for all error types
    - Test formatError for each domain error type
    - Verify pretty terminal and JSON output formats
    - Test edge cases (empty errors, missing fields, unknown error types)
    - Use strip-ansi to test colored output
    - _Requirements: 3.3, 7.3, 9.3, 12.3_

- [x] 5. Implement convert command
  - [x] 5.1 Create convert command handler
    - Write `src/commands/convert.ts` with convertCommand function
    - Define ConvertOptions type with input, output, inputFormat, outputFormat, verbose, quiet, json, logFormat
    - Parse and validate command options using Zod schemas
    - Detect input/output formats using format-detector utility
    - Create logger using logger-factory based on options
    - Get providers from @kaiord/core using createDefaultProviders(logger)
    - _Requirements: 2.1, 3.1, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4_

  - [x] 5.2 Implement single file conversion logic
    - Read input file using file-handler utility
    - Determine conversion direction (FIT→KRD or KRD→FIT)
    - Call appropriate use case from providers (convertFitToKrd or convertKrdToFit)
    - Write output file using file-handler utility
    - Display success message with ora spinner/progress indicator
    - Handle TTY detection to disable spinners in non-interactive mode
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 10.4_

  - [x] 5.3 Implement error handling for convert command
    - Wrap conversion logic in try-catch block
    - Catch domain errors from @kaiord/core (FitParsingError, KrdValidationError)
    - Format errors using error-formatter utility
    - Display helpful error messages with suggestions
    - Set appropriate exit codes (0=success, 1=invalid args, 2=file not found, 4=parsing error, 5=validation error)
    - Log errors using logger before exiting
    - _Requirements: 2.4, 2.5, 3.3, 3.4, 9.1, 9.2, 9.3, 12.1, 12.2_

  - [x] 5.4 Write integration tests for convert command
    - Create `src/commands/convert-integration.test.ts` using execa to execute CLI
    - Build CLI before tests using tsx or compiled dist
    - Test FIT to KRD conversion with WorkoutIndividualSteps.fit fixture
    - Test KRD to FIT conversion with corresponding KRD fixture
    - Test error handling for missing files (verify exit code 2)
    - Test error handling for invalid/corrupted files (verify exit code 4)
    - Test format detection from file extensions
    - Test format override with --input-format and --output-format flags
    - Use tmp-promise to create temporary output directories
    - Use strip-ansi to remove color codes before assertions
    - _Requirements: 2.1, 3.1, 4.1, 5.1_

- [x] 6. Implement batch conversion support
  - [x] 6.1 Add batch processing to convert command
    - Detect glob patterns in input argument (contains \* or ?)
    - Expand glob patterns using findFiles utility from file-handler
    - Process files sequentially with for loop
    - Track start time for performance measurement
    - Continue on errors and collect results in array
    - Use ora spinner for overall progress
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 6.2 Implement batch conversion summary
    - Display progress for each file (e.g., "Converting 3/10: workout3.fit")
    - Collect successful and failed conversions in separate arrays
    - Show summary with successful/failed counts after completion
    - Display total processing time using Date.now() difference
    - Format summary with colors (green for success, red for failures)
    - _Requirements: 8.2, 8.4_

  - [x] 6.3 Write integration tests for batch conversion
    - Add batch conversion tests to `src/commands/convert-integration.test.ts`
    - Create multiple test fixture files in temporary directory
    - Test glob pattern expansion with "\*.fit" pattern
    - Test processing multiple files sequentially
    - Test error handling when some files fail (verify processing continues)
    - Verify summary output shows successful/failed counts using regex
    - Verify progress messages for each file appear in output
    - Use strip-ansi to remove color codes before assertions
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 7. Implement validate command
  - [x] 7.1 Create validate command handler
    - Write `src/commands/validate.ts` with validateCommand function
    - Define ValidateOptions type with input, toleranceConfig, verbose, quiet, json, logFormat
    - Parse and validate command options using Zod schemas
    - Read input file using file-handler utility
    - Detect format using format-detector utility
    - Create logger using logger-factory based on options
    - _Requirements: 7.1_

  - [x] 7.2 Implement round-trip validation logic
    - Get providers from @kaiord/core using createDefaultProviders(logger)
    - Load custom tolerance config if --tolerance-config provided
    - Parse tolerance config JSON using toleranceConfigSchema from @kaiord/core
    - Call validateRoundTrip use case from @kaiord/core with custom tolerances
    - Display validation results with ora spinner
    - Format tolerance violations using error-formatter utility
    - Handle successful validation (no violations)
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 7.3 Implement error handling for validate command
    - Wrap validation logic in try-catch block
    - Catch ToleranceExceededError from @kaiord/core
    - Format tolerance violations with field names, expected, actual, deviation
    - Display helpful error messages with suggestions
    - Set appropriate exit codes (0=success, 6=tolerance exceeded)
    - Log errors using logger before exiting
    - _Requirements: 7.3, 12.1, 12.2_

  - [x] 7.4 Write integration tests for validate command
    - Create `src/commands/validate-integration.test.ts` using execa
    - Test successful round-trip validation with valid FIT file (verify exit code 0)
    - Test validation failures with tolerance violations (verify exit code 6)
    - Create custom tolerance config JSON file in temporary directory
    - Test custom tolerance config loading from JSON file
    - Verify tolerance violation output includes field names and deviations using regex
    - Use strip-ansi to remove color codes before assertions
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 8. Implement CLI entry point and argument parsing
  - [x] 8.1 Create main CLI entry point
    - Write `src/bin/kaiord.ts` with main async function
    - Add shebang line: #!/usr/bin/env node
    - Set up yargs for command parsing with .scriptName('kaiord')
    - Configure global options: --verbose, --quiet, --json, --log-format
    - Add --version flag using package.json version
    - Add --help flag with custom help text
    - Implement easter egg flags: --kiro and --kiroween (hidden from help)
    - Call main() and handle process.exit codes
    - _Requirements: 1.3, 1.4, 6.1, 6.2, 6.3, 11.4, 11.5_

  - [x] 8.2 Wire convert command to CLI
    - Register convert command with yargs.command()
    - Define command signature: "convert"
    - Add required options: --input (-i), --output (-o)
    - Add optional options: --input-format, --output-format
    - Add usage examples in .example() calls
    - Add detailed help text in .describe() calls
    - Wire to convertCommand handler from commands/convert
    - _Requirements: 2.1, 5.1, 9.1_

  - [x] 8.3 Wire validate command to CLI
    - Register validate command with yargs.command()
    - Define command signature: "validate"
    - Add required option: --input (-i)
    - Add optional option: --tolerance-config
    - Add usage examples in .example() calls
    - Add detailed help text in .describe() calls
    - Wire to validateCommand handler from commands/validate
    - _Requirements: 7.1, 9.1_

  - [x] 8.4 Implement top-level error handling
    - Wrap main() in try-catch block
    - Catch all unhandled errors at process level
    - Format errors using error-formatter utility
    - Display errors to stderr
    - Map error types to exit codes (FitParsingError→4, KrdValidationError→5, ToleranceExceededError→6)
    - Set default exit code 99 for unknown errors
    - Add process.on('unhandledRejection') handler
    - Add process.on('uncaughtException') handler
    - _Requirements: 9.4, 12.1, 12.2_

  - [x] 8.5 Implement easter egg display
    - Create showKiroEasterEgg function in bin/kaiord.ts
    - Use chalk.cyan for colored ASCII art box
    - Include message about Kiro AI and Kiroween hackathon
    - Include link to http://kiroween.devpost.com/
    - Include message about how Kiro helped build the tool
    - Call from yargs middleware when --kiro or --kiroween detected
    - Exit with code 0 after displaying
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

  - [x] 8.6 Write CLI smoke tests
    - Create `src/tests/cli-smoke.test.ts` using execa
    - Test `kaiord --help` displays usage information (verify "kaiord" in output)
    - Test `kaiord --version` displays version number (verify semver pattern /\d+\.\d+\.\d+/)
    - Test `kaiord invalid-command` shows error and suggests valid commands
    - Test `kaiord convert` without required args shows usage and exits with code 1
    - Test `kaiord --kiro` displays easter egg (verify "Kiroween" in output)
    - Use strip-ansi to remove color codes before assertions
    - Build CLI before running tests
    - _Requirements: 1.3, 1.4, 9.1, 9.4, 13.1_

- [x] 9. Implement verbosity and output control
  - [x] 9.1 Add verbosity flags to commands
    - Update convertCommand to accept verbose and quiet options
    - Update validateCommand to accept verbose and quiet options
    - Pass verbosity level to logger-factory (debug for verbose, error for quiet)
    - Implement conditional logging based on verbosity level
    - Suppress ora spinners when quiet flag is set
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 9.2 Add JSON output support
    - Update convertCommand to accept json option
    - Format conversion results as JSON object to stdout when --json flag set
    - Update validateCommand to accept json option
    - Format validation results as JSON object to stdout when --json flag set
    - Ensure all logs go to stderr when JSON output is enabled
    - Suppress ora spinners when JSON output is enabled
    - Use JSON.stringify with 2-space indentation for readability
    - _Requirements: 11.3, 12.3_

  - [x] 9.3 Implement automatic TTY detection
    - Check process.stdout.isTTY in logger-factory
    - Disable colored output when not TTY (use plain logger)
    - Check process.stdout.isTTY before creating ora spinners
    - Disable spinners and progress bars in non-TTY mode
    - Add isTTY helper function in utils
    - _Requirements: 10.5, 12.4_

  - [x] 9.4 Write tests for output control
    - Add verbosity tests to `src/commands/convert-integration.test.ts`
    - Test --verbose flag increases log output (verify "debug" or detailed messages in stderr)
    - Test --quiet flag suppresses non-error output (verify minimal output)
    - Test --json flag outputs machine-readable JSON to stdout (parse and validate JSON)
    - Test --log-format json forces structured logging (verify JSON log format in stderr)
    - Test --log-format pretty forces colored output (verify ANSI codes present)
    - Mock process.stdout.isTTY to test TTY detection
    - Verify TTY detection disables colors in non-TTY environments
    - Use strip-ansi to remove color codes before assertions where needed
    - _Requirements: 6.1, 6.2, 6.3, 12.3, 12.4_

- [x] 10. Package and publish configuration
  - [x] 10.1 Configure package for npm publishing
    - Update package.json with correct bin entry: { "kaiord": "./dist/bin/kaiord.js" }
    - Configure files array to include only ["dist"]
    - Add repository field pointing to GitHub repo
    - Add license field: "MIT"
    - Add keywords: ["kaiord", "fit", "workout", "garmin", "tcx", "zwo", "cli"]
    - Add description: "Command-line interface for Kaiord workout file conversion"
    - Set publishConfig.access to "public" for scoped package
    - _Requirements: 1.1_

  - [x] 10.2 Test global installation locally
    - Build the CLI package with `pnpm build`
    - Test `pnpm link --global` for local global installation
    - Verify `kaiord` command is available globally in new terminal
    - Test `kaiord --version` works globally
    - Test `kaiord convert` with sample files works globally
    - Test `kaiord validate` with sample files works globally
    - Test `kaiord --help` displays correct information
    - Unlink after testing with `pnpm unlink --global`
    - _Requirements: 1.1, 1.2_

  - [x] 10.3 Verify all tests pass before publishing
    - Run `pnpm test` to execute all test suites
    - Verify unit tests pass with `pnpm test:unit`
    - Verify integration tests pass with `pnpm test:integration`
    - Verify smoke tests pass with `pnpm test:smoke`
    - Check test coverage report (should be ≥80% overall)
    - Fix any failing tests before proceeding
    - Verify no TypeScript errors with `pnpm tsc --noEmit`
    - _Requirements: Testing verification_

  - [x] 10.4 Write installation documentation
    - Create packages/cli/README.md
    - Document installation: `npm install -g @kaiord/cli` or `pnpm add -g @kaiord/cli`
    - Document convert command with examples (FIT→KRD, KRD→FIT, batch conversion)
    - Document validate command with examples (round-trip validation, custom tolerances)
    - Document global options (--verbose, --quiet, --json, --log-format)
    - Document environment variables (CI, NODE_ENV) and their effects
    - Add troubleshooting section (common errors, file permissions, format detection)
    - Include examples of running different test suites
    - Add link to main Kaiord documentation
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

---

## Optional Future Enhancements

These tasks are not required for the initial release but could be added in future versions:

- [ ] 11. Watch Mode
  - Implement `kaiord convert --watch` to monitor directory for changes
  - Auto-convert files when they are added or modified
  - _Requirements: Future enhancement_

- [ ] 12. Config File Support
  - Support `.kaiordrc.json` for default options
  - Allow users to set default formats, tolerances, and output directories
  - _Requirements: Future enhancement_

- [ ] 13. Plugin System
  - Design plugin architecture for custom format converters
  - Allow third-party format support without modifying core
  - _Requirements: Future enhancement_

- [ ] 14. Interactive Mode
  - Implement interactive prompts for missing arguments
  - Guide users through conversion process step-by-step
  - _Requirements: Future enhancement_

- [ ] 15. Diff Command
  - Add `kaiord diff` command to compare two workout files
  - Show differences in metadata, steps, and targets
  - _Requirements: Future enhancement_

- [ ] 16. Merge Command
  - Add `kaiord merge` command to combine multiple workouts
  - Support concatenation and intelligent merging strategies
  - _Requirements: Future enhancement_

---

## Publishing Checklist

Before publishing to npm (https://www.npmjs.com/package/@kaiord/cli):

- [x] All tests passing (`pnpm test`)
- [x] Build succeeds (`pnpm build`)
- [x] License check passes (`pnpm check-licenses`)
- [x] README.md is complete and accurate
- [x] CHANGELOG.md includes release notes
- [x] Version number follows semver
- [x] Git tag matches package version
- [x] NPM authentication configured (`npm whoami`)
- [x] Package name available or publish rights confirmed

**Publishing command:**

```bash
npm publish --access public
```

**Post-publish verification:**

```bash
npm view @kaiord/cli
npm install -g @kaiord/cli
kaiord --version
kaiord --help
```
