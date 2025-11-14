# Implementation Plan

- [ ] 1. Add JSDoc documentation to public API exports

  - [ ] 1.1 Add JSDoc comments to domain schema exports

    - Document krdSchema, workoutSchema, durationSchema, targetSchema with usage examples
    - Document all enum schemas (sportSchema, subSportSchema, intensitySchema, etc.)
    - Include @example blocks showing .parse() and .safeParse() usage
    - _Requirements: 2.2, 9.1_

  - [ ] 1.2 Add JSDoc comments to type exports

    - Document all inferred types (KRD, Workout, Duration, Target, etc.)
    - Include type usage examples in JSDoc
    - _Requirements: 2.2, 9.1_

  - [ ] 1.3 Add JSDoc comments to error types and factories

    - Document FitParsingError, KrdValidationError, ToleranceExceededError
    - Include error handling examples in JSDoc
    - Document error properties (message, cause, errors, violations)
    - _Requirements: 2.2, 7.1, 7.2, 7.3_

  - [ ] 1.4 Add JSDoc comments to use case exports

    - Document convertFitToKrd and convertKrdToFit with full examples
    - Document validateRoundTrip with tolerance examples
    - Include parameter descriptions and return types
    - Document all possible thrown errors
    - _Requirements: 2.2, 2.3, 3.1, 3.2, 3.3, 3.4_

  - [ ] 1.5 Add JSDoc comments to provider exports
    - Document createDefaultProviders with custom logger example
    - Document Providers type and its properties
    - _Requirements: 2.2, 4.1, 4.2, 4.3, 4.4_

- [ ] 2. Create comprehensive README documentation

  - [ ] 2.1 Write README with installation and quick start

    - Add installation instructions (npm install @kaiord/core)
    - Add quick start example with basic FIT to KRD conversion
    - Add features list with checkmarks
    - Add badges (npm version, license, build status)
    - _Requirements: 2.1, 2.3, 3.1_

  - [ ] 2.2 Add API overview section to README

    - Document main functions (convertFitToKrd, convertKrdToFit)
    - Document validation functions (validateRoundTrip)
    - Document schema exports and their usage
    - Link to detailed API examples document
    - _Requirements: 2.1, 2.3_

  - [ ] 2.3 Add TypeScript support section to README

    - Show type import examples
    - Show discriminated union usage
    - Show schema validation with type inference
    - _Requirements: 2.3, 9.1, 9.2, 9.3, 9.4_

  - [ ] 2.4 Add error handling section to README

    - Document all error types with examples
    - Show try-catch patterns for each error type
    - Show how to access error details (cause, errors, violations)
    - _Requirements: 2.4, 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ] 2.5 Add links to additional documentation
    - Link to API examples document
    - Link to architecture documentation
    - Link to contributing guidelines
    - Link to issue tracker
    - _Requirements: 2.1, 2.3, 17.1, 17.2, 17.3_

