import type { Target } from "../../../types/krd";

/** Carries a power range's `basis` across an edit of its bounds, so editing a
    50–75 % FTP ramp never turns it into a 50–80 W range. */
export const keepPowerBasis = (
  previous: Target | null,
  next: Target | null
): Target | null => {
  if (next?.type !== "power" || next.value.unit !== "range") return next;
  if (previous?.type !== "power" || previous.value.unit !== "range")
    return next;
  if (previous.value.basis === undefined) return next;
  return { ...next, value: { ...next.value, basis: previous.value.basis } };
};
