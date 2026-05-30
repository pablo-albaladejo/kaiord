const RECOVERY_MAX = 40;
const MODERATE_MAX = 80;
const HARD_MAX = 120;

/** Human label for a TSS value. */
export function loadLabel(tss: number): string {
  if (tss < RECOVERY_MAX) return "Recovery";
  if (tss < MODERATE_MAX) return "Moderate";
  if (tss < HARD_MAX) return "Hard";
  return "Very Hard";
}