- [ ] 3. Create API examples document

  - [ ] 3.1 Create docs/api-examples.md with basic conversion examples

    - Example 1: FIT to KRD conversion with file reading
    - Example 2: KRD to FIT conversion with file writing
    - Include complete, runnable code for each example
    - _Requirements: 2.3, 10.1, 10.2_

  - [ ] 3.2 Add custom logger examples

    - Example 3: Custom logger implementation
    - Example 4: No-op logger for silent operation
    - Example 5: Integration with winston/pino
    - _Requirements: 2.5, 4.1, 4.2, 4.3, 4.4, 10.4_

  - [ ] 3.3 Add round-trip validation examples

    - Example 6: Basic round-trip validation
    - Example 7: Custom tolerance configuration
    - Example 8: Handling tolerance violations
    - _Requirements: 2.5, 5.1, 5.2, 5.3, 5.4, 5.5, 10.3, 10.5_

  - [ ] 3.4 Add schema validation examples

    - Example 9: Schema validation with .parse()
    - Example 10: Schema validation with .safeParse()
    - Example 11: Accessing enum values
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ] 3.5 Add error handling examples

    - Example 12: Handling FitParsingError
    - Example 13: Handling KrdValidationError
    - Example 14: Handling ToleranceExceededError
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 10.5_

  - [ ] 3.6 Add dependency injection examples
    - Example 15: Custom FIT reader implementation
    - Example 16: Custom FIT writer implementation
    - Example 17: Composing use cases with custom providers
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 4. Configure package for npm publishing

  - [ ] 4.1 Update package.json with publishing metadata

    - Add comprehensive description
    - Add keywords array (workout, fit, garmin, tcx, pwx, krd, fitness, training, conversion)
    - Add author field
    - Add repository field with directory
    - Add bugs field with issue tracker URL
    - Add homepage field
    - Verify license is MIT
    - _Requirements: 13.5_

  - [ ] 4.2 Configure files array in package.json

    - Include only: dist/, schema/, README.md, LICENSE
    - Verify .npmignore or files array excludes src/, tests/, scripts/
    - _Requirements: 13.2_

  - [ ] 4.3 Add prepublishOnly script

    - Create script: "prepublishOnly": "pnpm run lint && pnpm run test && pnpm run build"
    - Verify script runs lint, test, and build in sequence
    - Verify script exits with error if any step fails
    - _Requirements: 13.6, 15.1, 15.2, 15.3_

  - [ ] 4.4 Add pack:test script for local testing

    - Create script: "pack:test": "pnpm pack && echo 'Test with: npm install kaiord-core-\*.tgz'"
    - Document usage in README or docs/publishing.md
    - _Requirements: 12.1, 12.6_

  - [ ] 4.5 Verify tsup configuration for production
    - Ensure sourcemap: true for debugging
    - Ensure dts: true for type definitions
    - Ensure treeshake: true for tree-shaking
    - Ensure format: ["esm"] for ESM-only output
    - _Requirements: 1.4, 13.1, 13.4_

- [ ] 5. Add license checking and compliance

  - [ ] 5.1 Add license-checker dependency

    - Install license-checker as dev dependency
    - Create check:licenses script in package.json
    - Configure to only allow MIT, Apache-2.0, BSD, ISC licenses
    - _Requirements: 16.1, 16.2, 16.6_

  - [ ] 5.2 Run license checker on current dependencies

    - Execute `pnpm run check:licenses`
    - Verify all dependencies have compatible licenses
    - Document any exceptions or special cases
    - _Requirements: 16.1, 16.2, 16.3_

  - [ ] 5.3 Add license check to CI pipeline

    - Add check:licenses to CI workflow
    - Ensure CI fails if incompatible licenses are detected
    - _Requirements: 16.6_

  - [ ] 5.4 Verify LICENSE file exists
    - Ensure LICENSE file contains MIT license text
    - Ensure copyright holder is correct
    - _Requirements: 16.5, 16.7_

- [ ] 6. Test package locally before publishing

  - [ ] 6.1 Test with npm pack

    - Run `pnpm run build` to generate dist/
    - Run `pnpm pack` to create tarball
    - Inspect tarball contents with `tar -tzf kaiord-core-*.tgz`
    - Verify only dist/, schema/, README.md, LICENSE, package.json are included
    - _Requirements: 12.1, 12.6_

  - [ ] 6.2 Test tarball installation in test project

    - Create test-project directory outside monorepo
    - Run `npm init -y` in test project
    - Install tarball: `npm install /path/to/kaiord-core-*.tgz`
    - Verify installation succeeds
    - _Requirements: 12.2_

  - [ ] 6.3 Test imports in TypeScript project

    - Create test.ts file with imports from @kaiord/core
    - Import and use convertFitToKrd, schemas, types
    - Verify TypeScript types are available in IDE
    - Run with `npx tsx test.ts`
    - _Requirements: 12.3, 12.7_

  - [ ] 6.4 Test imports in JavaScript project

    - Create test.js file with imports from @kaiord/core
    - Import and use convertFitToKrd
    - Run with `node test.js`
    - Verify package works in JavaScript environment
    - _Requirements: 12.7_

  - [ ] 6.5 Test with npm link for local development
    - Run `pnpm link --global` in @kaiord/core
    - Run `pnpm link --global @kaiord/core` in CLI package
    - Make a change to core and verify CLI sees it
    - Verify TypeScript types update in CLI
    - _Requirements: 12.4, 12.5_

