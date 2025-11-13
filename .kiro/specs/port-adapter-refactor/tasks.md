# Implementation Plan

- [-] 1. Refactor PORT definitions to function types

  - Update `fit-reader.ts` to use direct function type
  - Update `fit-writer.ts` to use direct function type
  - Verify TypeScript compilation (expect errors in dependent files)
  - _Requirements: 1.1, 1.2, 1.3, 1.5_

- [ ] 2. Refactor ADAPTER implementations
- [ ] 2.1 Update FIT reader adapter

  - Modify `createGarminFitSdkReader` to return direct function
  - Maintain all error handling and logging logic
  - Verify implementation matches PORT signature
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 2.2 Update FIT writer adapter

  - Modify `createGarminFitSdkWriter` to return direct function
  - Maintain all error handling and logging logic
  - Verify implementation matches PORT signature
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 3. Update use-case implementations
- [ ] 3.1 Update convert-fit-to-krd use-case

  - Change `fitReader.readToKRD(buffer)` to `fitReader(buffer)`
  - Verify all business logic remains unchanged
  - Verify TypeScript compilation
  - _Requirements: 3.1, 3.2, 3.4, 3.5_

- [ ] 3.2 Update convert-krd-to-fit use-case

  - Change `fitWriter.writeFromKRD(krd)` to `fitWriter(krd)`
  - Verify all business logic remains unchanged
  - Verify TypeScript compilation
  - _Requirements: 3.1, 3.3, 3.4, 3.5_

- [ ] 3.3 Update validate-round-trip use-case (if exists)

  - Update all fitReader and fitWriter calls
  - Verify all business logic remains unchanged
  - Verify TypeScript compilation
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 4. Update test files
- [ ] 4.1 Update convert-fit-to-krd tests

  - Change mock creation to `vi.fn<FitReader>()`
  - Update mock assertions to use direct function calls
  - Run tests and verify all pass
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 4.2 Update convert-krd-to-fit tests

  - Change mock creation to `vi.fn<FitWriter>()`
  - Update mock assertions to use direct function calls
  - Run tests and verify all pass
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 4.3 Update adapter tests (if needed)

  - Review garmin-fitsdk.test.ts for any needed changes
  - Update if adapter tests mock the PORT
  - Run tests and verify all pass
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 5. Update provider composition

  - Review `application/providers.ts` for any needed changes
  - Verify factory function calls remain unchanged
  - Verify use-case composition works correctly
  - Test CLI commands to ensure they work
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 6. Run comprehensive test suite

  - Execute `pnpm test` in packages/core
  - Verify 100% of tests pass
  - Check test coverage remains at target levels
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 7. Validate with integration tests

  - Run round-trip conversion tests
  - Verify FIT → KRD → FIT produces identical results
  - Verify all tolerance checks pass
  - Test with real FIT files from fixtures
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 8. Update steering documentation
  - Add migration completion note to `port-adapter-pattern.md`
  - Update code examples to match refactored implementation
  - Document any lessons learned
  - Verify all examples compile and work
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
