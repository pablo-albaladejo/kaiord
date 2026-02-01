---
name: explain-krd
description: Explain the KRD format and its schemas. Use for onboarding or format questions
allowed-tools: Read
---

Explain the KRD (Kaiord Representation Definition) format.

## Main References

- `docs/krd-format.md` - Complete specification
- `packages/core/src/domain/schemas/` - Zod schemas

## KRD Structure

```json
{
  "version": "1.0",
  "type": "workout",
  "metadata": { ... },
  "extensions": {
    "workout": {
      "name": "...",
      "steps": [...]
    }
  }
}
```

## Duration Types

- `time` - Duration in seconds
- `distance` - Distance in meters
- `open` - No limit (manual lap)
- `power_less_than` / `power_greater_than` - Power conditional
- `hr_less_than` / `hr_greater_than` - HR conditional

## Target Types

- `power` - Power target (watts or %FTP)
- `heart_rate` - HR target (bpm or %max)
- `pace` - Pace target
- `cadence` - Cadence target
- `open` - No target

## Naming Conventions

| Layer    | Style      | Example                          |
| -------- | ---------- | -------------------------------- |
| Domain   | snake_case | `indoor_cycling`, `lap_swimming` |
| Adapters | camelCase  | `indoorCycling`, `lapSwimming`   |

## MIME Type

`application/vnd.kaiord+json`
