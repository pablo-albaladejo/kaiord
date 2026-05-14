<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# tests

## Purpose

Test fixtures and helper data. Stores domain fixture builders (via rosie factory pattern) and sample test data for unit and integration tests across the fit package.

## Key Files

| File           | Description         |
| -------------- | ------------------- |
| (none at root) | See subdirectories. |

## Subdirectories

| Directory   | Purpose                                                                      |
| ----------- | ---------------------------------------------------------------------------- |
| `fixtures/` | Test fixture builders: duration fixtures, target fixtures (rosie factories). |

## For AI Agents

### Working In This Directory

- **Fixture builders:** Use rosie factory pattern (`Builder.extend()`, `.attrs()`) to generate valid test domain objects.
- **No unit tests here:** This directory holds test utilities only; actual tests are co-located with source code (`*.test.ts`).

### Testing Requirements

- Fixture builders must generate valid objects (pass Zod schemas).
- Fixtures are used in unit and integration tests across adapters.

### Common Patterns

- **Rosie builder:** `const builder = new Builder(); builder.attrs({...}); builder.build()`.

## Dependencies

### Internal

- `@kaiord/core` - Domain types.
- `../test-utils/` - Test constants.

### External

- `rosie` ^2.1.1 - Fixture factory builder.
- `@faker-js/faker` ^10.4.0 - Fake data generation.

<!-- MANUAL: -->
