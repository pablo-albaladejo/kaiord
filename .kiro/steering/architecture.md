# Architecture — Hexagonal & DI

Layers:

- **domain/** — pure KRD types & rules
  - **domain/schemas/** — Zod schemas for KRD format (snake_case conventions)
  - **domain/validation/** — Business validators (not Zod)
  - **domain/types/** — Error types and domain-specific types
- **application/** — use-cases; depends on `ports/` only
- **ports/** — I/O contracts (Fit/Tcx/Zwift Reader/Writer)
- **adapters/** — concrete implementations (e.g., @garmin/fitsdk, XML parsers)
  - **adapters/fit/schemas/** — Zod schemas for FIT SDK format (camelCase conventions)
  - **adapters/fit/** — FIT-specific mappers and converters
- **cli/** — end-user commands; depends on `application`

Rules:

- `domain` depends on no one
- `application` MUST NOT import external libs nor `adapters/`
- `adapters` implement `ports` and may use external libs
- Default wiring lives in `application/providers.ts` (single swap point)

## Schema Organization

### Domain Schemas (KRD Format)

Domain schemas represent the canonical KRD format and use **snake_case** for multi-word enum values:

```
domain/schemas/
├── sport.ts              # sportSchema + Sport type
├── sub-sport.ts          # subSportSchema + SubSport type (snake_case values)
├── file-type.ts          # fileTypeSchema + FileType type
├── swim-stroke.ts        # swimStrokeSchema + SwimStroke type + numeric mappings
├── duration.ts           # durationSchema + Duration type
├── intensity.ts          # intensitySchema + Intensity type
├── target.ts             # targetSchema + Target type
├── target-values.ts      # targetUnitSchema + TargetUnit type
├── workout.ts            # workoutSchema + Workout type
└── krd.ts                # krdSchema + KRD type
```

**Example:**

```typescript
// domain/schemas/sub-sport.ts
export const subSportSchema = z.enum([
  "generic",
  "indoor_cycling", // snake_case
  "hand_cycling", // snake_case
  "lap_swimming", // snake_case
  // ...
]);
```

### Adapter Schemas (FIT SDK Format)

Adapter schemas represent external format-specific concepts and use **camelCase** to match the Garmin SDK:

```
adapters/fit/schemas/
├── fit-sport.ts          # fitSportSchema + FitSport type
├── fit-sub-sport.ts      # fitSubSportSchema + FitSubSport type (camelCase values)
├── fit-duration.ts       # fitDurationTypeSchema + FitDurationType type
├── fit-target.ts         # fitTargetTypeSchema + FitTargetType type
└── fit-message-keys.ts   # fitMessageKeySchema + FitMessageKey type
```

**Example:**

```typescript
// adapters/fit/schemas/fit-sub-sport.ts
export const fitSubSportSchema = z.enum([
  "generic",
  "indoorCycling", // camelCase
  "handCycling", // camelCase
  "lapSwimming", // camelCase
  // ...
]);
```

### Schema Separation Rationale

- **Domain schemas** define the canonical KRD format (our single source of truth)
- **Adapter schemas** define external format-specific concepts (FIT SDK, TCX, Zwift)
- **Clear boundaries** prevent domain contamination with adapter-specific details
- **Bidirectional mapping** between domain and adapter schemas happens in mappers
- **Domain never imports adapters** - maintains hexagonal architecture integrity
