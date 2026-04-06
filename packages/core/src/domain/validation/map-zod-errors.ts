import type { ZodIssue } from "zod";

import type { ValidationError } from "../types/error-types";

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
  }));
