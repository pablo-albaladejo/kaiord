import type { AthleteZoneTables } from "../types";

/**
 * Deterministic post-processing of the model's raw output, run before strict
 * validation. The model names zones; code turns them into numbers.
 *
 * - A pace/power target `{ unit: "zone", value: N }` — or a zone span
 *   `{ unit: "zone", min: A, max: B }` (a progressive step) — becomes a
 *   `range` from the athlete's tables: the slowest bound of the lower zone to
 *   the fastest bound of the upper one.
 * - A zone (or a zone of a span) missing from the athlete's table stays a
 *   zone; a span collapses to its upper zone, the effort the step builds to.
 *   Numbers are never invented.
 * - Running and cycling always carry a target: an `open` warmup, recovery or
 *   cooldown step becomes zone 1 (pace for running, power for cycling).
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

const resolveValue = (
  type: ZonedType,
  value: RawValue,
  zones: AthleteZoneTables
): RawValue => {
  if (value.unit !== "zone") return value;
  const a = value.min ?? value.value;
  const b = value.max ?? value.value;
  if (a === undefined || b === undefined) return value;
  const [low, high] = a <= b ? [a, b] : [b, a];
  const lowBounds = boundsOf(type, low, zones);
  const highBounds = boundsOf(type, high, zones);
  if (!lowBounds || !highBounds) return { unit: "zone", value: high };
  const all = [...lowBounds, ...highBounds];
  return { unit: "range", min: Math.min(...all), max: Math.max(...all) };
};

const withSportDefault = (step: RawStep, sport: string): RawStep => {
  const type = SPORT_TARGET[sport];
  if (!type || step.targetType !== "open") return step;
  if (!EASY_INTENSITIES.has(step.intensity ?? "")) return step;
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
  const step = withSportDefault(raw, sport);
  const type = step.target?.type;
  const value = step.target?.value;
  if ((type !== "pace" && type !== "power") || !value) return step;
  return { ...step, target: { type, value: resolveValue(type, value, zones) } };
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
