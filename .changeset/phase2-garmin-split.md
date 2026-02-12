---
"@kaiord/garmin": patch
---

Split large converter files for maintainability

- Extract `executable-step.converter.ts`, `flatten-segments.converter.ts`, `pool-length.mapper.ts` from garmin-to-krd
- Extract `garmin-workout-step.converter.ts`, `garmin-repetition.converter.ts`, `garmin-pool-info.mapper.ts` from krd-to-garmin
- Merge stroke conversion helpers into `stroke.mapper.ts`
- Extract Zod parse schemas into `garmin-workout-parse.schema.ts`
- All files now under 100 lines per project conventions
