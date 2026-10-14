import { type ReviewCopy, reviewCopyFor } from "./review-copy";

const RECOVERY_MAX = 40;
const MODERATE_MAX = 80;
const HARD_MAX = 120;

/** Human label for a TSS value, worded by the review copy. */
export function loadLabel(
  tss: number,
  { t }: ReviewCopy = reviewCopyFor()
): string {
  if (tss < RECOVERY_MAX) return t("load.recovery");
  if (tss < MODERATE_MAX) return t("load.moderate");
  if (tss < HARD_MAX) return t("load.hard");
  return t("load.veryHard");
}
