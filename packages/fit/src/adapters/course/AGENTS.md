<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# course

## Purpose

GPS course (route) file mapping. Converts FIT course files (course message + course point messages) to KRD course records and vice versa. Aggregates course points with GPS coordinates, elevation, and optional names/types.

## Key Files

| File                         | Description                                                       |
| ---------------------------- | ----------------------------------------------------------------- |
| `index.ts`                   | Exports course converters.                                        |
| `course.mapper.ts`           | Maps FIT course message to KRD course metadata.                   |
| `course-messages.creator.ts` | Builds FIT course and course point messages from KRD course data. |

## Subdirectories

None.

## For AI Agents

### Working In This Directory

- **FIT course message:** name, distance, course type (loop, point-to-point).
- **FIT course point messages:** timestamp, position (lat/lon as semicircles), altitude, course point type (generic, summit, valley, water, food, danger, left turn, right turn, segment start, segment end).
- **KRD course:** Name, distance, points array (CoursePoint[] with coordinates, elevation, type).
- **Coordinate conversion:** FIT uses semicircles (2^31 = 180°); converted via `../shared/coordinate.converter.ts`.

### Testing Requirements

- Unit tests for course and course point mapping.
- Integration tests for full course file conversion.
- Round-trip tests verify coordinate precision.

### Common Patterns

- **Course point type:** FIT enum (0–11) mapped to KRD string (e.g., "generic", "summit", "food").
- **Coordinate batching:** Course files can have 1000s of points; batch processing for performance.

## Dependencies

### Internal

- `@kaiord/core` - KRD, Course, CoursePoint, Logger.
- `../shared/` - Coordinate conversion.

### External

None.

<!-- MANUAL: -->
