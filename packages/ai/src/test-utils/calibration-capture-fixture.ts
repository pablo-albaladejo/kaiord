/**
 * The `rate_limit_info` and `modelUsage` of the real calibration call that
 * pinned `SEVEN_DAY_FIELD` and `OFFICIAL_SERVED_FORM` (claude-sonnet-5,
 * CLI 2.1.309, 2026-10-23), copied verbatim from the capture.
 */
export const CALIBRATION_RATE_LIMIT_INFO = {
  status: "allowed",
  resetsAt: 1792787400,
  rateLimitType: "five_hour",
  overageStatus: "rejected",
  overageDisabledReason: "org_level_disabled",
  isUsingOverage: false,
  unifiedWindows: {
    five_hour: { utilization: 0.11, resetsAt: 1792787400 },
    seven_day: { utilization: 0.52, resetsAt: 1793088000 },
  },
} as const;

export const CALIBRATION_SERVED_MODEL_ID = "claude-sonnet-5" as const;
