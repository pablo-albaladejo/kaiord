# Testing

- Vitest; coverage ≥ 80% for core package (converters ≥ 90%)
- **Co-located tests**: `file.ts` → `file.test.ts` (same directory)
- **All fixtures**: `src/tests/fixtures/` directory (faker + rosie factories, binary files)
- **Test helpers**: `src/tests/helpers/` directory (mock utilities, test utils)
- **Unit** (converters with logic, validators)
- **Golden** (KRD snapshots, normalized TCX/PWX fragments)
- **Round‑trip** (FIT/TCX/PWX ↔ KRD) with tolerances (±1s, ±1W, ±1bpm, ±1rpm)
- **CLI smoke** (tiny anonymized fixtures < 20KB)

## Mappers vs Converters

### Mappers (\*.mapper.ts)

**Definition**: Simple data transformation functions with NO business logic

- Direct field mapping (e.g., `camelCase` → `snake_case`)
- Enum lookups from static maps
- Simple validation with `.safeParse()` and default fallback
- Delegating to converters for complex logic

**Testing**: ❌ **DO NOT test mappers directly**

- Mappers have no logic to test
- Coverage comes from integration tests, round-trip tests, and converter tests
- If you find yourself writing a test for a mapper, the mapper has too much logic

```typescript
// ✅ Good mapper - No test needed
export const mapSubSportToKrd = (fitSubSport: unknown): SubSport => {
  const result = fitSubSportSchema.safeParse(fitSubSport);
  if (!result.success) return subSportSchema.enum.generic;
  return FIT_TO_KRD_MAP[result.data] || subSportSchema.enum.generic;
};

// ❌ Bad mapper - Has logic, should be a converter
export const mapDuration = (step: FitWorkoutStep): Duration => {
  if (step.durationType === "time") {
    return { type: "time", seconds: step.durationValue * 1000 }; // Logic!
  }
  // ... more logic
};
```

### Converters (\*.converter.ts)

**Definition**: Functions with business logic, calculations, or complex transformations

- Mathematical calculations (unit conversions, offsets)
- Conditional logic based on multiple fields
- Data validation with error handling
- Complex object construction

**Testing**: ✅ **MUST test converters**

- Test all logic paths
- Test edge cases and boundary conditions
- Coverage target: ≥ 90%

```typescript
// ✅ Converter with logic - MUST have tests
export const convertPowerTarget = (step: WorkoutStep): FitTarget => {
  if (step.target.value.unit === "watts") {
    return { targetValue: step.target.value.value + 1000 }; // Garmin offset
  }
  if (step.target.value.unit === "percent_ftp") {
    return { targetValue: step.target.value.value }; // No offset
  }
  // ... more logic
};
```

## What NOT to Test

- **DO NOT test types** - TypeScript validates types at compile time, no runtime tests needed
- **DO NOT test fixtures** - Fixtures are test utilities, not production code. NEVER create `.test.ts` files for fixture files.
- **DO NOT test type definitions** - If it compiles, the types are correct
- **DO NOT test that objects match their type** - This is what TypeScript does
- **DO NOT test mappers** - Simple data transformation with no logic. If you're writing a mapper test, refactor the mapper to remove logic or convert it to a converter.

## Fixture Rules

- **DO NOT validate in fixtures** - Fixtures should NOT call `.parse()` or `.safeParse()` in `.after()` hooks
- **Fixtures generate data, tests validate** - Validation is the responsibility of tests, not fixtures
- **Keep fixtures simple** - Only generate realistic data using faker, no validation logic

```typescript
// ❌ Bad - Validating in fixture
export const buildKRDMetadata = new Factory<KRDMetadata>()
  .attr("created", () => faker.date.recent().toISOString())
  .attr("sport", () => faker.helpers.arrayElement(["running", "cycling"]))
  .after((metadata) => {
    krdMetadataSchema.parse(metadata); // DON'T DO THIS
  });

// ✅ Good - No validation in fixture
export const buildKRDMetadata = new Factory<KRDMetadata>()
  .attr("created", () => faker.date.recent().toISOString())
  .attr("sport", () => faker.helpers.arrayElement(["running", "cycling"]));
```

## What TO Test

- **Business logic** - Converters (with logic), validators, transformations
- **Edge cases** - Boundary conditions, empty inputs, invalid data
- **Integration** - How components work together (includes mapper coverage)
- **Round-trip conversions** - Data integrity through format conversions (includes mapper coverage)
- **Error handling** - How code responds to failures

## Coverage Strategy

Mappers get coverage indirectly through:

1. **Integration tests** - Testing adapters that use mappers
2. **Round-trip tests** - FIT → KRD → FIT conversions
3. **Converter tests** - Converters that call mappers
4. **Use case tests** - End-to-end flows

If a mapper has low coverage after these tests, it means:

- The mapper is not being used (dead code)
- The mapper has logic that should be in a converter
- Missing integration/round-trip test scenarios

## Test Assertions

- **Use `toStrictEqual()` for objects** - Validates complete object structure
- **Use fixtures with `.build()`** - Generate realistic test data
- **Include all fields in assertions** - When using `toStrictEqual()`, specify all fields (use `obj.field` for generated values)
- **One `expect` per object** - Validate entire objects, not individual properties

```typescript
// ✅ Good - Complete object validation
const metadata = buildKRDMetadata.build({
  created: "2025-01-15T10:30:00Z",
  sport: "running",
});

expect(metadata).toStrictEqual({
  created: "2025-01-15T10:30:00Z",
  manufacturer: metadata.manufacturer, // Generated by fixture
  product: metadata.product,
  serialNumber: metadata.serialNumber,
  sport: "running",
  subSport: metadata.subSport,
});

// ❌ Bad - Multiple expects for same object
expect(metadata.created).toBe("2025-01-15T10:30:00Z");
expect(metadata.sport).toBe("running");

// ❌ Bad - Testing types (unnecessary)
const metadata: KRDMetadata = buildKRDMetadata.build();
expect(metadata).toBeDefined(); // TypeScript already validates this
```
