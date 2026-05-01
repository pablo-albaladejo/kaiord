---
name: design-principles
description: Read this guideline when writing or reviewing TypeScript code, naming symbols, refactoring, deciding between type vs interface, or working with schemas, mappers, or converters.
---

# Design Principles — Kaiord

## TypeScript

- Strict mode; no implicit `any`
- Use `type` not `interface`
- Separate type imports: `import type { X } from '...'`
- Factory functions preferred over classes

## File and function size

- Files ≤ 100 lines (tests exempt)
- Functions < 40 LOC (React components < 60 LOC)

## Naming

- All code, comments, commits, and docs **must be in English**
- File names: `kebab-case.ts`
- Zod schemas: camelCase name, e.g. `workoutStepSchema`
- KRD field names: camelCase — `subSport`, `durationType`, `heartRate`
- KRD enum values: snake_case — `"indoor_cycling"`, `"lap_swimming"`
- Access enums via `.enum`: `subSportSchema.enum.indoor_cycling`
- Adapters MAY use camelCase internally but MUST emit snake_case enum values in KRD output

## Mappers vs converters

| File pattern     | When to use                     | Tests               |
| ---------------- | ------------------------------- | ------------------- |
| `*.mapper.ts`    | Simple transformation, no logic | MUST NOT have tests |
| `*.converter.ts` | Complex logic, branching        | MUST have tests     |

Enforcement: scripts/check-mapper-no-tests.mjs (R-MapperNoTests) and scripts/check-converter-has-tests.mjs (R-ConverterHasTests).

## Comments

Write no comments by default. Add one only when the WHY is non-obvious: a hidden constraint, a subtle invariant, a specific bug workaround. Never describe WHAT the code does — well-named identifiers do that.

## Quality

- Zero ESLint warnings, zero TS errors, zero test warnings, zero build warnings
- When existing code violates a rule: fix the code — never relax the rule (no error→warn or warn→off)
- Boy Scout Rule: leave the codebase cleaner than you found it