- [ ] 7. Verify workspace integration

  - [ ] 7.1 Verify CLI package uses workspace protocol

    - Check packages/cli/package.json has "@kaiord/core": "workspace:\*"
    - Verify pnpm resolves to local package
    - _Requirements: 14.1_

  - [ ] 7.2 Test live changes in workspace

    - Make a change to @kaiord/core source
    - Rebuild core: `pnpm run build`
    - Verify CLI sees the change without reinstalling
    - _Requirements: 14.2_

  - [ ] 7.3 Verify TypeScript project references

    - Check tsconfig.json has composite: true
    - Check CLI's tsconfig.json references core
    - Verify IDE provides type information from core
    - _Requirements: 14.3, 14.6_

  - [ ] 7.4 Test monorepo build order

    - Run `pnpm -r build` from root
    - Verify core builds before CLI
    - Verify CLI uses core's dist/ output
    - _Requirements: 14.4, 14.7_

  - [ ] 7.5 Test monorepo test execution
    - Run `pnpm -r test` from root
    - Verify tests in CLI use local core implementation
    - _Requirements: 14.5_

- [ ] 8. Create publishing documentation

  - [ ] 8.1 Create docs/publishing.md with workflow

    - Document pre-publish checklist (tests, licenses, build, pack)
    - Document version management (npm version patch/minor/major)
    - Document publishing steps (npm publish, verification)
    - Document post-publish verification
    - _Requirements: 13.3, 13.9_

  - [ ] 8.2 Document npm pack testing workflow

    - Step-by-step guide for creating and testing tarball
    - Examples of inspecting tarball contents
    - Examples of installing in test projects
    - _Requirements: 12.1, 12.2, 12.6_

  - [ ] 8.3 Document npm link workflow

    - Step-by-step guide for linking packages
    - Examples of using linked packages in development
    - How to unlink when done
    - _Requirements: 12.4, 12.5_

  - [ ] 8.4 Document dry-run publishing
    - How to use `npm publish --dry-run`
    - What to look for in dry-run output
    - _Requirements: 13.9_

- [ ] 9. Perform final pre-publish verification

  - [ ] 9.1 Run all tests and verify coverage

    - Execute `pnpm run test`
    - Execute `pnpm run test:coverage`
    - Verify coverage meets ≥80% requirement
    - _Requirements: 15.1, 15.2_

  - [ ] 9.2 Run linter and fix issues

    - Execute `pnpm run lint`
    - Fix any linting errors
    - _Requirements: 15.1_

  - [ ] 9.3 Run license checker

    - Execute `pnpm run check:licenses`
    - Verify all dependencies have compatible licenses
    - _Requirements: 16.1, 16.2, 16.6_

  - [ ] 9.4 Build and verify output

    - Execute `pnpm run build`
    - Verify dist/ contains index.js and index.d.ts
    - Verify schema/ contains generated JSON schemas
    - _Requirements: 13.1, 13.4, 13.7, 13.8, 15.3_

  - [ ] 9.5 Test with npm pack one final time

    - Create tarball with `pnpm pack`
    - Install in fresh test project
    - Run comprehensive test of all exports
    - _Requirements: 12.1, 12.2, 12.3_

  - [ ] 9.6 Run dry-run publish
    - Execute `npm publish --dry-run`
    - Review what would be published
    - Verify file list matches expectations
    - _Requirements: 13.9, 15.6_

- [ ] 10. Create contribution guidelines

  - [ ] 10.1 Create CONTRIBUTING.md

    - Document how to set up development environment
    - Document how to run tests
    - Document code style guidelines
    - Document commit message conventions
    - Document PR process
    - _Requirements: 17.2, 17.4_

  - [ ] 10.2 Update README with contribution section

    - Link to CONTRIBUTING.md
    - Link to issue tracker
    - Add "Contributing" section with quick links
    - _Requirements: 17.1, 17.2_

  - [ ] 10.3 Document architecture for contributors

    - Create or update docs/architecture.md
    - Explain hexagonal architecture
    - Explain domain/application/ports/adapters layers
    - Explain dependency injection pattern
    - _Requirements: 17.3_

  - [ ] 10.4 Add CI checks documentation
    - Document what CI checks run on PRs
    - Document how to run checks locally
    - Document how to fix common CI failures
    - _Requirements: 17.5_
