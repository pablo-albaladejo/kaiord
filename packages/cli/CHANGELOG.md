# Changelog

## 1.0.1

### Patch Changes

- Automated release from commit b9d70b4232c66c73581f860f0714d51763cc8aca
- Updated dependencies
  - @kaiord/core@1.0.1

## 1.0.0

### Major Changes

- **Production Release**: First stable release of @kaiord/cli
- Updated dependencies
  - @kaiord/core@1.0.0

All notable changes to the @kaiord/cli package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - 2025-01-22

### Changed

- Version bump to align with core package updates

## [0.1.0] - 2025-01-22

### Added

#### Core Commands

- **Convert Command**: Convert workout files between FIT, KRD, TCX, and ZWO formats
  - Single file conversion with automatic format detection
  - Batch conversion support using glob patterns (e.g., `*.fit`)
  - Format override flags (`--input-format`, `--output-format`)
  - Progress indicators with ora spinners
  - Batch conversion summary with success/failure counts and timing

- **Validate Command**: Round-trip validation for data integrity verification
  - Automatic round-trip conversion (e.g., FIT → KRD → FIT)
  - Custom tolerance configuration via JSON file
  - Detailed tolerance violation reporting with field names, expected/actual values, and deviations

#### CLI Features

- Global installation support via npm/pnpm (`npm install -g @kaiord/cli`)
- Automatic format detection from file extensions (.fit, .krd, .tcx, .zwo)
- Comprehensive error handling with descriptive messages and exit codes
- Version flag (`--version`) displays current package version
- Help flag (`--help`) displays usage information and examples

#### Output Control

- **Verbosity Flags**:
  - `--verbose`: Detailed logging with debug information
  - `--quiet`: Suppress all output except errors
- **Output Formats**:
  - `--json`: Machine-readable JSON output to stdout
  - `--log-format pretty`: Colored terminal output with emoji prefixes
  - `--log-format json`: Structured JSON logs to stderr
- **Environment Detection**:
  - Automatic TTY detection for color/spinner control
  - CI environment detection (CI=true, NODE_ENV=production)
  - Automatic structured logging in non-interactive environments

#### Logging System

- Pretty terminal logger with chalk colors and emoji prefixes (ℹ, ⚠, ✖, 🐛)
- Structured JSON logger with winston for CI/CD pipelines
- Logger factory with automatic environment detection
- Configurable log levels (debug, info, warn, error)

#### Error Handling

- Comprehensive error formatting for terminal and JSON output
- Domain error type handling (FitParsingError, KrdValidationError, ToleranceExceededError)
- Helpful error messages with suggestions for common issues
- Proper exit codes:
  - 0: Success
  - 1: Invalid arguments, file not found, parsing error, validation error
  - 6: Tolerance exceeded (internal)

#### Utilities

- Format detector with Zod schema validation
- File handler with binary/text file support and glob pattern expansion
- Error formatter with pretty terminal and JSON output modes
- TTY detection helper for automatic feature toggling

### Testing

- **98 tests passing** across 8 test files
- **Unit tests**: Format detection, file handling, logger factory, error formatting
- **Integration tests**: Convert command, validate command, batch conversion
- **Smoke tests**: CLI help, version, invalid commands
- **Test coverage**: Comprehensive coverage of all core functionality
- **Test utilities**: Shared fixtures, CLI test helpers, temporary directory management

### Documentation

- Complete README.md with installation, usage, and troubleshooting guides
- Inline code documentation and JSDoc comments
- Example commands for all features
- Troubleshooting section for common issues

### Dependencies

- **Production**:
  - @kaiord/core (workspace:^) - Core conversion library
  - yargs (^17.7.2) - CLI argument parsing
  - chalk (^5.3.0) - Terminal colors
  - ora (^8.0.1) - Terminal spinners
  - winston (^3.11.0) - Structured logging
  - glob (^10.3.10) - File pattern matching
  - zod (^3.22.4) - Schema validation
- **Development**:
  - vitest (^1.2.0) - Testing framework
  - execa (^8.0.1) - CLI testing
  - tmp-promise (^3.0.3) - Temporary directories
  - strip-ansi (^7.1.0) - ANSI code removal for testing
  - license-checker (^25.0.1) - License compliance

### Package Configuration

- Configured for npm publishing at [@kaiord/cli](https://www.npmjs.com/package/@kaiord/cli)
- Public scoped package with MIT license
- Binary entry point: `kaiord` command
- Includes only dist/ directory in published package
- Pre-publish hooks: build and test
- License compliance checking with automated validation

### Build System

- tsup configuration with ESM output
- Shebang banner for CLI executable
- TypeScript strict mode compilation
- Source maps for debugging

## [Unreleased]

### Planned Features

- Watch mode for automatic file conversion on changes
- Config file support (.kaiordrc.json)
- Plugin system for custom format converters
- Interactive mode with prompts
- Diff command to compare workout files
- Merge command to combine workouts

---

## Release Notes

### Version 0.1.0 - Initial Release

This is the first public release of @kaiord/cli, providing a complete command-line interface for workout file conversion. The CLI wraps the @kaiord/core library with a user-friendly interface that supports both interactive terminal usage and CI/CD automation.

**Key Highlights:**

- ✅ Convert between FIT, KRD, TCX, and ZWO formats
- ✅ Batch conversion with glob patterns
- ✅ Round-trip validation with custom tolerances
- ✅ Beautiful terminal output with colors and spinners
- ✅ Structured JSON logging for CI/CD pipelines
- ✅ Comprehensive error handling and helpful messages
- ✅ 98 tests passing with high coverage
- ✅ Ready for npm publishing

**Installation:**

```bash
npm install -g @kaiord/cli
```

**Quick Start:**

```bash
# Convert a single file
kaiord convert --input workout.fit --output workout.krd

# Batch convert multiple files
kaiord convert --input "workouts/*.fit" --output-dir converted/

# Validate round-trip conversion
kaiord validate --input workout.fit
```

For detailed documentation, see the [README.md](./README.md).

---

[0.1.1]: https://github.com/pablo-albaladejo/kaiord/releases/tag/cli-v0.1.1
[0.1.0]: https://github.com/pablo-albaladejo/kaiord/releases/tag/cli-v0.1.0
