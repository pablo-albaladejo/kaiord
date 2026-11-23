import { flatRawSteps } from "./raw-steps";

type RawStep = {
  stepIndex?: unknown;
  target?: { type?: string; value?: { unit?: string } };
};

const COMPUTED_UNITS: Record<string, string> = {
  mps: "a pace in m/s",
  range: "a pace range in m/s",
};

const computedUnit = (s: RawStep): string | undefined =>
  s.target?.type === "pace"
    ? COMPUTED_UNITS[s.target.value?.unit ?? ""]
    : undefined;

/**
 * No coach writes metres per second: a pace in m/s from the model is a number
 * the model computed. It is refused here, before any resolution, and the
 * retry loop asks for the coach's own pace, speed, split or zone instead.
 */
export const assertNoComputedSpeeds = (raw: unknown): void => {
  const offending = flatRawSteps<RawStep>(raw).find(
    (s) => computedUnit(s) !== undefined
  );
  if (!offending) return;
  const where =
    typeof offending.stepIndex === "number"
      ? `step ${offending.stepIndex}: `
      : "";
  throw new Error(
    `${where}${computedUnit(offending)} is computed, not written by the coach: give the pace as written ({ "unit": "pace", "per": "km", "clock": "4:30" }), a split, a km/h or mph speed, a reference or a zone, and the app computes the m/s`
  );
};
