# Requirements Document

## Introduction

This specification defines the requirements for documenting and improving the public API of **@kaiord/core**, the npm package that provides programmatic access to workout file conversion functionality. While the core library already exists, this spec focuses on ensuring it has comprehensive documentation, examples, and a developer-friendly API surface for npm consumers.

## Glossary

- **@kaiord/core**: The npm package providing programmatic workout file conversion
- **Public API**: The exported functions, types, and interfaces available to package consumers
- **DX**: Developer Experience - how easy and intuitive it is to use the package
- **Tree-shaking**: The ability of bundlers to remove unused code from the final bundle
- **Type Definitions**: TypeScript .d.ts files that provide type information for IDEs
- **JSDoc**: Documentation comments that provide inline help in IDEs
- **Code Examples**: Sample code demonstrating how to use the package

## Requirements

### Requirement 1

**User Story:** As a developer, I want to install @kaiord/core from npm and import it into my TypeScript or JavaScript project, so that I can convert workout files programmatically.

#### Acceptance Criteria

1. WHEN THE developer executes `npm install @kaiord/core`, THE package SHALL be installed with all necessary dependencies
2. WHEN THE developer imports from the package using `import { convertFitToKrd } from '@kaiord/core'`, THE import SHALL resolve correctly in both TypeScript and JavaScript projects
3. WHEN THE developer uses the package in a TypeScript project, THE IDE SHALL provide full type information and autocomplete
4. WHEN THE developer builds their project with a bundler, THE package SHALL support tree-shaking to include only used exports
5. WHEN THE package is imported, THE package SHALL work in both ESM and CommonJS environments

### Requirement 2

**User Story:** As a developer, I want comprehensive API documentation with examples, so that I can understand how to use the package without reading the source code.

#### Acceptance Criteria

1. WHEN THE developer views the package README, THE README SHALL include installation instructions, quick start examples, and API overview
2. WHEN THE developer hovers over a function in their IDE, THE IDE SHALL display JSDoc documentation with parameter descriptions and return types
3. WHEN THE developer visits the package documentation, THE documentation SHALL include code examples for common use cases
4. WHEN THE developer needs to understand error handling, THE documentation SHALL explain all error types and how to handle them
5. WHEN THE developer wants to see advanced usage, THE documentation SHALL include examples of custom loggers and tolerance configuration

### Requirement 3

**User Story:** As a developer, I want a simple, intuitive API for basic conversions, so that I can get started quickly without complex configuration.

#### Acceptance Criteria

1. WHEN THE developer wants to convert FIT to KRD, THE developer SHALL be able to call a single function with minimal configuration
2. WHEN THE developer provides a Uint8Array buffer, THE conversion function SHALL accept it directly without requiring additional wrappers
3. WHEN THE conversion succeeds, THE function SHALL return a typed KRD object that matches the schema
4. WHEN THE conversion fails, THE function SHALL throw a descriptive error with actionable information
5. WHEN THE developer wants default behavior, THE package SHALL provide sensible defaults without requiring explicit configuration

### Requirement 4

**User Story:** As a developer, I want to customize logging behavior, so that I can integrate the package with my application's logging infrastructure.

#### Acceptance Criteria

1. WHEN THE developer wants to use a custom logger, THE package SHALL accept a logger that implements the Logger interface
2. WHEN THE developer does not provide a logger, THE package SHALL use a default console logger
3. WHEN THE developer wants to disable logging, THE package SHALL accept a no-op logger
4. WHEN THE package logs messages, THE logger SHALL receive structured context objects with relevant information
5. WHEN THE developer wants to filter log levels, THE logger interface SHALL support debug, info, warn, and error levels

### Requirement 5

**User Story:** As a developer, I want to validate round-trip conversions with custom tolerances, so that I can ensure data integrity for my specific use case.

#### Acceptance Criteria

1. WHEN THE developer wants to validate round-trip conversion, THE package SHALL provide a validateRoundTrip function
2. WHEN THE developer provides custom tolerances, THE validation SHALL use those tolerances instead of defaults
3. WHEN THE validation succeeds, THE function SHALL return without throwing
4. WHEN THE validation fails, THE function SHALL throw a ToleranceExceededError with detailed violation information
5. WHEN THE developer wants to know default tolerances, THE package SHALL export DEFAULT_TOLERANCES constant

### Requirement 6

**User Story:** As a developer, I want access to all domain schemas and types, so that I can validate and manipulate KRD data in my application.

#### Acceptance Criteria

