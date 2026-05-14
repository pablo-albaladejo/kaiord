<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# docs

## Purpose

Comprehensive documentation for @kaiord/garmin adapter. Covers GCN format analysis, API findings, schema design, implementation details, testing strategies, and round-trip validation results.

## Key Files

| File                        | Description                                                                                  |
| --------------------------- | -------------------------------------------------------------------------------------------- |
| `README.md`                 | Documentation index and navigation hub. Entry point for all package docs.                    |
| `IMPLEMENTATION.md`         | Complete implementation guide with code examples, architecture diagrams, and patterns.       |
| `API-FINDINGS.md`           | Garmin Connect API research and findings. Complete API documentation from live testing.      |
| `INPUT-VS-OUTPUT.md`        | Critical schema asymmetry documentation. Explains flexible input vs strict output contracts. |
| `SCHEMA-VALIDATION.md`      | Schema validation report. Results of validating 21 schemas against 6 fixtures.               |
| `TEST-RESULTS.md`           | Real API test results. 6 workouts created successfully on Garmin Connect.                    |
| `TESTING-GUIDE.md`          | How to run live API tests. Credential setup, troubleshooting, test execution.                |
| `MASTER-INDEX.md`           | Navigation hub for research phase documents (legacy).                                        |
| `MULTISPORT-TRANSITIONS.md` | Multisport support and transition flag handling.                                             |

## For AI Agents

### Working In This Directory

**Documentation Scope:**

- These docs are **reference material**, not code.
- They explain design decisions, API quirks, and testing approaches.
- Keep docs in sync with actual implementation (code is source of truth).

**Key Documentation Relationships:**

- `README.md` → entry point and index.
- `IMPLEMENTATION.md` → code patterns, architecture, usage examples.
- `API-FINDINGS.md` → API contracts, field meanings, quirks discovered during research.
- `INPUT-VS-OUTPUT.md` → schema design rationale (why input and output differ).
- `SCHEMA-VALIDATION.md` → validation results from research phase.
- `TEST-RESULTS.md` → live API test evidence.
- `TESTING-GUIDE.md` → how to reproduce tests, credential setup.

**Update Process:**

1. When changing converter logic: update `IMPLEMENTATION.md` code examples.
2. When changing schema structure: update `INPUT-VS-OUTPUT.md` and `SCHEMA-VALIDATION.md`.
3. When discovering API quirks: document in `API-FINDINGS.md`.
4. When updating test strategy: update `TESTING-GUIDE.md`.
5. After docs update: refresh `README.md` index if needed.

### Key Design Artifacts

**From API-FINDINGS.md:**

- Garmin API accepts flexible input (strings or numbers for targets).
- Garmin API returns strict output (numbers only, expanded type objects).
- No subsport support in structured workout API.
- Multisport support via `sportTypeId: 10` with multiple `workoutSegments`.
- Input/output schema asymmetry is intentional and documented.

**From INPUT-VS-OUTPUT.md:**

- Input schema: unions, optional fields, minimal type objects.
- Output schema: required fields, numeric types, expanded type objects.
- Type objects in output include `displayOrder`, `unitId`, `factor`.
- Server-assigned fields: `workoutId`, `stepId`, `childStepId`, `createdAt`, `updatedAt`.

**From MULTISPORT-TRANSITIONS.md:**

- Transition flag: `isSessionTransitionEnabled` in GCN input/output.
- Preserved in KRD via `extensions.gcn.isSessionTransitionEnabled`.
- Global `stepOrder` across all multisport segments (not per-segment).

### Testing Documentation

**From TESTING-GUIDE.md:**

- How to set up Garmin Connect credentials.
- How to run live API tests against real API.
- How to troubleshoot authentication and submission failures.

**From TEST-RESULTS.md:**

- Evidence: 6 workouts created successfully on Garmin Connect.
- Real API responses showing schema differences between input and output.
- Input vs output comparison for each fixture.

### Common Patterns

**Update Code Example in Docs:**

1. Copy current example from source file.
2. Paste into relevant doc section.
3. Add context and explanation.
4. Mark example with line numbers for future reference.

**Reference Real Fixtures:**

- Docs should reference `test-fixtures/gcn/*.gcn` by filename.
- Example: "See `test-fixtures/gcn/WorkoutRunningNestedRepeatsOutput.gcn` for real API response."

**Link Between Docs:**

- Use relative links: `[IMPLEMENTATION.md](./IMPLEMENTATION.md)`.
- Cross-reference: "See §Input vs Output Asymmetry in INPUT-VS-OUTPUT.md".

## Dependencies

### Internal

- Implementation in `../src/` (docs are reference only).
- Fixtures in `../../test-fixtures/gcn/` (referenced, not included here).

### External

- None (docs are markdown only).

## Maintenance Notes

- **Last Updated:** 2026-02-08 (see README.md header).
- **Fixture Status:** 6 fixtures (3 input + 3 output) for basic coverage; 12 total files (6 pairs).
- **API Status:** Phase 1 (format conversion) complete; Phase 2 (API client) deferred to future release.

<!-- MANUAL: -->
