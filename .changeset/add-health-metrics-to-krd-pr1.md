---
"@kaiord/core": major
---

KRD v2.0 — extend the canonical format with health-domain types and tagged extensions (PR 1 of the `add-health-metrics-to-krd` OpenSpec change).

**Breaking changes** (consumers of `@kaiord/core` validating KRD via Zod must update):

- `fileTypeSchema` adds six variants: `sleep_record`, `weight_measurement`, `hrv_summary`, `daily_wellness`, `body_composition`, `stress_episode`. The enum grows from 3 to 9 values. Exhaustive `switch`-style consumers must add the new cases or fall back to a default branch.
- `KRDMetadata.sport` becomes `z.string().optional()`. A conditional refinement on `krdSchema` keeps `metadata.sport` **required** for the three legacy workout/activity/course types, so v1.x payloads validate byte-equivalently for those. Health-type payloads MUST omit `sport`.
- `extensions` is re-typed from `z.record(z.string(), z.unknown())` to `krdExtensionsSchema` — a tagged shape with `catchall(z.unknown())` that strictly validates the reserved namespaces (`structured_workout`, `fit`, `course`, `course_points`, `health.{sleep|weight|hrv|daily|bodyComposition|stress}`) while still preserving any adapter-defined / unknown namespaces during round-trip.

**Additions:**

- `packages/core/src/domain/schemas/health/` with six tagged Zod sub-schemas (sleep, weight, HRV, daily wellness, body composition, stress), per-metric round-trip tolerance constants, and a `healthExtensionPayloadSchema` discriminated union.
- `UnsupportedKrdTypeError` (typed error class + factory) in `packages/core/src/domain/types/unsupported-krd-type-error.ts`. Workout-only writers (`@kaiord/tcx`, `@kaiord/zwo`, `@kaiord/garmin`) throw this when given a health-type KRD instead of a generic `Error`.
- `packages/core/docs/ADAPTER-COVERAGE.md` documenting the normative format × KRD-type coverage matrix.

The KRD `version` discriminator stays at the existing `"<major>.<minor>"` regex; producers SHOULD emit `"2.0"` when carrying any health payload so consumers can dispatch by version.

Follow-ups (separate changes): FIT mappers for the six health types (PR 2), Dexie v14 + SPA Health Hub (PR 3), MCP health tools (PR 4), Garmin Connect HTTP endpoints (PR 5+).
