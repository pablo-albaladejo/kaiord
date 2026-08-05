# Tasks · Rebrand V2 Athlete

## 1. Threshold provenance (derivation)

- [x] 1.1 Add `lib/athlete/threshold-provenance.ts`: map each `ThresholdFieldKey` to its `LastSyncedZonesSnapshot` scalar, compare against the profile's current value across `linkedAccounts`, and return `{ kind: "synced", source, at }` or `{ kind: "manual", at? }`.
- [x] 1.2 Date a `manual` provenance from `profile.updatedAt` only — never invent a per-field edit time.
- [x] 1.3 Add the staleness window and the `needsAttention` predicate; an undated `manual` never raises attention.
- [x] 1.4 Give `thresholdCandidates` a `field: ThresholdFieldKey` per candidate so `deriveThresholdMetrics` can attach provenance.
- [x] 1.5 Drop `accent` from `ThresholdMetric`; a threshold is a number, not a link.
- [x] 1.6 Unit tests: synced match, edited-since-sync, field absent from snapshot, no linked account, stale vs fresh, undated manual.

## 2. Source disagreement

- [x] 2.1 Add `lib/athlete/threshold-disagreement.ts`: the first snapshot scalar that differs from the profile's current value, with its source, date, unit and both values.
- [x] 2.2 Add `maxHeartRate` to `UpdateProfileInput` so the row can write the field it is about.
- [x] 2.3 `ThresholdReconcileRow.tsx`: neutral surface + border, "Use N" primary / "Keep N" secondary, session-scoped dismissal.
- [x] 2.4 Unit tests for the derivation, including the agreement case returning nothing.

## 3. Auto-import control

- [x] 3.1 `hooks/athlete/use-zones-auto-import.ts`: live-read the `(training-zones, import)` policies, expose `enabled`/`available`, write `mode` on toggle leaving `enabled` untouched.
- [x] 3.2 `ThresholdAutoRow.tsx`: one-line statement of what off means; nothing renders when no policy exists.
- [x] 3.3 Delete `ThresholdCardHeader.tsx` — its toggle was `useState` with no writer, and "Edit" moves to the section head.

## 4. Components

- [x] 4.1 `AvatarRing`: `conic-gradient` over `--zone-1`…`--zone-5`; drop both literal hexes; weight 600.
- [x] 4.2 `Metric`: remove the `accent` prop; 24px/600 value with `tabular-nums slashed-zero`; update test + stories.
- [x] 4.3 `ZoneMap`: bar height per zone, labels below the bars, radii and gradients on the V2 scale.
- [x] 4.4 `ZoneMapLegend`: V2 type scale and weights, role colours.
- [x] 4.5 `SectionHead`: weight 600 heading, action rendered as underlined ink rather than accent.
- [x] 4.6 `Segmented`: active fill `--control` with `--control-ink` on top, radii 12/8, weight 500.
- [x] 4.7 `Card`: base classes from `bg-white … dark:bg-gray-800` to `bg-surface` + `border-edge-soft`, radius 16.
- [x] 4.8 `icon-map.ts`: add `alert` (TriangleAlert) and `info` (Info).

## 5. Page

- [x] 5.1 `AthleteIdentity`: 20px/600 name, tagline carrying the sport noun, the primary threshold and body weight; 40px control-radius edit button.
- [x] 5.2 `ThresholdCard`: `SectionHead` with an "Edit" action above the card; metrics row, disagreement row, auto row inside it.
- [x] 5.3 `ThresholdMetricsRow`: provenance line per metric, two states.
- [x] 5.4 `ZoneMapCard`: reason above the map, naming the threshold it derives from; encoding caption below.
- [x] 5.5 `AthletePageBody`: two-column `minmax(min(380px, 100%), 1fr)` grid; Connections link row when the profile has a linked account.
- [x] 5.6 `AthleteEmptyState`: role colours and V2 type.

## 6. Copy

- [x] 6.1 `en/athlete.json` + `es/athlete.json`: provenance, reconciliation, auto-import, zone reason and encoding copy. Retire `autoZones` / `manualZones` / `zonesBlurb`.
- [x] 6.2 Resolve relative dates through the shared `common.relativeTime.*` keys rather than a second formatter.

## 7. Verification

- [x] 7.1 `pnpm -r build`.
- [x] 7.2 `pnpm --filter @kaiord/workout-spa-editor test`.
- [x] 7.3 `pnpm lint` (max-warnings 0) and `tsc -b`.
- [x] 7.4 `pnpm lint:specs`.
- [x] 7.5 Both themes checked on `/athlete`.
