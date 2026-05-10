# Multisport Transitions — Empirical Rules

Garmin Connect supports multisport workouts (triathlon, brick, duathlon) where a single workout contains multiple `workoutSegments`, each with its own `sportType`. This document captures the empirical rules that govern how Garmin's server stores and renders these workouts. Following them is necessary for the `@kaiord/garmin` adapter to produce JSON that round-trips cleanly through the Garmin Connect API.

> **Empirical findings as of 2026-05-09.** Derived from spike sessions against Garmin Connect's authenticated API using workouts `1562019589` (reference triathlon) and `1562037033` (alternating-brick spike). If Garmin changes the underlying behavior, update this document with a new dated footer rather than silently rewriting it.

---

## TL;DR

```text
SHALL    sportType.sportTypeId = 10 / sportTypeKey = "multi_sport" at the root.
SHALL    isSessionTransitionEnabled: true at the root to enable transitions.
SHALL    Each workoutSegment has its own sportType (running, cycling, swimming, ...).
SHALL    targetValueOne >= targetValueTwo for pace.zone, power.zone, speed.zone.
SHALL    stepOrder is global across all segments and inside RepeatGroupDTO children.

SHALL NOT  invent a "transition" sportTypeKey — Garmin has no such sport.
SHALL NOT  put warmup + repeat + interval together in one segment — server splits it.
SHALL NOT  rely on stepOrder resetting inside a repeat in multisport — it does not.
```

---

## 1. Transitions are a flag, not a sport type

Garmin's data model does **not** include a `transition` sport. Transitions between segments of different sports are activated workout-wide by the boolean flag `isSessionTransitionEnabled` at the workout root:

```json
{
  "sportType": { "sportTypeId": 10, "sportTypeKey": "multi_sport", "displayOrder": 4 },
  "isSessionTransitionEnabled": true,
  "workoutSegments": [
    { "segmentOrder": 1, "sportType": { "sportTypeKey": "running", ... }, ... },
    { "segmentOrder": 2, "sportType": { "sportTypeKey": "cycling", ... }, ... }
  ]
}
```

When the flag is `true`, the device prompts the user to advance via the lap button at every sport boundary. When it is `false` or omitted, the workout flows seamlessly from one segment to the next without a transition prompt.

**Do not** insert pseudo-segments with a fictitious `sportTypeId: 8` or `sportTypeKey: "transition"`. That sport type does not exist; Garmin's parse schema rejects it (or, worse, silently corrupts the workout).

---

## 2. Segment composition rules

Garmin's server applies an internal segment-rewrite pass when it stores a multisport workout. Composing segments outside the rules below causes the server to silently split, reorder, or strip steps. The rules:

### Allow-list — combinations the server accepts as-is

| Position in the workout | Combination             | Notes                                         |
| ----------------------- | ----------------------- | --------------------------------------------- |
| First segment           | `warmup` + `repeat`     | The canonical "warmup with strides" shape.    |
| First segment           | `warmup` only           | Plain time-based warmup.                      |
| Any segment             | single `interval`       | The simplest case; one work step per segment. |
| Last segment            | `interval` + `cooldown` | The interval can be distance- or time-based.  |
| Last segment            | `cooldown` only         |                                               |

### Deny-list — combinations the server rewrites

| Combination                            | What the server does                           |
| -------------------------------------- | ---------------------------------------------- |
| `warmup` + `repeat` + `interval`       | Splits into two segments and reassigns sport.  |
| Two or more top-level `interval` steps | Splits each into its own segment.              |
| `warmup` + `interval` (no repeat)      | Splits; the interval ends up in a new segment. |

### Practical advice

- For an alternating brick (run / bike / run / bike / ...), put **each interval in its own segment**. Combine the warmup with its repeat block in the first segment and combine the last interval with the cooldown in the final segment.
- If you must include multiple work intervals of the same sport in a single segment, wrap them in a `RepeatGroupDTO`. Garmin treats a repeat container as one top-level step, so `warmup + repeat` (where the repeat contains the intervals) is allowed.

---

## 3. Range-target ordering — faster first

Range-based targets (`pace.zone`, `power.zone`, `speed.zone`) MUST be emitted with the faster / higher-intensity bound in `targetValueOne` and the slower / lower-intensity bound in `targetValueTwo`:

| Target type  | `targetValueOne` (faster) | `targetValueTwo` (slower) |
| ------------ | ------------------------- | ------------------------- |
| `pace.zone`  | higher m/s                | lower m/s                 |
| `power.zone` | higher watts              | lower watts               |
| `speed.zone` | higher m/s                | lower m/s                 |

Sending the values in the opposite order causes Garmin's server to reverse them silently — but only on a subset of segments — producing inconsistent display in the workout editor. The `@kaiord/garmin` writer enforces faster-first encoding; the reader normalizes any incoming order to `[min, max]` so range semantics survive even if a third-party producer sent them slower-first.

`heart.rate.zone` and `cadence` are not affected by this rule (Garmin tolerates either order).

---

## 4. Global `stepOrder`

In multisport workouts, `stepOrder` is **global across all segments and across nested `RepeatGroupDTO` children**. This differs from single-sport workouts, where `stepOrder` resets inside a repeat block.

Example for a multisport with a repeat in segment 1:

```text
seg 1:
  warmup     stepOrder: 1
  repeat     stepOrder: 2
    progressive  stepOrder: 3   ← global, NOT 1
    rest         stepOrder: 4   ← global, NOT 2
seg 2:
  interval   stepOrder: 5
seg 3:
  interval   stepOrder: 6
```

`stepId` values may be simple incrementing integers on input; Garmin's server reassigns them to its own large numeric IDs (e.g., `13306053372`) on storage.

---

## 5. Round-trip carrier in KRD

KRD does not natively model multisport (single sport per workout). To preserve the transition flag across `GCN → KRD → GCN` round-trips, the `@kaiord/garmin` adapter stores it under the `gcn` namespace of `KRD.extensions`:

```json
{
  "version": "1.0",
  "type": "structured_workout",
  "extensions": {
    "structured_workout": { ... },
    "gcn": { "isSessionTransitionEnabled": true }
  }
}
```

The writer reads from `extensions.gcn.isSessionTransitionEnabled`; the reader writes there when the source GCN has the flag. The flag is the only multisport-related field carried in `extensions.gcn` today; future multisport-aware fields would join it under the same namespace.

Multi-segment structure is **not** preserved in the round-trip — the writer always emits a single `workoutSegment` because KRD's domain model has no concept of a multi-sport session. Modeling that natively in KRD is a separate, larger change (currently out of scope).

---

## 6. References

- Source spike workouts (Garmin Connect, account `pablo-albaladejo`):
  - `1562019589` — reference triathlon multisport (3 segments: cycling / running / swimming).
  - `1562037033` — alternating-brick spike (revealed segment-rewrite behavior).
- Adapter contracts: [`openspec/specs/adapter-contracts/spec.md`](../../../openspec/specs/adapter-contracts/spec.md) — search for "Multisport Transition Flag" and "Faster-First Ordering".
- API findings overview: [`API-FINDINGS.md`](./API-FINDINGS.md) (multisport section).
- Input/output field map: [`INPUT-VS-OUTPUT.md`](./INPUT-VS-OUTPUT.md).
