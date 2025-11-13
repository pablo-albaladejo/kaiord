# Architecture — Hexagonal & DI

Layers:

- **domain/** — pure KRD types & rules
  - **domain/schemas/** — Zod schemas for KRD format (snake_case conventions)
  - **domain/validation/** — Business validators (not Zod)
  - **domain/types/** — Error types and domain-specific types
- **application/** — use-cases; depends on `ports/` only
- **ports/** — I/O contracts (Fit/Tcx/Pwx Reader/Writer)
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
├── sport.ts              # sportEnum + Sport type
├── sub-sport.ts          # subSportEnum + SubSport type (snake_case values)
├── file-type.ts          # fileTypeEnum + FileType type
├── swim-stroke.ts        # swimStrokeEnum + SwimStroke type + numeric mappings
├── duration.ts           # durationSchema + Duration type
├── intensity.ts          # intensityEnum + Intensity type
├── target.ts             # targetSchema + Target type
├── target-values.ts      # targetUnitEnum + TargetUnit type
├── workout.ts            # workoutSchema + Workout type
└── krd.ts                # krdSchema + KRD type
```

**Example:**

```typescript
// domain/schemas/sub-sport.ts
export const subSportEnum = z.enum([
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
├── fit-sport.ts          # fitSportEnum + FitSport type
├── fit-sub-sport.ts      # fitSubSportEnum + FitSubSport type (camelCase values)
├── fit-duration.ts       # fitDurationTypeEnum + FitDurationType type
├── fit-target.ts         # fitTargetTypeEnum + FitTargetType type
└── fit-message-keys.ts   # fitMessageKeyEnum + FitMessageKey type
```

**Example:**

```typescript
// adapters/fit/schemas/fit-sub-sport.ts
export const fitSubSportEnum = z.enum([
  "generic",
  "indoorCycling", // camelCase
  "handCycling", // camelCase
  "lapSwimming", // camelCase
  // ...
]);
```

### Schema Separation Rationale

- **Domain schemas** define the canonical KRD format (our single source of truth)
- **Adapter schemas** define external format-specific concepts (FIT SDK, TCX, PWX)
- **Clear boundaries** prevent domain contamination with adapter-specific details
- **Bidirectional mapping** between domain and adapter schemas happens in mappers
- **Domain never imports adapters** - maintains hexagonal architecture integrity
