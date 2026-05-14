<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# shared

## Purpose

Shared utilities for FIT adapters. Provides type definitions (FitMessages, FitFileId, FitWorkoutStep), message number constants, type guards (sport/sub-sport mapping), and coordinate conversion (semicircles ↔ decimal degrees).

## Key Files

| File                      | Description                                                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `types.ts`                | Type definitions for FIT SDK messages (FitMessages, FitFileId, FitWorkoutMessage, FitWorkoutStep, FitRecord, FitDeveloperField).            |
| `message-numbers.ts`      | FIT message number constants (file ID=0, workout=34, workout step=35, lap=21, record=20, session=18, event=21, course=31, course point=32). |
| `type-guards.ts`          | Type guards and mapping functions (mapSportType FIT→KRD, mapSubSportType).                                                                  |
| `coordinate.converter.ts` | Semicircle ↔ decimal degree conversion (2^31 = 180°).                                                                                       |

## Subdirectories

None.

## For AI Agents

### Working In This Directory

- **FitMessages type:** Discriminated union keyed by FIT message type string (fileIdMesgs, workoutMesgs, workoutStepMesgs, sessionMesgs, recordMesgs, lapMesgs, eventMesgs). Each key maps to array of message objects.
- **Message numbers:** Constants for FIT SDK message numbering (used by encoder/decoder).
- **Type guards:** Runtime functions to map FIT enum/string values to KRD domain enums. Called during message mapping.
- **Coordinate math:** Semicircles are signed 32-bit integers where 2^31 = 180°; decode via division by 2^31 × 180, encode via multiplication.

### Testing Requirements

- Unit tests for type guards (sport/sub-sport mapping).
- Coordinate conversion tests verify precision (±5 decimals = ~57cm).
- Integration tests verify type definitions align with actual FIT messages.

### Common Patterns

- **Type guard pattern:** `mapSportType(fitSport: string): KrdSport` performs safe enum mapping with fallback.
- **Coordinate precision:** Round to 5 decimals for round-trip tolerance.

## Dependencies

### Internal

- `@kaiord/core` - Domain types, schemas.

### External

None.

<!-- MANUAL: -->
