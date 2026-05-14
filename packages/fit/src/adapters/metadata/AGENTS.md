<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# metadata

## Purpose

FIT file metadata mapping. Converts FIT file ID messages (manufacturer, product, serial number, creation time) and workout headers (sport type) to KRD metadata. Also maps file type (workout, activity, course).

## Key Files

| File                  | Description                                                                                     |
| --------------------- | ----------------------------------------------------------------------------------------------- |
| `metadata.mapper.ts`  | Converts FIT file ID + workout message to KRD metadata (created, manufacturer, product, sport). |
| `file-type.mapper.ts` | Maps FIT file type field (workout=4, activity=20, course=6) to KRD FileType enum.               |

## Subdirectories

None.

## For AI Agents

### Working In This Directory

- **File ID fields:** Manufacturer (enum), product (string or number), serial number (numeric), timeCreated (FIT timestamp or ISO string).
- **Timestamp conversion:** FIT timestamp is seconds since 1989-12-31; convert via FIT Profile or parse as ISO string directly.
- **Sport mapping:** FIT sport field is a string (e.g., "cycling", "running"); mapped to KRD snake_case sport enum via `../shared/type-guards.ts`.
- **Fallback:** If file ID missing, use current date for created timestamp.

### Testing Requirements

- Unit tests for metadata and file-type mapping.
- Tests verify timestamp conversion and sport enum alignment.

### Common Patterns

- **Mappers (not converters):** Simple field extraction and transformation; no logic; no tests for mappers themselves (tested via integration).

## Dependencies

### Internal

- `@kaiord/core` - KRDMetadata, FileType, sport enums, Logger.
- `../shared/` - Type guards (mapSportType).

### External

None.

<!-- MANUAL: -->
