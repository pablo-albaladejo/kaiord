/** How one KRD target family reaches TrainingPeaks' percentage model. */
export type BandRecipe = {
  /** Unit already expressed as a percentage — passes through untouched. */
  passthroughUnit: string;
  /** Zone midpoints, indexed from zone 1. */
  zonePercents: readonly number[];
  /** The athlete threshold absolute units divide by; `undefined` if unknown. */
  threshold: number | undefined;
  /** Names the quantity in warnings, e.g. "power". */
  label: string;
};
