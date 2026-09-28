/**
 * AC-15 — the algebraic laws the sync relies on. `syncWithCloud` merges
 * twice (snapshot merge, then each device's live row against that result),
 * so the real operation is `merge(x, merge(x, y))`: the merge must be
 * symmetric, idempotent and absorbing. Pairwise supersession cannot be
 * associative (a two-row merge must queue its loser without seeing a third
 * row), so three devices are held to safety — no gap, the merged Placed is
 * never drained — and to convergence under sequential cloud syncs.
 * Checked over every AC-15 fixture, the all-queued one included, and every
 * pair and triple of them (the same record, as after T0c's dedupe).
 */
import { describe, expect, it } from "vitest";

import { mergeGarminLedgerRows as merge } from "./merge-garmin-ledger-rows";

type Row = Record<string, unknown>;

const W = "1707805999";
const D1 = "2026-09-29";
const D2 = "2026-09-30";
const T1 = "2026-09-27T08:00:00.000Z";
const T2 = "2026-09-28T08:00:00.000Z";

const scheduled = (id: string, date: string) => ({
  kind: "scheduled",
  workoutScheduleId: id,
  workoutId: W,
  date,
});
const queued = (id: string, date: string, attempts = 0, abandoned = false) => ({
  workoutScheduleId: id,
  workoutId: W,
  date,
  attempts,
  abandoned,
});
const attempting = (date: string, posted: boolean, extra: Row = {}) => ({
  kind: "attempting",
  workoutId: W,
  date,
  at: T2,
  posted,
  ...extra,
});

const row = (id: string, updatedAt: string, garmin: Row = {}): Row => ({
  id,
  kaiordRecordId: "a0000000-0000-4000-8000-000000000001",
  dataType: "workout",
  destinationBridgeId: "garmin-bridge",
  destinationExternalId: W,
  contentHash: "hash",
  exportedAt: T1,
  updatedAt,
  library: { kind: "confirmed", workoutId: W },
  ...garmin,
});

const POOL: Record<string, Row> = {
  "D repro A": row("id-a", T1, {
    placement: scheduled("2", D2),
    removalQueue: [queued("1", D1)],
  }),
  "D repro B": row("id-b", T2, { placement: scheduled("1", D1) }),
  "all-queued B": row("id-b", T2, {
    placement: scheduled("1", D1),
    removalQueue: [queued("2", D2)],
  }),
  "older Placed S1": row("id-c", T1, { placement: scheduled("1", D1) }),
  "newer Placed S2": row("id-d", T2, { placement: scheduled("2", D2) }),
  "attempting posted": row("id-e", T2, { placement: attempting(D2, true) }),
  "attempting with previous": row("id-f", T1, {
    placement: attempting(D2, true, { previous: scheduled("1", D1) }),
    removalQueue: [queued("3", D1)],
  }),
  "in flight": row("id-g", T2, {
    placement: attempting(D2, false),
    removalQueue: [queued("3", D1, 2, true)],
  }),
  forced: row("id-h", T1, { forceRepush: true }),
  "unconfirmed library": row("id-i", T2, { library: { kind: "unconfirmed" } }),
  "adopted unconfirmed": row("id-j", T2, {
    placement: { kind: "unconfirmed", workoutId: W, date: D1 },
  }),
  "queue only": row("id-k", T1, { removalQueue: [queued("1", D1)] }),
  pending: row("id-l", T2, { destinationExternalId: "pending" }),
  "unparsable stamp": row("id-a", "garbage"),
  "short stamp": row("id-a", "2026-09-28T08:00:00Z"),
};

const names = Object.keys(POOL);
const pairs = names.flatMap((x) => names.map((y) => [x, y] as const));
const triples = pairs.flatMap(([x, y]) => names.map((z) => [x, y, z] as const));

describe("mergeGarminLedgerRows laws", () => {
  it.each(names)("should be idempotent for %s", (x) => {
    // Arrange
    const a = POOL[x];

    // Act
    const merged = merge(a, a);

    // Assert
    expect(merged).toStrictEqual(a);
  });

  it.each(pairs)("should be symmetric for %s with %s", (x, y) => {
    // Arrange
    const [a, b] = [POOL[x], POOL[y]];

    // Act
    const ab = merge(a, b);

    // Assert
    expect(merge(b, a)).toStrictEqual(ab);
  });

  it.each(pairs)("should absorb a re-merge for %s with %s", (x, y) => {
    // Arrange
    const [a, b] = [POOL[x], POOL[y]];
    const ab = merge(a, b);

    // Act
    const reMerged = [merge(a, ab), merge(ab, b), merge(ab, ab)];

    // Assert
    for (const r of reMerged) expect(r).toStrictEqual(ab);
  });

  it.each(triples)(
    "should leave no gap and never drain the merged Placed for %s, %s and %s",
    (x, y, z) => {
      // Arrange
      const [a, b, c] = [POOL[x], POOL[y], POOL[z]];

      // Act
      const groupings = [merge(merge(a, b), c), merge(a, merge(b, c))];

      // Assert
      for (const merged of groupings) {
        const left = drain(calendarOf([a, b, c]), merged);
        const current = merged.placement as Placement | undefined;
        if (current?.workoutScheduleId)
          expect(left).toContain(current.workoutScheduleId);
        if ([a, b, c].some(holdsPlaced) && current?.kind !== "unconfirmed")
          expect(left.length).toBeGreaterThan(0);
      }
    }
  );

  it.each(triples)(
    "should converge once %s, %s and %s sync through the cloud in turn",
    (x, y, z) => {
      // Arrange
      const devices = [POOL[x], POOL[y], POOL[z]];
      let cloud: Row | undefined;

      // Act
      let rounds = 0;
      let changed = true;
      while (changed && rounds < MAX_SYNC_ROUNDS) {
        const before = JSON.stringify([devices, cloud]);
        devices.forEach((local, i) => {
          const snapshot = cloud ? merge(local, cloud) : local;
          devices[i] = merge(local, snapshot);
          cloud = snapshot;
        });
        changed = JSON.stringify([devices, cloud]) !== before;
        rounds++;
      }

      // Assert
      expect(changed).toBe(false);
      for (const device of devices) expect(device).toStrictEqual(cloud);
    }
  );
});

/** Two rounds reach the fixpoint; one more proves nothing still moves. */
const MAX_SYNC_ROUNDS = 4;

type Placement = { kind: string; workoutScheduleId?: string };

/** A row that holds a live calendar entry: a gap is losing all of them. */
const holdsPlaced = (r: Row) => {
  const kind = (r.placement as Placement | undefined)?.kind;
  return kind === "scheduled" || kind === "unconfirmed";
};

/** Every calendar entry the inputs know of: each Placed schedule id and
    each queued id (queued entries may still be on Garmin). */
function calendarOf(rows: Row[]): Set<string> {
  const ids = new Set<string>();
  for (const r of rows) {
    const p = r.placement as { workoutScheduleId?: string } | undefined;
    if (p?.workoutScheduleId) ids.add(p.workoutScheduleId);
    for (const e of (r.removalQueue as Queued[] | undefined) ?? [])
      ids.add(e.workoutScheduleId);
  }
  return ids;
}

type Queued = { workoutScheduleId: string; held?: true };

/** What the drain would leave: every id minus the queued, non-held ones. */
function drain(calendar: Set<string>, merged: Row): string[] {
  for (const e of (merged.removalQueue as Queued[] | undefined) ?? [])
    if (!e.held) calendar.delete(e.workoutScheduleId);
  return [...calendar];
}
