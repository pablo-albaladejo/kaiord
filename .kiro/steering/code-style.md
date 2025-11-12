# Code Style

## General

- TS strict; ESLint + Prettier; **NO `any` types allowed** (implicit or explicit) without explicit justification
- Functions < 40 LOC; SRP; SOLID
- No `console.log` in libraries (inject logger if needed)
- Naming: `toKRD`, `fromKRD`, `parseX`, `writeX`
- Prefer `Array<T>` for public types
- **Avoid redundant type annotations** - let TypeScript infer types when possible

```typescript
// ✅ Preferred - Type inference
const metadata = buildKRDMetadata.build({ created: "2025-01-15T10:30:00Z" });

// ❌ Avoid - Redundant annotation
const metadata: KRDMetadata = buildKRDMetadata.build({
  created: "2025-01-15T10:30:00Z",
});
```

## Type Definitions

- **Use `type` instead of `interface`** for all type definitions
- Prefer type aliases for better composition and union types

```typescript
// ✅ Preferred
export type KRD = {
  version: string;
  type: "workout" | "activity";
};

// ❌ Avoid
export interface KRD {
  version: string;
  type: "workout" | "activity";
}
```

## Implementation Style

- **Use functions instead of classes** (functional programming style)
- **Factory functions** (e.g., `createValidator()`) instead of constructors
- **Pure functions** where possible, avoiding mutable state
- **Composition over inheritance**

```typescript
// ✅ Preferred - Factory function
export type Validator = {
  validate: (data: unknown) => ValidationError[];
};

export const createValidator = (): Validator => ({
  validate: (data) => {
    /* ... */
  },
});

// ❌ Avoid - Class-based
export class Validator {
  validate(data: unknown) {
    /* ... */
  }
}
```

## Import Style

- **Separate type imports from value imports** using `import type`
- **Avoid barrel imports** (index.ts re-exports) - import directly from source files

```typescript
// ✅ Preferred - Separate type imports
import { readFile } from "./file-reader";
import type { FileOptions } from "./file-reader";

// ✅ Preferred - Direct imports
import { createValidator } from "./domain/validation/schema-validator";
import type { ValidationError } from "./domain/validation/schema-validator";

// ❌ Avoid - Mixed imports
import { readFile, FileOptions } from "./file-reader";

// ❌ Avoid - Barrel imports
import { createValidator } from "./domain"; // re-exported from index.ts
```

## Comments

- **Only comment complex logic or non-obvious decisions**
- **Never describe what the code does** - the code should be self-explanatory
- **Avoid obvious comments** - they add noise without value

```typescript
// ❌ Avoid - Obvious comments
// Create a validator
const validator = createValidator();

// Loop through errors
for (const error of errors) {
  // Log the error
  logger.error(error.message);
}

// ✅ Preferred - Only comment non-obvious decisions
// Using FTP percentage instead of absolute watts because
// the user's FTP may change between workout creation and execution
const powerTarget = { unit: "percent_ftp", value: 85 };

// ✅ Preferred - Comment complex algorithms
// Binary search for optimal cadence zone (O(log n))
// Zones are pre-sorted by lower bound
const findZone = (cadence: number, zones: Array<Zone>): Zone => {
  // ... complex implementation
};
```

## Testing

- **Follow AAA pattern** (Arrange, Act, Assert) for all tests
- Use blank lines to separate the three sections
- Keep each section focused and minimal

```typescript
// ✅ Preferred - AAA pattern
test("should validate KRD against schema", () => {
  // Arrange
  const validator = createSchemaValidator(mockLogger);
  const invalidKrd = { version: "1.0" }; // missing required fields

  // Act
  const errors = validator.validate(invalidKrd);

  // Assert
  expect(errors).toHaveLength(2);
  expect(errors[0].field).toBe("type");
  expect(errors[1].field).toBe("metadata");
});

// ❌ Avoid - Mixed sections
test("should validate KRD against schema", () => {
  const validator = createSchemaValidator(mockLogger);
  expect(validator).toBeDefined();
  const invalidKrd = { version: "1.0" };
  const errors = validator.validate(invalidKrd);
  expect(errors).toHaveLength(2);
});
```
