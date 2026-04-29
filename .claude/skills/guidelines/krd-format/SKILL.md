---
name: krd-format
description: Read this guideline when working with KRD schemas, writing converters or mappers, designing specs that reference KRD fields, or generating GCN/FIT/TCX output. Also read when files are under packages/core/src/domain/schemas/ or contain KRD field references.
---

# KRD Format — Kaiord

KRD (Kaiord Representation Definition) is the canonical format. All conversions MUST pass through KRD. Direct format-to-format conversion is forbidden.

MIME type: `application/vnd.kaiord+json`

Normative reference: `openspec/specs/krd-format/spec.md`. Live Zod schemas: `packages/core/src/domain/schemas/`.

## Top-level shape

```
version     (required)
type        (required)
metadata    (required)
sessions    (optional)
laps        (optional)
records     (optional)
events      (optional)
extensions  (optional)
```

## `type` enum

One of: `"structured_workout"` | `"recorded_activity"` | `"course"`

Adding a new value is a **breaking change** and requires a migration plan.

## Naming conventions

| Layer | Field names | Enum values |
|-------|-------------|-------------|
| KRD (domain) | camelCase — `subSport`, `durationType`, `heartRate` | snake_case — `"indoor_cycling"`, `"lap_swimming"` |
| Adapters (internal) | camelCase allowed | MUST emit snake_case in KRD output |

Access enum values via `.enum`: `subSportSchema.enum.indoor_cycling`

## Extension namespaces

Reserved: `extensions.structured_workout`, `extensions.fit`, `extensions.course`, `extensions.course_points`

Adapters **MUST NOT drop unknown namespaces** silently. They MUST either round-trip them unchanged or fail with a descriptive error. Per-namespace payload shapes: `openspec/specs/krd-format/spec.md`, Requirement: Extension Namespaces.

## Round-trip tolerances

| Field | Tolerance |
|-------|-----------|
| Time | ±1 second |
| Power | ±1 watt or ±1% FTP |
| Heart Rate | ±1 bpm |
| Cadence | ±1 rpm |
| Distance | ±1 meter |

Every converter that touches a numeric field MUST have round-trip tests within these tolerances.

## Zod schemas location

`packages/core/src/domain/schemas/` — exported via `@kaiord/core`. Import schemas from there; never re-declare them in adapter packages.
