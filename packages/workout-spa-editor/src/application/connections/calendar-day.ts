/**
 * The reader's calendar day for a stored timestamp.
 *
 * Not `toISOString()`'s: a sync at 02:00Z happened the previous evening in New
 * York, and every sentence built on this is about the reader's day. Nothing
 * when the stored value does not parse, so no surface renders `Invalid Date`.
 *
 * Shared rather than duplicated per surface: the Settings banner and the
 * Connections banner state the same date about the same source, and two
 * formatters would eventually disagree about which day that was.
 */
export const calendarDay = (
  timestamp: string | undefined
): string | undefined => {
  if (timestamp === undefined) return undefined;
  const at = new Date(timestamp);
  if (Number.isNaN(at.getTime())) return undefined;
  const month = String(at.getMonth() + 1).padStart(2, "0");
  return `${at.getFullYear()}-${month}-${String(at.getDate()).padStart(2, "0")}`;
};
