/**
 * Co-located numeric fixtures for compliance-bucket.test.ts.
 *
 * Values are sourced verbatim from the sibling test file so that
 * extracting them silences `no-magic-numbers` without changing
 * test semantics.
 */

export const JUST_BELOW_AMBER_MID_BOUNDARY = 0.499 as const;
export const AMBER_MID_BOUNDARY = 0.5 as const;
export const JUST_BELOW_MID_EMERALD_BOUNDARY = 0.799 as const;
export const MID_EMERALD_BOUNDARY = 0.8 as const;
export const NEGATIVE_OUT_OF_RANGE = -0.5 as const;
export const ABOVE_ONE_OUT_OF_RANGE = 1.5 as const;
