# Implementation Plan

- [ ] 1. Set up CLI package structure and configuration
  - Create `packages/cli/` directory with package.json
  - Configure tsup for CLI bundling with shebang banner
  - Add production dependencies: yargs, chalk, ora, winston, glob, @kaiord/core (workspace:\*)
  - Add dev dependencies: execa, tmp-promise, strip-ansi, vitest, tsx, @types/yargs
  - Create bin/kaiord.ts entry point file
  - Configure TypeScript for ESM modules
  - Add test scripts to package.json: test, test:unit, test:integration, test:smoke, test:watch
  - Create tests/ directory structure with fixtures/ and helpers/ subdirectories
  - _Requirements: 1.1, 1.2_

- [ ] 2. Implement format detection and file handling utilities
  - [ ] 2.0 Create test helpers and fixtures
    - Create `tests/helpers/cli-test-utils.ts` with runCli and createTempDir utilities
    - Copy fixture files from @kaiord/core to `tests/fixtures/` directory
    - Include WorkoutIndividualSteps.fit, WorkoutRepeatSteps.fit, and sample KRD files
    - _Requirements: Testing infrastructure_

  - [ ] 2.1 Create format detector utility
    - Write `utils/format-detector.ts` with detectFormat function
    - Map file extensions (.fit, .krd, .tcx, .pwx) to format types
    - Implement validateFormat type guard
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ] 2.2 Create file handler utility
    - Write `utils/file-handler.ts` with readFile and writeFile functions
    - Handle binary files (FIT) and text files (KRD, TCX, PWX) differently
    - Implement proper error handling for missing files and permission errors
    - Add findFiles function for glob pattern expansion
    - _Requirements: 2.4, 3.4, 8.1_

  - [ ] 2.3 Write unit tests for utilities
    - Create `utils/format-detector.test.ts` with tests for extension mapping
    - Create `utils/file-handler.test.ts` with tests for file I/O operations
    - Test glob pattern expansion with various patterns
    - Verify all tests pass with `npm run test:unit`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 3. Implement logger factory with environment detection
  - [ ] 3.1 Create logger factory utility
    - Write `utils/logger-factory.ts` with createLogger function
    - Detect environment (TTY, CI, NODE_ENV) for automatic logger selection
    - Implement logger type selection based on options and environment
    - _Requirements: 10.5, 11.1_

  - [ ] 3.2 Implement pretty terminal logger
    - Create pretty logger using chalk for colors
    - Add emoji/icon prefixes for different log levels (ℹ, ⚠, ✖)
    - Implement color coding: green for success, yellow for warnings, red for errors
    - _Requirements: 10.1, 10.2, 10.3_

  - [ ] 3.3 Implement structured JSON logger
    - Create structured logger using winston
    - Configure JSON format with timestamp, level, message, and context
    - Write logs to stderr, keep stdout for results
    - _Requirements: 11.2, 11.3_

  - [ ] 3.4 Write unit tests for logger factory
    - Create `utils/logger-factory.test.ts` with environment detection tests
    - Test logger creation for TTY and CI environments
    - Verify log output format for pretty and structured loggers
    - Verify all tests pass with `npm run test:unit`
    - _Requirements: 10.5, 11.1, 11.4, 11.5_

- [ ] 4. Implement error formatting utilities
  - [ ] 4.1 Create error formatter utility
    - Write `utils/error-formatter.ts` with formatError function
    - Handle FitParsingError, KrdValidationError, ToleranceExceededError
    - Format errors for pretty terminal output with colors
    - Format errors for JSON output with structured data
    - _Requirements: 9.3, 12.3_

  - [ ] 4.2 Implement validation error formatter
    - Create formatValidationErrors function
    - Display field paths and error messages
    - Group errors by type for better readability
    - _Requirements: 3.3, 9.3_

  - [ ] 4.3 Implement tolerance violation formatter
    - Create formatToleranceViolations function
    - Display expected vs actual values with deviation
    - Highlight fields that exceeded tolerance
    - _Requirements: 7.3_

  - [ ] 4.4 Write unit tests for error formatters
    - Create `utils/error-formatter.test.ts` with tests for all error types
    - Test formatError for FitParsingError, KrdValidationError, ToleranceExceededError
    - Verify pretty terminal and JSON output formats
    - Test edge cases (empty errors, missing fields, unknown error types)
    - Verify all tests pass with `npm run test:unit`
    - _Requirements: 9.3_

- [ ] 5. Implement convert command
  - [ ] 5.1 Create convert command handler
    - Write `commands/convert.ts` with convertCommand function
    - Parse and validate command options
    - Detect input/output formats (automatic or explicit)
    - _Requirements: 2.1, 3.1, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4_

  - [ ] 5.2 Implement single file conversion
    - Read input file using file handler
    - Call appropriate @kaiord/core conversion function
    - Write output file using file handler
    - Display success message with spinner/progress indicator
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 10.4_

  - [ ] 5.3 Implement error handling for convert command
    - Catch and format all error types
    - Display helpful error messages with suggestions
    - Set appropriate exit codes
    - _Requirements: 2.4, 2.5, 3.3, 3.4, 9.1, 9.2, 9.3, 12.1, 12.2_

  - [ ] 5.4 Write integration tests for convert command
    - Create `commands/convert-integration.test.ts` using execa to execute CLI
    - Test FIT to KRD conversion with real fixture files
    - Test KRD to FIT conversion with real fixture files
    - Test error handling for missing files (exit code 2)
    - Test error handling for invalid/corrupted files (exit code 4)
    - Test format detection from file extensions
    - Test format override with --input-format and --output-format flags
    - Use tmp-promise to create temporary output directories
    - Verify all tests pass with `npm run test:integration`
    - _Requirements: 2.1, 3.1, 4.1, 5.1_

