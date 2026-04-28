/**
 * Pure date helpers for the application layer.
 * No framework, no timezone surprises — operates on YYYY-MM-DD strings
 * interpreted in the user's local timezone (matching the spa-calendar
 * week-id convention: Monday-start ISO weeks).
 */

/**
 * Adds N calendar days to a YYYY-MM-DD string, returning the same shape.
 *
 * Uses `Date#setDate(getDate() + days)` rather than fixed-millisecond
 * arithmetic so DST transitions (25-hour and 23-hour days) don't shift
 * the result onto the wrong calendar day.
 */
export const addDaysIso = (iso: string, days: number): string => {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y!, (m ?? 1) - 1, d ?? 1);
  date.setDate(date.getDate() + days);
  const yyyy = String(date.getFullYear()).padStart(4, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};
