const ISO_DATE_SHAPE = /^\d{4}-\d{2}-\d{2}$/;

/** Shape-gate then round-trip parse to reject calendar-impossible dates. */
export function isValidCalendarDate(value: string): boolean {
  if (!ISO_DATE_SHAPE.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed.toISOString().slice(0, 10) === value;
}