- [ ] 6. Implement batch conversion support
  - [ ] 6.1 Add batch processing to convert command
    - Expand glob patterns using findFiles utility
    - Process files sequentially with progress tracking
    - Continue on errors and collect results
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ] 6.2 Implement batch conversion summary
    - Display progress for each file (e.g., "Converting 3/10")
    - Show summary with successful/failed counts
    - Display total processing time
    - _Requirements: 8.2, 8.4_

  - [ ] 6.3 Write integration tests for batch conversion
    - Add batch conversion tests to `commands/convert-integration.test.ts`
    - Test glob pattern expansion with multiple fixture files
    - Test processing multiple files sequentially
    - Test error handling when some files fail (continue processing)
    - Verify summary output shows successful/failed counts
    - Verify progress messages for each file
    - Verify all tests pass with `npm run test:integration`
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 7. Implement validate command
  - [ ] 7.1 Create validate command handler
    - Write `commands/validate.ts` with validateCommand function
    - Parse and validate command options
    - Read input file and detect format
    - _Requirements: 7.1_

  - [ ] 7.2 Implement round-trip validation
    - Call validateRoundTrip from @kaiord/core
    - Load custom tolerance config if provided
    - Display validation results with formatted violations
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ] 7.3 Implement error handling for validate command
    - Catch and format validation errors
    - Display tolerance violations with details
    - Set appropriate exit codes
    - _Requirements: 7.3, 12.1, 12.2_

  - [ ] 7.4 Write integration tests for validate command
    - Create `commands/validate-integration.test.ts` using execa
    - Test successful round-trip validation (exit code 0)
    - Test validation failures with tolerance violations (exit code 6)
    - Test custom tolerance config loading from JSON file
    - Verify tolerance violation output includes field names and deviations
    - Verify all tests pass with `npm run test:integration`
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 8. Implement CLI entry point and argument parsing
  - [ ] 8.1 Create main CLI entry point
    - Write `bin/kaiord.ts` with main function
    - Set up yargs for command parsing
    - Configure global options (verbose, quiet, json, log-format)
    - _Requirements: 1.3, 1.4, 6.1, 6.2, 6.3, 11.4, 11.5_

  - [ ] 8.2 Wire convert command to CLI
    - Register convert command with yargs
    - Define command options and aliases
    - Add usage examples and help text
    - _Requirements: 2.1, 5.1, 9.1_

  - [ ] 8.3 Wire validate command to CLI
    - Register validate command with yargs
    - Define command options and aliases
    - Add usage examples and help text
    - _Requirements: 7.1, 9.1_

  - [ ] 8.4 Implement top-level error handling
    - Catch all unhandled errors
    - Format and display errors
    - Set exit codes based on error type
    - _Requirements: 9.4, 12.1, 12.2_

  - [ ] 8.5 Write CLI smoke tests
    - Create `tests/cli-smoke.test.ts` using execa
    - Test `kaiord --help` displays usage information
    - Test `kaiord --version` displays version number (matches semver pattern)
    - Test `kaiord invalid-command` shows error and suggests valid commands
    - Test `kaiord convert` without required args shows usage and exits with code 1
    - Use strip-ansi to remove color codes before assertions
    - Verify all tests pass with `npm run test:smoke`
    - _Requirements: 1.3, 1.4, 9.1, 9.4_

- [ ] 9. Implement verbosity and output control
  - [ ] 9.1 Add verbosity flags to commands
    - Implement --verbose flag for detailed logging
    - Implement --quiet flag to suppress non-error output
    - Pass verbosity level to logger factory
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ] 9.2 Add JSON output support
    - Implement --json flag for machine-readable output
    - Format conversion results as JSON to stdout
    - Format validation results as JSON to stdout
    - Ensure logs go to stderr when using JSON output
    - _Requirements: 11.3, 12.3_

  - [ ] 9.3 Implement automatic TTY detection
    - Detect non-TTY environments automatically
    - Disable colored output in non-TTY mode
    - Disable spinners and progress bars in non-TTY mode
    - _Requirements: 10.5, 12.4_

  - [ ] 9.4 Write tests for output control
    - Add verbosity tests to `commands/convert-integration.test.ts`
    - Test --verbose flag increases log output (debug messages visible)
    - Test --quiet flag suppresses non-error output
    - Test --json flag outputs machine-readable JSON to stdout
    - Test --log-format json forces structured logging
    - Test --log-format pretty forces colored output
    - Verify TTY detection disables colors in non-TTY environments
    - Verify all tests pass with `npm run test:integration`
    - _Requirements: 6.1, 6.2, 6.3, 12.3, 12.4_

- [ ] 10. Package and publish configuration
  - [ ] 10.1 Configure package for npm publishing
    - Set up package.json with correct bin entry
    - Configure files array to include only dist/
    - Add repository, license, and keywords
    - _Requirements: 1.1_

  - [ ] 10.2 Test global installation locally
    - Build the CLI package
    - Test `npm link` for local global installation
    - Verify `kaiord` command is available globally
    - Test all commands work after global installation
    - _Requirements: 1.1, 1.2_

  - [ ] 10.3 Verify all tests pass before publishing
    - Run `npm run test` to execute all test suites
    - Verify unit tests pass with `npm run test:unit`
    - Verify integration tests pass with `npm run test:integration`
    - Verify smoke tests pass with `npm run test:smoke`
    - Ensure test coverage meets requirements (≥80% overall)
    - Fix any failing tests before proceeding to publish
    - _Requirements: Testing verification_

  - [ ] 10.4 Write installation documentation
    - Document npm install -g @kaiord/cli
    - Document usage examples for all commands
    - Document environment variables and configuration
    - Add troubleshooting section
    - Include examples of running different test suites
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
