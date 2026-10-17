import type { AthleteZoneTables } from "../types";

/**
 * Deterministic post-processing of the model's raw output, run before strict
 * validation. The model names zones; code turns them into numbers.
 *
 * Only the sport's own target type is touched: pace for running, power for
 * cycling. The tables are the athlete's running pace and cycling power, so
 * a swimming pace zone, or a pace zone on a cycling workout, is left as is.
 *
 * - A zone `{ unit: "zone", value: N }` — or a zone span
 *   `{ unit: "zone", min: A, max: B }` (a progressive step) — becomes a
 *   `range` from the athlete's table: the slowest bound of the lower zone to
 *   the fastest bound of the upper one.
 * - A zone the table cannot resolve (no table, or a zone it lacks) is never
 *   given invented numbers. A power zone stays a zone (a span collapses to
 *   its upper zone): Garmin, FIT and ZWO carry power zones natively. A pace
 *   zone becomes `open`, as does a pace zone with no number: Garmin has no
 *   pace zones, and an unresolved one would make the push refuse the
 *   whole workout.
 * - An `open` warmup, recovery or cooldown step gets the zone 1 range when
 *   the table has zone 1, and stays open otherwise.
 */

type RawValue = { unit: string; value?: number; min?: number; max?: number };
type RawStep = {
  targetType?: string;
  target?: { type?: string; value?: RawValue };
  intensity?: string;
};
type RawBlock = { repeatCount: number; steps: Array<RawStep> };
type ZonedType = "pace" | "power";

const SPORT_TARGET: Record<string, ZonedType> = {
  running: "pace",
  cycling: "power",
};
const EASY_INTENSITIES = new Set(["warmup", "recovery", "cooldown"]);
const PACE_DECIMALS = 1000;

const roundPace = (mps: number) =>
  Math.round(mps * PACE_DECIMALS) / PACE_DECIMALS;

const boundsOf = (
  type: ZonedType,
  zone: number,
  zones: AthleteZoneTables
): [number, number] | undefined => {
  if (type === "pace") {
    const z = zones.pace?.find((e) => e.zone === zone);
    return z ? [roundPace(z.minMps), roundPace(z.maxMps)] : undefined;
  }
  const z = zones.power?.find((e) => e.zone === zone);
  return z ? [z.minWatts, z.maxWatts] : undefined;
};

const OPEN = { targetType: "open", target: { type: "open" } };

const resolveValue = (
  type: ZonedType,
  value: RawValue,
  zones: AthleteZoneTables
): RawValue | undefined => {
  const a = value.min ?? value.value;
  const b = value.max ?? value.value;
  if (a === undefined || b === undefined)
    return type === "pace" ? undefined : value;
  const high = Math.max(a, b);
  const lowBounds = boundsOf(type, Math.min(a, b), zones);
  const highBounds = boundsOf(type, high, zones);
  if (!lowBounds || !highBounds)
    return type === "pace" ? undefined : { unit: "zone", value: high };
  const all = [...lowBounds, ...highBounds];
  return { unit: "range", min: Math.min(...all), max: Math.max(...all) };
};

const withSportDefault = (
  step: RawStep,
  type: ZonedType,
  zones: AthleteZoneTables
): RawStep => {
  if (step.targetType !== "open") return step;
  if (!EASY_INTENSITIES.has(step.intensity ?? "")) return step;
  if (!boundsOf(type, 1, zones)) return step;
  return {
    ...step,
    targetType: type,
    target: { type, value: { unit: "zone", value: 1 } },
  };
};

const resolveStep = (
  raw: RawStep,
  sport: string,
  zones: AthleteZoneTables
): RawStep => {
  const type = SPORT_TARGET[sport];
  if (!type) return raw;
  const step = withSportDefault(raw, type, zones);
  const value = step.target?.value;
  if (step.target?.type !== type || value?.unit !== "zone") return step;
  const resolved = resolveValue(type, value, zones);
  if (!resolved) return { ...step, ...OPEN };
  return { ...step, target: { type, value: resolved } };
};

const hasSteps = (s: unknown): s is RawBlock =>
  typeof s === "object" && s !== null && Array.isArray((s as RawBlock).steps);

export const resolveZoneTargets = (
  raw: unknown,
  zones: AthleteZoneTables = {}
): unknown => {
  if (!hasSteps(raw)) return raw;
  const sport = String((raw as { sport?: unknown }).sport ?? "");
  const resolve = (s: RawStep) => resolveStep(s, sport, zones);
  const steps = raw.steps.map((s) =>
    hasSteps(s) ? { ...s, steps: s.steps.map(resolve) } : resolve(s)
  );
  return { ...raw, steps };
};
