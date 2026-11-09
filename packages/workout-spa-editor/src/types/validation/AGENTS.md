<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/types/validation/`

## Purpose

Formatters that turn Zod errors into UX-friendly `ValidationError[]` shapes.

## Key Files

- `formatters.ts` / `.test.ts` — `formatZodError`, `formatValidationErrors`.

## For AI Agents

### Working In This Directory

1. **Stay pure.** No DOM, no React; this directory is consumed by `application/` and `components/` alike.
2. **Errors carry a `path`** so consumers can drive per-field error display.

### Testing Requirements

- `formatters.test.ts` covers happy + error paths.

## Dependencies

### Internal

- `../krd` (`ValidationError`).

### External

- `zod`.

<!-- MANUAL: -->
