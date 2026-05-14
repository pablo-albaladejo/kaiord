<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/types/`

## Purpose

Shared Zod schemas and derived TypeScript types referenced by both tool
registrations and pipeline helpers. Centralising them avoids drift between
the format enum exposed to MCP clients and the internal `FORMAT_REGISTRY`.

## Key Files

- `tool-schemas.ts` —
  - `formatSchema = z.enum(["fit", "tcx", "zwo", "gcn", "krd"])`.
  - `type FileFormat = z.infer<typeof formatSchema>`.
  - `BINARY_FORMATS: ReadonlySet<FileFormat> = new Set(["fit"])`.
  - `isBinaryFormat(format): boolean` — `BINARY_FORMATS.has(format)`.
- `tool-schemas.test.ts` — exercises `formatSchema` parsing (valid/invalid),
  the `BINARY_FORMATS` membership, and the `isBinaryFormat` helper.

## Subdirectories

(none)

## For AI Agents

### Working In This Directory

- Adding a new format requires updates **here** plus in
  `../utils/format-registry.ts`. If you add a binary format, add it to
  `BINARY_FORMATS` as well so `convertToKrd` / `convertFromKrd` route it
  correctly.
- This file is re-exported from `src/index.ts` (`formatSchema`,
  `FileFormat`), so the enum is part of the package's public API — do not
  remove members without a major-version bump.
- Use `type` aliases for inferred types (`type FileFormat = z.infer<...>`),
  not `interface`.

### Testing Requirements

- `tool-schemas.test.ts` lives alongside the source. `it()` titles start
  with `"should "`; bodies use Pascal `// Arrange` / `// Act` /
  `// Assert`.
- Negative cases use `INVALID_NUMERIC_FORMAT` from `../test-utils/constants`.

### Common Patterns

- Single source of truth for the format enum; everything else references
  this schema rather than redeclaring the union.

## Dependencies

### Internal

(none)

### External

- `zod` — `z.enum`, `z.infer`.

<!-- MANUAL: -->
