type RawStep = { target?: { type?: string; value?: { basis?: unknown } } };

const stepsOf = (raw: unknown): Array<RawStep> => {
  const steps = (raw as { steps?: unknown } | null)?.steps;
  if (!Array.isArray(steps)) return [];
  return steps.flatMap((s: RawStep & { steps?: Array<RawStep> }) =>
    Array.isArray(s.steps) ? s.steps : [s]
  );
};

/**
 * `basis` qualifies a power range only. Core would strip it from any other
 * target, so it is rejected here instead and the retry loop feeds the reason
 * back to the model.
 */
export const assertBasisOnPowerOnly = (raw: unknown): void => {
  const offending = stepsOf(raw).find(
    (s) => s.target?.value?.basis !== undefined && s.target.type !== "power"
  );
  if (offending) {
    throw new Error(
      `basis is only valid on a power target, but a ${offending.target?.type ?? "missing"} target carries basis ${String(offending.target?.value?.basis)}: remove basis from it`
    );
  }
};
