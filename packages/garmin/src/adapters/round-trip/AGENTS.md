<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# src/adapters/round-trip

## Purpose

End-to-end integration tests for GCN ↔ KRD conversion. Verify full workflows with real fixtures, round-trip fidelity, and tolerance boundaries.

## Key Files

| File                 | Description                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------- |
| `round-trip.test.ts` | Integration tests for all fixture pairs: GCN → KRD → GCN round-trip with real API payloads. |

## For AI Agents

### Working In This Directory

**Test Scope:**

- Full conversion pipeline: GCN JSON → KRD → GCN JSON.
- Real fixtures: `test-fixtures/gcn/` contains input and output pairs from live API.
- Verify no data loss, field mapping accuracy, and round-trip tolerance.

**Fixture Organization:**

- Input files: `*Input.gcn` — minimal payloads for API submission.
- Output files: `*Output.gcn` — complete API responses with server-assigned fields.
- Paired files: `WorkoutRunningNestedRepeatsInput.gcn` + `WorkoutRunningNestedRepeatsOutput.gcn`.

**Test Pattern:**

```typescript
it("should round-trip WorkoutRunningNestedRepeats", () => {
  // Arrange
  const inputGcn = loadFixture("WorkoutRunningNestedRepeatsInput.gcn");
  const outputGcn = loadFixture("WorkoutRunningNestedRepeatsOutput.gcn");

  // Act
  const krd = gcnReader.read(inputGcn); // or outputGcn
  const roundTrip = gcnWriter.write(krd);

  // Assert
  expect(roundTrip).toMatchObject(/* output shape, within tolerance */);
});
```

**Tolerance Validation:**

- Time: ±1s
- Power: ±1W or ±1%FTP
- Heart rate: ±1bpm
- Cadence: ±1rpm
- Apply tolerances when comparing numeric fields.

### Testing Requirements

**Coverage:** Included in overall 80%+ adapter layer coverage.

**Test Conventions:**

- Every `it()` title starts with `"should "`.
- Every `it()` body has `// Arrange`, `// Act`, `// Assert` sections.

**Fixture Coverage:**

- Running with nested repeats: all step types, HR zones/ranges.
- Cycling with power/cadence: power zones, speed, cadence targets.
- Swimming with all strokes: all 6 strokes, all 6 equipment types.
- Strength with reps: reps condition type.
- Edge cases: long names (255 char truncation), single iteration.
- Multisport triathlon: multiple segments with different sports.

### Common Patterns

**Load Fixture Helper:**

```typescript
const loadFixture = (filename: string): string =>
  readFileSync(`test-fixtures/gcn/${filename}`, "utf-8");
```

**Compare with Tolerance:**

```typescript
const withTolerance = (actual: number, expected: number, tolerance: number) =>
  Math.abs(actual - expected) <= tolerance;

expect(withTolerance(actual.power, expected.power, 1)).toBe(true); // ±1W
```

**Assert Fixture Exists:**

```typescript
// Verify both input and output fixtures exist
const inputExists = existsSync(
  "test-fixtures/gcn/WorkoutRunningNestedRepeatsInput.gcn"
);
const outputExists = existsSync(
  "test-fixtures/gcn/WorkoutRunningNestedRepeatsOutput.gcn"
);
expect(inputExists && outputExists).toBe(true);
```

### Error Cases

**Invalid GCN:**

- Malformed JSON → `createGarminParsingError()`.
- Missing required field → schema validation error.
- Unsupported sport → mapping error.

**Invalid KRD:**

- Missing `extensions.structured_workout` → descriptive error.
- Invalid sport type → mapping error.

## Dependencies

### Internal

- `garmin-reader.ts`: Read GCN → KRD.
- `garmin-writer.ts`: Write KRD → GCN.
- `converters/`: Low-level conversion logic.
- Test fixtures: `test-fixtures/gcn/` (project root).

### External

- `vitest`: Test runner.

<!-- MANUAL: -->
