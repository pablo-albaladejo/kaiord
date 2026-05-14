<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# schemas

## Purpose

Zod schemas for FIT domain types. Defines enums and validators for FIT message keys, sport/sub-sport, file type, duration type, target type, event type, equipment, and other FIT fields. Single source of truth for FIT type validation across adapters.

## Key Files

| File                  | Description                                                                                         |
| --------------------- | --------------------------------------------------------------------------------------------------- |
| `fit-message-keys.ts` | FIT message type keys (fileIdMesgs, workoutMesgs, recordMesgs, sessionMesgs, lapMesgs, eventMesgs). |
| `fit-sport.ts`        | Sport enum (cycling, running, swimming, etc.).                                                      |
| `fit-sub-sport.ts`    | Sub-sport enum (road, mtb, track, indoor, etc.).                                                    |
| `fit-file-type.ts`    | File type enum (workout, activity, course, etc.).                                                   |
| `fit-duration.ts`     | Duration type enum (time, distance, HR zone, power zone, etc.).                                     |
| `fit-target.ts`       | Target type enum (power, HR, cadence, speed, swim stroke).                                          |
| `fit-event.ts`        | Event type enum (start, stop, marker, pause, unpause).                                              |
| `fit-equipment.ts`    | Equipment enum (bike, shoes, etc.).                                                                 |
| `fit-lap-trigger.ts`  | Lap trigger enum (manual, distance, position, power, cadence, HR, time).                            |
| `fit-lap.ts`          | Lap message schema.                                                                                 |
| `fit-session.ts`      | Session message schema.                                                                             |
| `fit-record.ts`       | Record message schema.                                                                              |
| `fit-course.ts`       | Course message schema.                                                                              |
| `fit-course-point.ts` | Course point message schema.                                                                        |

## Subdirectories

None.

## For AI Agents

### Working In This Directory

- **Pure schemas:** No logic, no imports outside Zod.
- **Enum definitions:** Each schema is a Zod enum; access values via `.enum` property (e.g., `sportSchema.enum.cycling`).
- **Message schemas:** Zod objects describing FIT message structure (required and optional fields).
- **Type safety:** Generated TypeScript types via `z.infer<typeof schema>`.

### Testing Requirements

- No runtime tests needed; schemas are validated at compile time via TypeScript.
- Integration tests verify schema alignment with actual FIT messages (in adapter tests).

### Common Patterns

- **Sport enum:** Domain uses snake_case (indoor_cycling); FIT uses camelCase or enum numbers.
- **All schemas Zod:** `z.enum([...])`, `z.object({...})`, etc.

## Dependencies

### Internal

None.

### External

- `zod` ^4.4.3 - Schema definition and runtime validation.

<!-- MANUAL: -->
