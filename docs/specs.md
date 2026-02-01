# Feature Specifications

This document provides an overview of feature specifications for the Kaiord project.

## Core Package (@kaiord/core)

### Implemented Features

#### FIT ↔ KRD Conversion (Complete)

Bidirectional conversion between Garmin FIT workout files and KRD format.

**Key Features:**

- FIT → KRD and KRD → FIT conversion
- Support for power, heart rate, cadence, and pace targets
- Time and distance-based durations
- Repetition blocks
- Swimming workouts (pool length, equipment)
- Advanced duration types (calorie, power conditionals, repeat conditionals)
- Round-trip validation with tolerances

**Implementation:**

- Uses `@garmin/fitsdk` for FIT parsing/encoding
- Hexagonal architecture with ports and adapters
- Zod schemas for type safety
- Comprehensive test coverage (unit, integration, round-trip)

#### TCX ↔ KRD Conversion (Complete)

Bidirectional conversion between Training Center XML (TCX) workout files and KRD format.

**Key Features:**

- TCX → KRD and KRD → TCX conversion
- Support for heart rate, speed, and cadence targets
- Time, distance, and lap button durations
- Repetition blocks
- Extension preservation

**Implementation:**

- Uses `fast-xml-parser` for XML parsing/building
- Shares domain schemas with FIT conversion
- Independent implementation (no FIT dependencies)

#### Zwift ↔ KRD Conversion (Complete)

Bidirectional conversion between Zwift workout files (.zwo format) and KRD format.

**Key Features:**

- Zwift → KRD and KRD → Zwift conversion
- Support for all Zwift interval types (SteadyState, Warmup, Ramp, Cooldown, IntervalsT, FreeRide)
- Power targets (FTP percentage), pace targets, cadence targets
- Time and distance-based durations
- Text events (coaching cues)
- Tags and metadata preservation

## Workout SPA Editor

### Implemented Features (v1.0.0 - v1.2.0)

#### MVP Features

- Workout loading (KRD file upload)
- Step editing (duration, target, intensity)
- Workout saving (KRD file download)
- Add/delete steps
- Theme switching (light/dark)
- Mobile-first responsive design
- Accessibility (WCAG 2.1 AA compliance)

#### Import/Export

- Import workouts from FIT, TCX, ZWO formats
- Export workouts to FIT, TCX, ZWO formats
- Format detection from file extension

#### Drag-and-Drop

- Reorder steps via drag-and-drop
- Touch support for mobile devices
- Visual feedback during drag operations

#### Copy/Paste

- Copy single or multiple steps
- Paste steps at cursor position
- Keyboard shortcuts (Ctrl+C, Ctrl+V)

#### Delete with Undo

- Delete single or multiple steps
- Undo/redo support (Ctrl+Z, Ctrl+Y)
- Undo history (50 states)

#### User Profiles

- Create/edit/delete user profiles
- FTP and max heart rate settings
- Custom training zones (power/HR)
- Profile import/export

#### Workout Library

- Save workouts to local library
- Search, filter, sort workouts
- Tags and difficulty rating
- Thumbnail preview generation

#### Onboarding

- First-time user tutorial
- Contextual tooltips
- Help documentation page

#### Advanced Workout Features

- Swimming workouts (pool length, stroke, equipment)
- Advanced duration types (calories, conditionals)
- Step notes (coaching instructions)
- Workout metadata editing

## Architecture

All conversions follow hexagonal architecture:

```
packages/core/
├── domain/           # Schemas, validation, error types
├── application/      # Use cases
├── ports/            # Reader/writer contracts
└── adapters/         # Format-specific implementations
```

## Testing Strategy

### Unit Tests

- Converters (complex logic)
- Validators
- Error handling

### Integration Tests

- Format → KRD conversion
- KRD → Format conversion
- Extension preservation

### Round-Trip Tests

- Format → KRD → Format with tolerance checking
- Tolerances: time ±1s, power ±1W, HR ±1bpm, cadence ±1rpm

### E2E Tests

- Complete user workflows
- Mobile responsiveness
- Accessibility compliance

## References

- [Architecture](./architecture.md) - Detailed architecture documentation
- [Testing](./testing.md) - Testing guide
- [KRD Format](./krd-format.md) - KRD format specification
