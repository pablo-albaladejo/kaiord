const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

/** Every object step of a raw model output, repetition steps flattened in. */
export const flatRawSteps = <S>(raw: unknown): Array<S> => {
  const steps = isObject(raw) ? raw.steps : undefined;
  if (!Array.isArray(steps)) return [];
  return steps
    .filter(isObject)
    .flatMap((s) => (Array.isArray(s.steps) ? s.steps : [s]))
    .filter(isObject) as Array<S>;
};
