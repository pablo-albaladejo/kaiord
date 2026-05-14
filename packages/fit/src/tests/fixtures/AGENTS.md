<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# fixtures

## Purpose

Test fixture builders using rosie factory pattern. Generates valid domain objects (Duration, Target, etc.) for unit and integration test setup.

## Key Files

| File                       | Description                                                             |
| -------------------------- | ----------------------------------------------------------------------- |
| `fit-duration.fixtures.ts` | Rosie builders for KRD duration types (simple, repeat, conditional).    |
| `fit-target.fixtures.ts`   | Rosie builders for KRD target types (power, HR, cadence, pace, stroke). |

## Subdirectories

None.

## For AI Agents

### Working In This Directory

- **Builder pattern:** Use rosie `Builder` class with `.attrs()` to define default test objects.
- **Builders exported:** Each file exports named builders (e.g., `simpleDurationBuilder`, `powerTargetBuilder`).
- **Usage:** Call `.build()` to generate a new instance; override with `.build({ override })`.

### Testing Requirements

- Fixture builders must generate valid objects (pass Zod schemas).
- Builders should cover all variant types (duration: simple/repeat/conditional; target: power/HR/cadence/pace/stroke).

### Common Patterns

- **Rosie builder:** `new Builder().attrs({...}).build()`.
- **Default values:** Builders set sensible defaults (e.g., 60-second duration, 200W power target).

## Dependencies

### Internal

- `@kaiord/core` - Domain types.
- `../../test-utils/` - Test constants.

### External

- `rosie` ^2.1.1 - Factory builder.
- `@faker-js/faker` ^10.4.0 - Fake data generation (optional).

<!-- MANUAL: -->