1. WHEN THE developer imports a schema, THE package SHALL export Zod schemas for all domain types (KRD, Workout, Duration, Target, etc.)
2. WHEN THE developer imports a type, THE package SHALL export TypeScript types inferred from Zod schemas
3. WHEN THE developer wants to validate data, THE developer SHALL be able to use exported schemas with .parse() or .safeParse()
4. WHEN THE developer wants to access enum values, THE package SHALL export enum schemas with .enum property
5. WHEN THE developer needs type guards, THE package SHALL export utility functions for discriminated unions

### Requirement 7

**User Story:** As a developer, I want clear error messages with context, so that I can quickly diagnose and fix issues in my integration.

#### Acceptance Criteria

1. WHEN THE package throws an error, THE error SHALL be an instance of a specific error class (FitParsingError, KrdValidationError, etc.)
2. WHEN THE error contains validation failures, THE error SHALL include an array of validation errors with field paths and messages
3. WHEN THE error contains tolerance violations, THE error SHALL include expected values, actual values, and deviations
4. WHEN THE developer catches an error, THE error SHALL include a cause property with the original error if applicable
5. WHEN THE developer wants to check error type, THE developer SHALL be able to use instanceof checks

### Requirement 8

**User Story:** As a developer, I want to use the package with different FIT SDK implementations, so that I can swap providers without changing my application code.

#### Acceptance Criteria

1. WHEN THE developer wants to use a custom FIT reader, THE package SHALL accept a FitReader implementation via dependency injection
2. WHEN THE developer wants to use a custom FIT writer, THE package SHALL accept a FitWriter implementation via dependency injection
3. WHEN THE developer uses default providers, THE package SHALL use the Garmin FIT SDK implementation
4. WHEN THE developer creates custom providers, THE package SHALL export the port interfaces (FitReader, FitWriter)
5. WHEN THE developer wants to compose use cases, THE package SHALL export use case factory functions that accept dependencies

### Requirement 9

**User Story:** As a developer, I want comprehensive TypeScript types, so that I can catch errors at compile time and get IDE assistance.

#### Acceptance Criteria

1. WHEN THE developer uses the package in TypeScript, THE package SHALL provide complete type definitions for all exports
2. WHEN THE developer passes incorrect types, THE TypeScript compiler SHALL show type errors with helpful messages
3. WHEN THE developer uses discriminated unions, THE TypeScript compiler SHALL narrow types correctly in conditional branches
4. WHEN THE developer imports types, THE package SHALL use `import type` for type-only imports to support type stripping
5. WHEN THE developer builds their project, THE package SHALL not cause TypeScript compilation errors

### Requirement 10

**User Story:** As a developer, I want code examples for common scenarios, so that I can quickly implement workout file conversion in my application.

#### Acceptance Criteria

1. WHEN THE developer wants to convert FIT to KRD, THE documentation SHALL include a complete working example
2. WHEN THE developer wants to convert KRD to FIT, THE documentation SHALL include a complete working example
3. WHEN THE developer wants to validate round-trip conversion, THE documentation SHALL include an example with custom tolerances
4. WHEN THE developer wants to use a custom logger, THE documentation SHALL include an example of logger implementation
5. WHEN THE developer wants to handle errors, THE documentation SHALL include examples of error handling for all error types

### Requirement 11

**User Story:** As a developer, I want the package to have minimal dependencies, so that it doesn't bloat my application bundle.

#### Acceptance Criteria

1. WHEN THE developer installs the package, THE package SHALL only include necessary production dependencies
2. WHEN THE developer bundles their application, THE package SHALL not include development dependencies
3. WHEN THE developer uses tree-shaking, THE bundler SHALL be able to remove unused exports
4. WHEN THE developer checks bundle size, THE package SHALL have a reasonable footprint (< 500KB minified)
5. WHEN THE package has dependencies, THE dependencies SHALL be well-maintained and widely-used libraries

### Requirement 12

**User Story:** As a package maintainer, I want to test the package locally before publishing, so that I can verify it works correctly when installed by consumers.

#### Acceptance Criteria

1. WHEN THE maintainer runs `npm pack`, THE package SHALL create a tarball (.tgz) file with all files that would be published
2. WHEN THE maintainer installs the tarball in a test project using `npm install /path/to/package.tgz`, THE package SHALL install successfully with all dependencies
3. WHEN THE test project imports from the package, THE imports SHALL resolve correctly and provide full TypeScript types
4. WHEN THE maintainer uses `npm link` for local development, THE package SHALL be available to other workspace packages without publishing
5. WHEN THE maintainer runs tests in a consuming project, THE package SHALL work identically to how it would work when published to npm
6. WHEN THE maintainer checks the tarball contents with `tar -tzf package.tgz`, THE tarball SHALL only include intended files (dist/, schema/, README, LICENSE, package.json)
7. WHEN THE maintainer tests in both TypeScript and JavaScript projects, THE package SHALL work correctly in both environments

