import type { ZodIssue } from "zod";

import type { ValidationError } from "../types/error-types";

/**
 * Extract a stable, language-free code for an issue. Custom refinements may
 * attach an explicit `params.code` (e.g. `min_gt_max`); otherwise the native
 * Zod issue code (`invalid_type`, `too_small`, …) is already stable and
 * language-free, so it is used directly. Message wording never affects it.
 */
const codeOf = (issue: ZodIssue): string | undefined => {
  const params = (issue as { params?: { code?: unknown } }).params;
  if (params && typeof params.code === "string") return params.code;
  return typeof issue.code === "string" ? issue.code : undefined;
};

/**
 * Maps Zod validation issues to the domain ValidationError format.
 *
 * Single source of truth for Zod-to-ValidationError conversion,
 * used by validateKrd, createWorkoutKRD, and extractWorkout.
 */
export const mapZodErrors = (issues: ZodIssue[]): ValidationError[] =>
  issues.map((i) => ({
    field: i.path.join(".") || "root",
    message: i.message,
    code: codeOf(i),
  }));
