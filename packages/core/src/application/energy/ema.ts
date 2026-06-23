/**
 * Exponential moving average (EMA) over a dated numeric series. Pure; no
 * adapter/external deps.
 *
 * Used to smooth noisy daily weigh-ins into a trend line (and reusable for any
 * other dated signal). Points MUST be ascending by date; the returned series
 * mirrors the input one-to-one, each entry carrying the running EMA up to and
 * including that point.
 *
 * Alpha derivation: a `windowDays` span maps to the standard smoothing factor
 *   alpha = 2 / (windowDays + 1)
 * the same relation used for an N-period EMA. A larger window yields a smaller
 * alpha and therefore a heavier, slower-moving trend. The first point seeds the
 * EMA with its own value (ema[0] = value[0]); each subsequent point updates it
 * as `ema = alpha * value + (1 - alpha) * prevEma`.
 *
 * Guards: empty input returns `[]`; a non-finite `windowDays` (≤ 0) or any
 * non-finite point value throws a RangeError rather than propagating NaN.
 */

export type EmaPoint = {
  /** ISO date (YYYY-MM-DD); the series MUST be ascending by date. */
  date: string;
  value: number;
};

export type EmaOptions = {
  /** Smoothing window in days; alpha = 2 / (windowDays + 1). Must be > 0. */
  windowDays: number;
};

export type EmaResult = {
  date: string;
  ema: number;
};

const isPositiveFinite = (value: number): boolean =>
  Number.isFinite(value) && value > 0;

const alphaForWindow = (windowDays: number): number => {
  if (!isPositiveFinite(windowDays)) {
    throw new RangeError("EMA requires a positive finite windowDays.");
  }
  return 2 / (windowDays + 1);
};

const assertFiniteValue = (value: number): void => {
  if (!Number.isFinite(value)) {
    throw new RangeError("EMA requires finite point values.");
  }
};

/**
 * Compute the running EMA of a dated series (ascending by date). Returns a
 * same-length series of `{ date, ema }`; the first ema equals the first value.
 *
 * @throws RangeError when `windowDays` is not positive and finite, or when any
 *   point value is non-finite.
 */
export const exponentialMovingAverage = (
  points: ReadonlyArray<EmaPoint>,
  options: EmaOptions
): EmaResult[] => {
  const [first] = points;
  if (first === undefined) {
    return [];
  }
  const alpha = alphaForWindow(options.windowDays);
  let prev = first.value;
  return points.map((point, index) => {
    assertFiniteValue(point.value);
    prev = index === 0 ? point.value : alpha * point.value + (1 - alpha) * prev;
    return { date: point.date, ema: prev };
  });
};
