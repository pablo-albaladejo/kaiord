## ADDED Requirements

### Requirement: `LinkedCoachingAccount` schema includes the snapshot field

The `linkedCoachingAccountSchema` Zod type SHALL include an optional `lastSyncedZonesSnapshot` field whose shape captures the post-mapper Kaiord-domain zones + threshold scalars from the most recent successful T2G sync. The field is optional — accounts not yet sync'd or freshly-linked accounts have it absent.

```ts
const lastSyncedZonesSnapshotSchema = z.object({
  syncedAt: z.iso.datetime(),
  cyclingHr: z.array(heartRateZoneSchema).length(5),
  runningHr: z.array(heartRateZoneSchema).length(5),
  swimmingHr: z.array(heartRateZoneSchema).length(5),
  cyclingPower: z.array(powerZoneSchema).length(5),
  runningPace: z.array(paceZoneSchema).length(5),
  swimmingPace: z.array(paceZoneSchema).length(5),
  bodyWeight: z.number().positive().optional(),
  maxHeartRate: z.number().int().positive().max(250).optional(),
  cyclingFtp: z.number().int().positive().optional(),
  cyclingLthr: z.number().int().positive().max(250).optional(),
  runningLthr: z.number().int().positive().max(250).optional(),
  runningThresholdPace: z.number().positive().optional(),
  swimmingCss: z.number().positive().optional(),
});

const linkedCoachingAccountSchema = z.object({
  source: z.enum(["train2go"]),
  externalUserId: z.string().min(1),
  externalUserName: z.string(),
  linkedAt: z.iso.datetime(),
  syncZones: z.boolean(),
  lastSyncedZonesSnapshot: lastSyncedZonesSnapshotSchema.optional(),
});
```

The Dexie schema SHALL bump to v9 with an `applyV9Upgrade` helper (mirrors the v8 pattern from the AI provider order migration) that:

1. Normalizes `method = "manual"` (introduced by the prior `train2go-zones-sync-full-bands` change in `sync-zones-band-writes.ts`) to `method = "custom"` for every sport-kind table on every existing profile. This re-aligns vocabulary with the existing `"custom"` semantic.
2. Conservatively reclassifies `method = "custom"` AND zones-clearly-not-defaults to `method = "user"` per the migration heuristic in design D-MA7. False-negatives produce conflicts on next sync (handled by the new dialog gracefully); false-positives produce conflicts forever (avoided).
3. Leaves `lastSyncedZonesSnapshot` absent on every migrated profile — next sync establishes the baseline.

#### Scenario: v9 migration preserves a freshly-created profile (no method changes)

- **GIVEN** a profile created by the current `createNewProfile(...)` factory (HR `"custom"` + all-zero, power `"coggan-7"` + Coggan defaults, running/swimming pace `"custom"` + empty)
- **WHEN** the Dexie v9 upgrade runs
- **THEN** every sport-kind config's `method` SHALL be unchanged (no `"manual"` to normalize, no clearly-edited zones to flip to `"user"`)
- **AND** no `lastSyncedZonesSnapshot` SHALL be added

#### Scenario: v9 migration normalizes `"manual"` to `"custom"` on profiles that ran the prior shipped sync

- **GIVEN** a profile that ran the shipped `train2go-zones-sync-full-bands` sync, producing `cycling.heartRateZones.method = "manual"` (created by `sync-zones-band-writes.ts` when the sport config was newly seeded)
- **WHEN** the v9 upgrade runs
- **THEN** the profile's `cycling.heartRateZones.method` SHALL equal `"custom"` (post-migration; the `"manual"` value is removed from the codebase's vocabulary)

#### Scenario: v9 migration flips `"custom"` to `"user"` for clearly-edited HR tables

- **GIVEN** a profile with `running.heartRateZones = { method: "custom", zones: [{Z1: 100-130}, {Z2: 131-145}, {Z3: 146-160}, {Z4: 161-170}, {Z5: 171-187}] }` (clearly NOT the all-zero default seed)
- **WHEN** the v9 upgrade runs
- **THEN** the profile's `running.heartRateZones.method` SHALL equal `"user"` (the migration's `hasUserData` heuristic detects the non-default content)

#### Scenario: v9 migration leaves seeded `"custom"` HR tables unchanged

- **GIVEN** a profile with `cycling.heartRateZones = { method: "custom", zones: [{Z1: 0-0}, ..., {Z5: 0-0}] }` (the canonical all-zero seed from `DEFAULT_HEART_RATE_ZONES`)
- **WHEN** the v9 upgrade runs
- **THEN** the profile's `cycling.heartRateZones.method` SHALL stay `"custom"` (no clear user-customization signal; the table is treated as default-template by the post-migration classifier)

#### Scenario: v9 migration is a no-op for tables already at `method = "user"`

- **GIVEN** a profile with `running.heartRateZones = { method: "user", zones: [...customized] }` (e.g., from running the migration twice or from a future direct write)
- **WHEN** the v9 upgrade runs
- **THEN** the profile's `running.heartRateZones.method` SHALL stay `"user"` (idempotent — no second-run reclassification, no value rewrite)
- **AND** the zones content SHALL stay byte-identical

#### Scenario: v9 migration applies uniformly to the `generic` sport

- **GIVEN** a profile with `generic.heartRateZones = { method: "custom", zones: [{Z1: 100-130}, {Z2: 131-145}, {Z3: 146-160}, {Z4: 161-170}, {Z5: 171-187}] }` (clearly user-edited, NOT the all-zero seed)
- **WHEN** the v9 upgrade runs
- **THEN** the profile's `generic.heartRateZones.method` SHALL flip to `"user"` (same heuristic as the cycling/running/swimming sports — no special case for `generic`)

#### Scenario: Snapshot persistence is atomic with the zone writes

- **GIVEN** a sync that produces silent-fills for cycling HR + cycling power tables
- **WHEN** `syncZones` writes the persisted profile in a Dexie transaction
- **THEN** the linked-account record's `lastSyncedZonesSnapshot` SHALL be updated in the SAME transaction as the zone-array writes
- **AND** if any error occurs mid-write, BOTH the zone arrays AND the snapshot SHALL roll back to their pre-call values (no intermediate state where snapshot updates while zones don't, or vice versa)

#### Scenario: Unlinking a coaching account removes its snapshot atomically

- **GIVEN** a profile with `linkedAccounts[0]` populated with `{ source: "train2go", lastSyncedZonesSnapshot: {...full snapshot...} }`
- **WHEN** the user invokes `unlinkCoachingAccount` for that source
- **THEN** the entire `linkedAccounts[0]` entry SHALL be removed from the array (existing behavior)
- **AND** the corresponding `lastSyncedZonesSnapshot` SHALL be removed atomically with the account (no orphan snapshot data persists)
- **AND** if the user re-links the same external account later (same `externalUserId`), the new linked-account record SHALL start with `lastSyncedZonesSnapshot` absent (next sync establishes a fresh baseline; no stale snapshot is preserved across re-links)
