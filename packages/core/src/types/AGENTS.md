<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# types

## Purpose

Cross-cutting protocol DTOs that don't fit in `domain/` because they describe transport boundaries (SPA ↔ browser-extension bridge) rather than the KRD domain itself. Currently holds only the Profile Snapshot — the SPA derives a snapshot from its domain profile and pushes it to every VERIFIED bridge so the bridge popup can render athlete data without a network call.

## Key Files

| File                       | Description                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `profile-snapshot.ts`      | `profileSnapshotSchema` (Zod) + `ProfileSnapshot` (inferred type) + `STALE_SNAPSHOT_THRESHOLD_DAYS=7` + `fingerprintSnapshot(profileId, snapshot)`. The schema enforces strict object shape, rejects prototype-pollution keys (`__proto__`/`constructor`/`prototype`) via a `superRefine`, and caps payload size at 8192 bytes of JSON. The fingerprint is FNV-1a 32-bit over `${profileId.length}:${profileId} | ${JSON.stringify(rest)}`(excluding`generatedAt`), returning 8-char lowercase hex. |
| `profile-snapshot.test.ts` | Tests positive parsing, negative rejection (prototype-pollution top-level + nested, oversized payload, missing fields, unknown `activeSport`), and fingerprint stability/uniqueness.                                                                                                                                                                                                                            |

## For AI Agents

### Working In This Directory

- `profileSnapshotSchema` lives here, NOT in `../domain/schemas/`, on purpose: it's a protocol contract between the SPA and its browser-extension bridges, not part of the KRD canonical format. The same precedent applies to `bridgeManifestSchema` (which lives elsewhere). Keep this layering — don't merge into domain.
- The schema is a `z.unknown().superRefine(...).pipe(innerSchema)` chain so the prototype-pollution check runs BEFORE the structural shape check. Both must pass.
- `fingerprintSnapshot` is the canonical de-dup hash. The SPA uses it for per-bridge push de-duplication. **Bridges MUST NOT compute or compare fingerprints** — that responsibility lives entirely on the SPA side. Don't add bridge-side fingerprint code.
- The fingerprint MUST be stable: same `(profileId, snapshot-minus-generatedAt)` → same 8-char hex. The implementation uses `Math.imul(hash, 0x01000193) >>> 0` for unsigned 32-bit FNV-1a; do not rewrite to a different hash without bumping the protocol version.
- `STALE_SNAPSHOT_THRESHOLD_DAYS = 7` matches a training-week cadence. Bridges compare `Date.now() - generatedAt > 7d` and render the placeholder card instead of stale data.

### Testing Requirements

- Coverage target: 80%. The co-located test file uses fixtures from `../test-utils/profile-snapshot-fixtures.ts` so the same data is exercised by SPA Zod tests, bridge plain-JS tests, and this schema test. AAA + `should ` invariants apply.

### Common Patterns

- **`z.unknown().superRefine(...).pipe(strictObject)`** — guard against malicious payload shapes before structural validation.
- **Protocol DTO over domain type** — colocate the schema+type+helpers in one file so the contract is reviewable as a single unit.

## Dependencies

### Internal

None within core (the test consumes `../test-utils/profile-snapshot-fixtures` but that is a test-only import).

### External

- `zod`.

<!-- MANUAL: -->
