/**
 * Serialize a Date's LOCAL calendar day as `YYYY-MM-DD`.
 *
 * Never reach for `toISOString().slice(0, 10)` on a wall-clock Date: it
 * renders the UTC day, which is yesterday for the first hours after local
 * midnight in any UTC+n zone. The app derives week ids and day columns from
 * the local calendar (`week-utils.ts` anchors `getFullYear/getMonth/getDate`
 * at UTC midnight), so seeded dates must come from the same calendar or the
 * suite flakes only between local midnight and UTC midnight — green all day,
 * red at 00:45.
 */
export function toLocalDateString(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
