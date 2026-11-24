type Measured = { id: string; date: string; krd: { measuredAt?: string } };

const instant = (r: Measured): number =>
  Date.parse(r.krd.measuredAt ?? "") || 0;

/** Orders by day, then by measurement instant, then by id: never by row order. */
const isLater = (a: Measured, b: Measured): boolean => {
  if (a.date !== b.date) return a.date > b.date;
  if (instant(a) !== instant(b)) return instant(a) > instant(b);
  return a.id > b.id;
};

/** The most recent measurement; same-day rows from several sources are ordered deterministically. */
export const latestUpTo = <T extends Measured>(records: T[]): T | undefined =>
  records.reduce<T | undefined>(
    (latest, record) => (latest && !isLater(record, latest) ? latest : record),
    undefined
  );
