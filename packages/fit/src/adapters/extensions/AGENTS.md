<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# extensions

## Purpose

Developer field and unknown message extraction. Preserves FIT SDK extensions (non-standard Garmin extensions and unrecognized message types) for round-trip fidelity.

## Key Files

| File                            | Description                                                                        |
| ------------------------------- | ---------------------------------------------------------------------------------- |
| `extensions.extractor.ts`       | Extracts unknown messages and developer fields from FIT messages for preservation. |
| `developer-fields.extractor.ts` | Extracts developer field definitions and values from FIT messages.                 |

## Subdirectories

None.

## For AI Agents

### Working In This Directory

- **Developer fields:** Garmin FIT SDK extension mechanism allowing custom fields in standard messages. Extracted and stored in `KRD.extensions.developerFields`.
- **Unknown messages:** Non-standard message types not recognized by FIT SDK. Extracted and stored in `KRD.extensions.unknownMessages`.
- **Preservation:** Extensions enable round-trip conversion without data loss (FIT → KRD → FIT preserves custom fields).

### Testing Requirements

- Unit tests for developer field and unknown message extraction.
- Round-trip tests verify extensions are preserved.

### Common Patterns

- **Developer field structure:** Each has fieldDefinitionNumber, fieldName, nativeMesgNum (target message type), value.
- **Unknown message storage:** Keyed by message type identifier; values are arrays of message objects.

## Dependencies

### Internal

- `@kaiord/core` - KRD, Logger.
- `../shared/` - FIT types.

### External

None.

<!-- MANUAL: -->
