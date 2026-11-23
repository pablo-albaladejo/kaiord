import { flatRawSteps } from "./raw-steps";

type RawStep = {
  stepIndex?: unknown;
  target?: { type?: string; value?: { unit?: string; basis?: unknown } };
};

const misplaced = (s: RawStep): boolean =>
  s.target?.value?.basis !== undefined &&
  !(s.target.type === "power" && s.target.value.unit === "range");

/**
 * `basis` qualifies a power range only. Core would strip it from any other
 * target or unit (a watts value would then read as watts), so it is rejected
 * here instead and the retry loop feeds the reason back to the model. Shape
 * errors are left to the strict schema.
 */
export const assertBasisOnPowerOnly = (raw: unknown): void => {
  const offending = flatRawSteps<RawStep>(raw).find(misplaced);
  if (!offending) return;
  const target = offending.target;
  const where =
    typeof offending.stepIndex === "number"
      ? `step ${offending.stepIndex}: `
      : "";
  throw new Error(
    `${where}basis is only valid on a power range, but a ${target?.type ?? "missing"} ${target?.value?.unit ?? "missing"} target carries basis ${String(target?.value?.basis)}: remove basis from it`
  );
};
