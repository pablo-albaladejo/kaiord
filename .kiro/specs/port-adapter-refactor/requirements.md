# Requirements Document

## Introduction

Refactor the existing Port-Adapter implementation in Kaiord to follow the functional pattern documented in the steering guides. The current implementation uses object-with-methods pattern, and we need to migrate to direct function types for better composability, simpler mocking, and more functional style.

## Glossary

- **PORT**: Type definition (interface/contract) that defines what a service does
- **ADAPTER**: Concrete implementation that fulfills a PORT contract
- **Use-Case**: Business logic orchestration that depends on PORTs
- **Currying**: Higher-order function pattern for dependency injection
- **FitReader**: PORT for reading FIT files and converting to KRD
- **FitWriter**: PORT for writing KRD to FIT files
- **Logger**: PORT for logging operations

## Requirements

### Requirement 1: Refactor PORT Definitions

**User Story:** As a developer, I want PORT types to be simple function signatures, so that they are easier to mock and more composable.

#### Acceptance Criteria

1. WHEN defining a PORT, THE System SHALL use direct function type syntax
2. WHEN a PORT has a single operation, THE System SHALL define it as `type PortName = (params) => Promise<Result>`
3. THE System SHALL NOT use object-with-methods pattern for single-operation PORTs
4. THE System SHALL maintain backward compatibility during migration
5. THE System SHALL update all PORT definitions in `packages/core/src/ports/`

### Requirement 2: Refactor ADAPTER Implementations

**User Story:** As a developer, I want ADAPTER factories to return direct functions, so that the implementation matches the PORT contract exactly.

#### Acceptance Criteria

1. WHEN creating an ADAPTER, THE System SHALL use currying to inject dependencies
2. WHEN an ADAPTER implements a PORT, THE System SHALL return a function that matches the PORT signature
3. THE System SHALL NOT return objects with methods for single-operation adapters
4. THE System SHALL maintain all error handling logic during refactor
5. THE System SHALL update all ADAPTER implementations in `packages/core/src/adapters/`

### Requirement 3: Update Use-Case Implementations

**User Story:** As a developer, I want use-cases to call PORTs as direct functions, so that the code is cleaner and more functional.

#### Acceptance Criteria

1. WHEN a use-case calls a PORT, THE System SHALL invoke it as a direct function
2. WHEN calling FitReader, THE System SHALL use `await fitReader(buffer)` instead of `await fitReader.readToKRD(buffer)`
3. WHEN calling FitWriter, THE System SHALL use `await fitWriter(krd)` instead of `await fitWriter.writeFromKRD(krd)`
4. THE System SHALL maintain all business logic during refactor
5. THE System SHALL update all use-cases in `packages/core/src/application/use-cases/`

### Requirement 4: Update Test Files

**User Story:** As a developer, I want test mocks to use the new pattern, so that tests remain valid and demonstrate best practices.

#### Acceptance Criteria

1. WHEN mocking a PORT in tests, THE System SHALL use `vi.fn<PortType>()` syntax
2. WHEN setting up mock return values, THE System SHALL use `.mockResolvedValue()` directly on the function
3. THE System SHALL NOT create object mocks with method properties
4. THE System SHALL maintain all test assertions and coverage
5. THE System SHALL update all test files that mock PORTs

### Requirement 5: Update Provider Composition

**User Story:** As a developer, I want the provider composition to work seamlessly with the new pattern, so that dependency injection remains clean.

#### Acceptance Criteria

1. WHEN composing providers, THE System SHALL create adapters using factory functions
2. WHEN injecting into use-cases, THE System SHALL pass the direct function references
3. THE System SHALL maintain the same composition API
4. THE System SHALL update `packages/core/src/application/providers.ts`
5. THE System SHALL ensure all entry points continue to work

### Requirement 6: Maintain Backward Compatibility

**User Story:** As a developer, I want the refactor to not break existing functionality, so that the system remains stable.

#### Acceptance Criteria

1. WHEN running existing tests, THE System SHALL pass all tests after refactor
2. WHEN executing CLI commands, THE System SHALL produce identical results
3. WHEN performing round-trip conversions, THE System SHALL maintain data integrity
4. THE System SHALL not change any public API behavior
5. THE System SHALL validate with existing test fixtures

### Requirement 7: Update Documentation

**User Story:** As a developer, I want the steering documents to reflect the completed refactor, so that future code follows the established pattern.

#### Acceptance Criteria

1. WHEN documenting the pattern, THE System SHALL add a migration completion note
2. WHEN providing examples, THE System SHALL use actual code from the repository
3. THE System SHALL update `port-adapter-pattern.md` with migration status
4. THE System SHALL ensure all code examples match the refactored implementation
5. THE System SHALL document any lessons learned during migration
