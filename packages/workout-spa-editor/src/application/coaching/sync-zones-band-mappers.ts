/**
 * Per-band entry generators for `mapPayloadToIncoming`. Each function
 * mutates the IncomingMap in place with `{sport}.{kind}.zN.{bound}`
 * entries derived from the raw payload bands.
 *
 * Conventions:
 *   - HR: per-sport fallback chain — Specific → Generic → skip
 *     (D-FB1). Resolution is the caller's responsibility; this module
 *     just writes the bands it's given.
 *   - Power: watts → %FTP via `Math.round(watts / z4Upper * 100)`.
 *     The divisor MUST be `payload.paces.cycling.z4Upper` (T2G's view
 *     of FTP), NEVER the persisted FTP (D-FB6). Skipped when z4Upper
 *     is absent or zero.
 *   - Pace: `{min, sec}` → integer seconds with inversion (D-FB7) —
 *     T2G `lower` (slower) → `maxPace`; T2G `upper` (faster) →
 *     `minPace`. The Kaiord `minPace <= maxPace` invariant follows
 *     from this unconditional assignment.
 */
import type {
  BandFieldKey,
  FieldKey,
  ZonesPayload,
} from "../../types/coaching-zones";

export type IncomingMap = Map<FieldKey, number>;

const BANDS = ["z1", "z2", "z3", "z4", "z5"] as const;

type BpmBands = {
  z1?: { lower: number; upper: number };
  z2?: { lower: number; upper: number };
  z3?: { lower: number; upper: number };
  z4?: { lower: number; upper: number };
  z5?: { lower: number; upper: number };
};

const setIfPositive = (
  map: IncomingMap,
  key: FieldKey,
  value: number | undefined
): void => {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    map.set(key, value);
  }
};

export const setHrBands = (
  map: IncomingMap,
  sport: "cycling" | "running" | "swimming",
  bands: BpmBands | undefined
): void => {
  if (!bands) return;
  for (const band of BANDS) {
    const b = bands[band];
    if (!b) continue;
    const minKey = `${sport}.heartRateZones.${band}.minBpm` as BandFieldKey;
    const maxKey = `${sport}.heartRateZones.${band}.maxBpm` as BandFieldKey;
    setIfPositive(map, minKey, b.lower);
    setIfPositive(map, maxKey, b.upper);
  }
};

type CyclingPaces = NonNullable<NonNullable<ZonesPayload["paces"]>["cycling"]>;

export const setCyclingPowerBands = (
  map: IncomingMap,
  cycling: CyclingPaces | undefined
): void => {
  if (!cycling) return;
  const ftp = cycling.z4Upper;
  if (typeof ftp !== "number" || ftp <= 0) return;
  for (const band of BANDS) {
    const b = cycling[band];
    if (!b) continue;
    const minKey = `cycling.powerZones.${band}.minPercent` as BandFieldKey;
    const maxKey = `cycling.powerZones.${band}.maxPercent` as BandFieldKey;
    setIfPositive(map, minKey, Math.round((b.lower / ftp) * 100));
    setIfPositive(map, maxKey, Math.round((b.upper / ftp) * 100));
  }
};

type RunSwimPaces = NonNullable<
  NonNullable<ZonesPayload["paces"]>["running"]
>;

const minSecToSeconds = (ms: { min: number; sec: number }): number =>
  ms.min * 60 + ms.sec;

export const setPaceBands = (
  map: IncomingMap,
  sport: "running" | "swimming",
  bands: RunSwimPaces | undefined
): void => {
  if (!bands) return;
  for (const band of BANDS) {
    const b = bands[band];
    if (!b) continue;
    const minKey = `${sport}.paceZones.${band}.minPace` as BandFieldKey;
    const maxKey = `${sport}.paceZones.${band}.maxPace` as BandFieldKey;
    // Inversion (D-FB7): T2G `upper` (faster) → minPace;
    // T2G `lower` (slower) → maxPace.
    setIfPositive(map, minKey, minSecToSeconds(b.upper));
    setIfPositive(map, maxKey, minSecToSeconds(b.lower));
  }
};