### Requirement 13

**User Story:** As a package maintainer, I want the package to be properly configured for npm publishing, so that I can release new versions with confidence and proper optimization.

#### Acceptance Criteria

1. WHEN THE maintainer runs the build script, THE package SHALL generate optimized production bundles with source maps
2. WHEN THE maintainer publishes to npm, THE package SHALL only include necessary files (dist/, schema/, README, LICENSE)
3. WHEN THE maintainer updates the version, THE package SHALL follow semantic versioning (semver) conventions
4. WHEN THE package is built, THE build SHALL generate both ESM and type definition files
5. WHEN THE package is published, THE package.json SHALL include all required metadata (description, keywords, repository, license, author)
6. WHEN THE maintainer runs prepublish checks, THE package SHALL validate that all tests pass and build succeeds
7. WHEN THE package is minified, THE build SHALL use appropriate optimization flags for production
8. WHEN THE package includes JSON schemas, THE schemas SHALL be generated from Zod schemas before build
9. WHEN THE maintainer runs `npm publish --dry-run`, THE command SHALL show what would be published without actually publishing

### Requirement 14

**User Story:** As a monorepo maintainer, I want @kaiord/core to work seamlessly with other packages in the workspace, so that the CLI and future SPA can consume it locally with full type support.

#### Acceptance Criteria

1. WHEN THE CLI package imports from @kaiord/core using `workspace:^` protocol, THE import SHALL resolve to the local workspace package
2. WHEN THE developer makes changes to @kaiord/core, THE CLI and other workspace packages SHALL see the changes without republishing
3. WHEN THE developer uses TypeScript in workspace packages, THE IDE SHALL provide full type information from @kaiord/core's type definitions
4. WHEN THE workspace packages are built, THE build SHALL use the local @kaiord/core dist/ output
5. WHEN THE developer runs tests in workspace packages, THE tests SHALL use the local @kaiord/core implementation
6. WHEN THE package exports types, THE exports SHALL include proper TypeScript project references for workspace consumers
7. WHEN THE maintainer runs `pnpm -r build`, THE packages SHALL build in correct dependency order (core before CLI)

### Requirement 15

**User Story:** As a package maintainer, I want automated checks before publishing, so that I don't accidentally publish a broken package.

#### Acceptance Criteria

1. WHEN THE maintainer runs `npm run prepublishOnly`, THE script SHALL run all tests and build before allowing publish
2. WHEN THE tests fail, THE prepublishOnly script SHALL exit with non-zero code and prevent publishing
3. WHEN THE build fails, THE prepublishOnly script SHALL exit with non-zero code and prevent publishing
4. WHEN THE package.json has invalid configuration, THE prepublishOnly script SHALL detect and report the issue
5. WHEN THE maintainer uses `npm version`, THE script SHALL automatically run tests and update changelog
6. WHEN THE package is published, THE npm registry SHALL receive only the built artifacts (no source files)

### Requirement 16

**User Story:** As a package maintainer, I want to ensure all dependencies have compatible licenses, so that I can legally distribute the package and avoid license violations.

#### Acceptance Criteria

1. WHEN THE package includes dependencies, THE dependencies SHALL only use permissive licenses (MIT, Apache-2.0, BSD, ISC)
2. WHEN THE maintainer runs a license checker tool, THE tool SHALL verify all dependencies have compatible licenses
3. WHEN THE package is built, THE build SHALL NOT bundle dependencies with incompatible licenses (GPL, AGPL, etc.)
4. WHEN THE package.json lists dependencies, THE dependencies SHALL be external (not bundled) unless explicitly allowed by license
5. WHEN THE package includes third-party code, THE package SHALL include proper attribution in LICENSE or NOTICE file
6. WHEN THE maintainer adds a new dependency, THE CI SHALL automatically check the dependency's license compatibility
7. WHEN THE package is published, THE package SHALL include a LICENSE file with MIT license (matching project license)

### Requirement 17

**User Story:** As a developer, I want to contribute to the package or report issues, so that I can help improve it for the community.

#### Acceptance Criteria

1. WHEN THE developer wants to report a bug, THE package README SHALL include a link to the issue tracker
2. WHEN THE developer wants to contribute, THE package SHALL include a CONTRIBUTING.md file with guidelines
3. WHEN THE developer wants to understand the architecture, THE package SHALL include architecture documentation
4. WHEN THE developer wants to run tests, THE package SHALL include clear instructions for running the test suite
5. WHEN THE developer submits a pull request, THE package SHALL have CI checks that validate code quality and tests
