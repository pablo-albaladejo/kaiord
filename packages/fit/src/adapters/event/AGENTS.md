<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# event

## Purpose

Event message conversion. Maps FIT event messages (start, stop, markers) to KRD event records and vice versa. Handles event types (start, stop, marker, pause, unpause) and event data fields.

## Key Files

| File                            | Description                                                        |
| ------------------------------- | ------------------------------------------------------------------ |
| `index.ts`                      | Exports converter types.                                           |
| `event.mapper.ts`               | Maps FIT event fields to KRD event fields.                         |
| `fit-to-krd-event.converter.ts` | Converts FIT event message to KRD event record.                    |
| `krd-to-fit-event.converter.ts` | Converts KRD event record to FIT event message.                    |
| `event-type-maps.ts`            | Bidirectional FIT event type enum ↔ KRD event type string mapping. |

## Subdirectories

None.

## For AI Agents

### Working In This Directory

- **FIT event fields:** timestamp, event (type), eventType (subtype), eventData (numeric payload).
- **KRD event fields:** timestamp, type (string: "start", "stop", "marker", "pause", "unpause"), data (optional numeric).
- **Event type mapping:** FIT enum values (0=start, 1=stop, etc.) mapped via `event-type-maps.ts` to KRD string types.
- **Event data:** FIT eventData is a numeric field (optional); KRD data is optional.

### Testing Requirements

- Unit tests for event type enum mapping.
- Integration tests for event array conversion.
- Tests verify bidirectional mapping correctness.

### Common Patterns

- **Event type dispatch:** `event-type-maps.ts` provides FIT→KRD and KRD→FIT lookup maps.
- **Optional data:** If FIT eventData is 0 or undefined, omit in KRD.

## Dependencies

### Internal

- `@kaiord/core` - KRD, Event, Logger.

### External

None.

<!-- MANUAL: -->
