/**
 * Pure date helpers for the application layer.
 * No framework, no timezone surprises — operates on YYYY-MM-DD strings
 * interpreted in the user's local timezone (matching the spa-calendar
 * week-id convention: Monday-start ISO weeks).
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Adds N calendar days to a YYYY-MM-DD string, returning the same shape. */
export const addDaysIso = (iso: string, days: number): string => {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y!, (m ?? 1) - 1, d ?? 1);
  date.setTime(date.getTime() + days * MS_PER_DAY);
  const yyyy = String(date.getFullYear()).padStart(4, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};
