<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# formats

## Purpose

Format specifications and adaptation guides. Documents the canonical KRD format and each supported fitness format (FIT, TCX, ZWO, GCN). Hand-written content explaining format structures, compatibility notes, and conversion strategies.

## Key Files

- `krd.md` — Canonical format specification: schema, types, structure, rationale, conversion center
- `fit.md` — FIT format overview: binary format, Garmin FIT SDK integration, compatibility
- `tcx.md` — TCX format overview: XML structure, Time Zone eXtension, Garmin Connect compatibility
- `zwo.md` — ZWO format overview: Zwift Workout XML, XSD validation, interactive content
- `gcn.md` — Garmin Connect Network format overview: JSON format, proprietary fields, metadata

## Subdirectories

None. All content is in this directory.

## For AI Agents

### Working In This Directory

Edit hand-written Markdown files directly. Each format page explains structure, compatibility, and lossy/lossless conversions.

**Conventions:**

1. Frontmatter: Every .md file needs `title` and `description`.
2. Format tables: Use Markdown tables to show field mappings, type conversions, or compatibility matrices.
3. Code examples: Show JSON (KRD) or XML snippets where relevant. Use ` ```json ``` ` or ` ```xml ``` `.
4. Compatibility notes: Clearly mark lossy conversions and edge cases.
5. Links: Cross-reference API docs (e.g., `/api/fit/functions/createFitReader`) and other format pages.

### Testing Requirements

- **Spelling**: `pnpm --filter @kaiord/docs spellcheck` validates all .md files.
- **Formatting**: `pnpm --filter @kaiord/docs lint:fix` auto-formats with Prettier.
- **Build validation**: `pnpm --filter @kaiord/docs build` catches broken links and incomplete frontmatter.
- **Spec alignment**: KRD spec in `formats/krd.md` should match the actual KRD schema defined in `packages/core/src/domain/`.

### Common Patterns

- **KRD is canonical**: All format pages should show how they map to/from KRD.
- **Binary vs. text**: Distinguish FIT (binary, Garmin SDK) from TCX/ZWO/GCN (XML/JSON, text-based).
- **Conversion loss**: Document what is lost in each direction (e.g., Garmin proprietary fields, time zone info).
- **Adapter pattern**: Each format page references the corresponding adapter (e.g., `@kaiord/fit` for FIT).

## Dependencies

### Internal

- `@kaiord/core` — KRD schema and types (krd.md references this)
- `@kaiord/fit`, `@kaiord/tcx`, `@kaiord/zwo`, `@kaiord/garmin` — Format adapters (each format page references)
- `openspec/specs/` — Format specifications (external reference)
- `/api/` — Cross-references to adapter API docs

### External

- **VitePress** — Renders Markdown to HTML
- **Garmin FIT SDK** — FIT format reference
- **Zwift** — ZWO format definition
- **Garmin Connect** — GCN format reference

<!-- MANUAL: -->

## Notes for Agents

1. **KRD is the universal model**: Every format page should explain conversion to/from KRD. KRD is never lossy; other formats may be.
2. **Format specifications are stable**: FIT, TCX, ZWO, and GCN formats are defined externally. Changes to these specs require careful documentation.
3. **Time handling is critical**: Each format handles time differently (timestamps, time zones, precision). Document clearly.
4. **Metadata preservation**: Different formats carry different metadata. Document what Kaiord preserves vs. discards.
5. **Conversion scenarios**: Document common real-world conversions (e.g., Garmin FIT → Zwift ZWO) and any gotchas.
