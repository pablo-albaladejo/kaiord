<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 -->

# round-trip

## Purpose

Integration tests for end-to-end TCX ↔ KRD ↔ TCX conversions. Verifies that reading a TCX file, converting to KRD, and writing back to TCX preserves data within specified tolerances.

## Key Files

| File                 | Description                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------- |
| `round-trip.test.ts` | Integration test suite for complete TCX read/write/read workflows. Validates round-trip fidelity. |

## Subdirectories

None.

## For AI Agents

### Working In This Directory

**Test Scope:**

- Load sample TCX files (real-world or synthetic).
- Parse TCX → KRD via `createFastXmlTcxReader()`.
- Serialize KRD → TCX via `createFastXmlTcxWriter()`.
- Re-parse result TCX → KRD.
- Compare original KRD with re-parsed KRD (within tolerance).

**Round-Trip Tolerances (Enforced):**

- Time: ±1 second.
- Power: ±1 watt or ±1% FTP (whichever is larger).
- Heart rate: ±1 bpm.
- Cadence: ±1 rpm.
- Pace: ±0.01 min/km (unit conversion tolerance).

**Test Data:**

- May use fixtures from test-utils or inline test objects.
- Samples should cover:
  - Single step with time duration and HR zone target.
  - Multiple steps with mixed duration types (time, distance).
  - Repeat/interval structures.
  - Different sport types (running, cycling).
  - Custom extensions (if supported).

### Testing Requirements

**Coverage:**

- Round-trip tests count toward package 80% coverage.
- Exercise major code paths in readers, writers, and all converters.

**Test Conventions:**

- Every `it()` title starts with `"should "`.
- Every `it()` body has `// Arrange`, `// Act`, `// Assert` sections.

**Assertions:**

- Compare KRD objects at semantic level (ignore field order, metadata variations).
- Use tolerance functions for numeric fields (time ±1s, power ±1W, etc.).
- Log original and round-trip values on mismatch for debugging.

### Common Patterns

**Round-Trip Test Structure:**

```typescript
it("should preserve workout through TCX round-trip", () => {
  // Arrange
  const originalTcxString = readFixture("sample.tcx");
  const logger = createConsoleLogger();
  const reader = createFastXmlTcxReader(logger);
  const writer = createFastXmlTcxWriter(logger, validator);

  // Act
  const krdOriginal = await reader(originalTcxString);
  const tcxString = await writer(krdOriginal);
  const krdRoundTrip = await reader(tcxString);

  // Assert
  expectKrdEqual(krdOriginal, krdRoundTrip, {
    timeTolerance: 1, // seconds
    powerTolerance: 1, // watts
    hrTolerance: 1, // bpm
    cadenceTolerance: 1, // rpm
  });
});
```

**Tolerance Helper (Pseudo-code):**

```typescript
const expectKrdEqual = (original: KRD, roundTrip: KRD, tolerances) => {
  expect(roundTrip.name).toBe(original.name);
  // Compare steps with tolerances
  for (let i = 0; i < original.steps.length; i++) {
    const origStep = original.steps[i];
    const rtStep = roundTrip.steps[i];

    // Duration comparison with tolerance
    if (origStep.duration.type === "time") {
      expect(rtStep.duration.duration).toBeCloseTo(
        origStep.duration.duration,
        tolerances.timeTolerance
      );
    }
    // Similar for targets (HR, cadence, etc.)
  }
};
```

**Logging for Debugging:**

- On mismatch, log both original and round-trip KRD objects.
- Include intermediate TCX string for inspection.
- Use `logger.debug()` to trace conversion steps.

## Dependencies

### Internal

- `@kaiord/core`: KRD, Logger types, conversion functions.
- Sibling modules: `../fast-xml-parser.ts` (reader/writer factories).

### External

- `vitest`: Test framework.
