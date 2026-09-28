/**
 * AC-15 — the laws the cloud sync relies on, checked on the rows that
 * consistent histories actually produce.
 *
 * A world is one Garmin calendar (the truth: which schedule ids are live),
 * three devices and the single cloud row. Every order of the steps in a
 * scenario's alphabet is enumerated up to a bounded depth (depth-first, the
 * world cloned at each node), so no interleaving is hand-picked. Each step
 * is what the pipeline does to the ledger:
 *
 * - push: a `schedule` POST at the next date (cycling through the scenario's
 *   dates, so a device can move back). `ok` commits the new id `keep` and
 *   retires a `scheduled` previous; `no-id` commits `unconfirmed` listing
 *   every id its queue knew in `supersedes` (the entry exists, its id is
 *   unknown); `ambiguous` may or may not have created it and leaves
 *   `uncertain{previous}`.
 * - post / commit: the same push split at the POST, so a sync or another
 *   device's T5 can land in between. `post-*` claims (`attempting`, its
 *   `supersedes` read from the queue now), marks it posted and mints the
 *   id; `commit` merges its `Placed` into whatever the row holds by then.
 * - drain: sends every `retire` id and writes `gone`.
 * - abandon: every `retire` id failed three times (it stays on Garmin).
 * - dismiss: the athlete removes the lowest abandoned entry that is not the
 *   device's own `Placed` / `previous`, and says so (`gone`). A `held`
 *   entry is never dismissable (design §3.9).
 * - sync: `syncWithCloud` through the `exportLedger` hook (normalize, then
 *   the snapshot merge, then the live merge).
 * - t5: the `uncertain` resolution by `calendar-find` over the `uncertain`'s
 *   date and every `held` entry's date, or a failed read: one match at the
 *   `uncertain`'s date is adopted `keep` (a `scheduled` previous retires),
 *   unseen `held` ids become `gone`, seen ones stay `held`.
 *
 * Safety is checked after every step: a drain never sends the device's own
 * `Placed` or `previous`, and never empties a calendar that had a live
 * entry. At every leaf the devices sync and drain until nothing changes, and
 * must converge on one row whose `Placed`, if any, is live. The rows met on
 * the way form the pool for symmetry, idempotence and absorption, with no
 * well-formedness filter: every row checked is one the pipeline produced.
 */
import { describe, expect, it } from "vitest";

import { normalizeGarminLedgerRow } from "../export/normalize-garmin-ledger-row";
import { mergeGarminLedgerRows } from "./merge-garmin-ledger-rows";
import { mergeTableRows } from "./merge-table-rows";

type Row = Record<string, unknown>;
type Placement = {
  kind: string;
  workoutScheduleId?: string;
  workoutId?: string;
  date: string;
  supersedes?: string[];
  previous?: Placement;
};
type Entry = {
  workoutScheduleId: string;
  workoutId: string;
  date: string;
  attempts: number;
  abandoned: boolean;
  state?: string;
};
type Live = { id: string; date: string };
type World = {
  calendar: Live[];
  devices: Row[];
  cloud?: Row;
  tick: number;
  nextId: number;
  /** Pushes per device: each device walks the same dates, so its first
      push lands on the same date as another device's first push. */
  pushes: number[];
  /** How many of `DATES` the pushes cycle through. */
  dates: number;
  /** A device's POST that has not committed yet. */
  inflight: (Inflight | null)[];
};
type Inflight = {
  id: string;
  date: string;
  ok: boolean;
  known: string[];
  previous?: Placement;
};
type Step = { device: number; op: string };

const W = "1707805999";
const DATES = ["2026-09-29", "2026-09-30", "2026-10-01"];
const DEVICES = ["A", "B", "C"];
/** Device C's clock runs a day ahead: its writes always look newer. */
const DAY_MS = 86_400_000;
const MINUTE_MS = 60_000;
const SAMPLE_SIZE = 5;
const SKEW_MS = [0, 0, DAY_MS];
const EPOCH_MS = Date.parse("2026-09-28T08:00:00.000Z");

const scheduled = (id: string, date: string): Placement => ({
  kind: "scheduled",
  workoutScheduleId: id,
  workoutId: W,
  date,
});
const entry = (id: string, date: string, state: string, extra: Row = {}) => ({
  workoutScheduleId: id,
  workoutId: W,
  date,
  attempts: 0,
  abandoned: false,
  state,
  ...extra,
});
/** A round-1 queue entry: no `state`. */
const legacy = (id: string, date: string) => ({
  workoutScheduleId: id,
  workoutId: W,
  date,
  attempts: 0,
  abandoned: false,
});
const baseRow = (device: number, garmin: Row = {}): Row => ({
  id: `id-${DEVICES[device]}`,
  kaiordRecordId: "a0000000-0000-4000-8000-000000000001",
  dataType: "workout",
  destinationBridgeId: "garmin-bridge",
  destinationExternalId: W,
  contentHash: "hash",
  exportedAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
  library: { kind: "confirmed", workoutId: W },
  ...garmin,
});

/** Memoized: the enumeration repeats the same merges many times over. */
const merges = new Map<string, Row>();
const hookMerge = (x: Row, y: Row) => {
  const key = JSON.stringify([x, y]);
  let merged = merges.get(key);
  if (!merged) {
    merged = mergeTableRows("exportLedger", [x, y], new Map())[0];
    merges.set(key, merged);
  }
  return structuredClone(merged);
};
const placementOf = (r?: Row) => r?.placement as Placement | undefined;
const queueOf = (r?: Row) => (r?.removalQueue as Entry[] | undefined) ?? [];

// ---- the pipeline, as seen by the ledger ---------------------------------

const stamp = (world: World, device: number, row: Row): Row => {
  world.tick++;
  const at = EPOCH_MS + world.tick * MINUTE_MS + SKEW_MS[device];
  return { ...row, updatedAt: new Date(at).toISOString() };
};

const STATES = ["held", "keep", "retire", "gone"];
const rank = (e?: Entry) => (e ? STATES.indexOf(e.state ?? "held") : -1);

/** The pipeline's writes: each raises its id's state, never lowers it. */
const withQueue = (row: Row, add: Entry[]): Row => {
  const byId = new Map(queueOf(row).map((e) => [e.workoutScheduleId, e]));
  for (const e of add) {
    const seen = byId.get(e.workoutScheduleId);
    byId.set(e.workoutScheduleId, {
      ...(rank(e) > rank(seen) ? e : seen!),
      attempts: Math.max(e.attempts, seen?.attempts ?? 0),
      abandoned: e.abandoned || !!seen?.abandoned,
    });
  }
  const sorted = [...byId.values()].sort(
    (x, y) =>
      x.workoutScheduleId.length - y.workoutScheduleId.length ||
      (x.workoutScheduleId < y.workoutScheduleId ? -1 : 1)
  );
  return { ...row, removalQueue: sorted };
};

const retirePrevious = (previous?: Placement) =>
  previous?.kind === "scheduled" && previous.workoutScheduleId
    ? [entry(previous.workoutScheduleId, previous.date, "retire")]
    : [];

function push(world: World, device: number, outcome: string) {
  const row = world.devices[device];
  const current = placementOf(row);
  if (current?.kind === "uncertain") return; // the pipeline asks T5 first
  const date = DATES[world.pushes[device]++ % world.dates];
  const id = String(world.nextId++);
  const created = outcome !== "ambiguous-lost";
  if (created) world.calendar.push({ id, date });
  const previous =
    current?.kind === "scheduled" || current?.kind === "unconfirmed"
      ? current
      : undefined;
  let next: Row;
  if (outcome === "ok")
    next = withQueue({ ...row, placement: scheduled(id, date) }, [
      entry(id, date, "keep"),
      ...retirePrevious(previous),
    ]);
  else if (outcome === "no-id")
    next = withQueue(
      {
        ...row,
        placement: {
          kind: "unconfirmed",
          workoutId: W,
          date,
          supersedes: queueOf(row).map((e) => e.workoutScheduleId),
        },
      },
      retirePrevious(previous)
    );
  else
    next = {
      ...row,
      placement: {
        kind: "uncertain",
        workoutId: W,
        date,
        ...(previous ? { previous } : {}),
      },
    };
  world.devices[device] = stamp(world, device, next);
}

function post(world: World, device: number, ok: boolean) {
  const row = world.devices[device];
  const current = placementOf(row);
  if (current?.kind === "uncertain" || current?.kind === "attempting") return;
  const date = DATES[world.pushes[device]++ % world.dates];
  const id = String(world.nextId++);
  world.calendar.push({ id, date });
  const previous =
    current?.kind === "scheduled" || current?.kind === "unconfirmed"
      ? current
      : undefined;
  const known = queueOf(row).map((e) => e.workoutScheduleId);
  world.inflight[device] = { id, date, ok, known, previous };
  const claimed = stamp(world, device, row);
  const attempting = {
    kind: "attempting",
    workoutId: W,
    date,
    at: claimed.updatedAt,
    posted: true,
    ...(previous ? { previous } : {}),
    supersedes: known,
  };
  world.devices[device] = { ...claimed, placement: attempting };
}

/** The commit, as the guard-failed path does it: merge our `Placed` into the
    row as it is now (equal to a plain write when nothing changed). */
function commit(world: World, device: number) {
  const done = world.inflight[device];
  if (!done) return;
  world.inflight[device] = null;
  const row = world.devices[device];
  const placed = done.ok
    ? scheduled(done.id, done.date)
    : {
        kind: "unconfirmed",
        workoutId: W,
        date: done.date,
        supersedes: done.known,
      };
  const writes = [
    ...(done.ok ? [entry(done.id, done.date, "keep")] : []),
    ...retirePrevious(done.previous),
  ];
  const ours = stamp(
    world,
    device,
    withQueue({ ...row, placement: placed }, writes)
  );
  world.devices[device] = hookMerge(row, ours);
}

function t5(world: World, device: number, readOk: boolean) {
  const row = world.devices[device];
  const current = placementOf(row);
  if (current?.kind !== "uncertain" || !readOk) return;
  const states = new Map(queueOf(row).map((e) => [e.workoutScheduleId, e]));
  const held = queueOf(row).filter((e) => e.state === "held");
  const dates = new Set([current.date, ...held.map((e) => e.date)]);
  const read = world.calendar.filter((c) => dates.has(c.date));
  const matches = read.filter(
    (c) =>
      c.date === current.date &&
      ["held", "keep", undefined].includes(states.get(c.id)?.state)
  );
  if (matches.length !== 1) return; // several → duplicate-left; none → UI
  const [adopted] = matches;
  const live = new Set(read.map((c) => c.id));
  const writes = [
    entry(adopted.id, adopted.date, "keep"),
    ...retirePrevious(current.previous).filter(
      (e) => e.workoutScheduleId !== adopted.id
    ),
    ...held
      .filter((e) => !live.has(e.workoutScheduleId))
      .map((e) => entry(e.workoutScheduleId, e.date, "gone")),
  ];
  const next = withQueue(
    { ...row, placement: scheduled(adopted.id, adopted.date) },
    writes
  );
  world.devices[device] = stamp(world, device, next);
}

/** Returns a safety violation, if any. */
function drain(world: World, device: number): string | undefined {
  const row = world.devices[device];
  const own = placementOf(row);
  const ownIds = [own?.workoutScheduleId, own?.previous?.workoutScheduleId];
  const retired = queueOf(row).filter((e) => e.state === "retire");
  if (retired.length === 0) return;
  for (const e of retired)
    if (ownIds.includes(e.workoutScheduleId))
      return `${DEVICES[device]} drains its own Placed ${e.workoutScheduleId}`;
  const hadLive = world.calendar.length > 0;
  const ids = new Set(retired.map((e) => e.workoutScheduleId));
  world.calendar = world.calendar.filter((c) => !ids.has(c.id));
  const writes = retired.map((e) =>
    entry(e.workoutScheduleId, e.date, "gone", {
      attempts: e.attempts,
      abandoned: e.abandoned,
    })
  );
  world.devices[device] = stamp(world, device, withQueue(row, writes));
  if (hadLive && world.calendar.length === 0)
    return `${DEVICES[device]}'s drain empties the calendar`;
}

function abandon(world: World, device: number) {
  const row = world.devices[device];
  const retired = queueOf(row).filter((e) => e.state === "retire");
  if (retired.length === 0) return;
  const writes = retired.map((e) =>
    entry(e.workoutScheduleId, e.date, "retire", {
      attempts: 3,
      abandoned: true,
    })
  );
  world.devices[device] = stamp(world, device, withQueue(row, writes));
}

function dismiss(world: World, device: number) {
  const row = world.devices[device];
  const own = placementOf(row);
  const ownIds = [own?.workoutScheduleId, own?.previous?.workoutScheduleId];
  const target = queueOf(row).find(
    (e) =>
      e.abandoned && e.state !== "gone" && !ownIds.includes(e.workoutScheduleId)
  );
  if (!target) return;
  world.calendar = world.calendar.filter(
    (c) => c.id !== target.workoutScheduleId
  );
  const write = entry(target.workoutScheduleId, target.date, "gone");
  world.devices[device] = stamp(world, device, withQueue(row, [write]));
}

function sync(world: World, device: number) {
  const local = world.devices[device];
  const snapshot = world.cloud ? hookMerge(local, world.cloud) : local;
  world.devices[device] = hookMerge(local, snapshot);
  world.cloud = snapshot;
}

function apply(world: World, { device, op }: Step): string | undefined {
  if (op === "sync") sync(world, device);
  else if (op === "drain") return drain(world, device);
  else if (op === "t5") t5(world, device, true);
  else if (op === "t5-read-fails") t5(world, device, false);
  else if (op === "abandon") abandon(world, device);
  else if (op === "dismiss") dismiss(world, device);
  else if (op === "post-ok") post(world, device, true);
  else if (op === "post-no-id") post(world, device, false);
  else if (op === "commit") commit(world, device);
  else push(world, device, op.slice("push-".length));
}

// ---- enumeration ----------------------------------------------------------

const clone = (w: World): World => structuredClone(w);
const MAX_SETTLE_ROUNDS = 6;

/** Every device syncs and drains, round after round, until nothing moves. */
function settle(world: World): string | undefined {
  for (let round = 0; round < MAX_SETTLE_ROUNDS; round++) {
    const before = JSON.stringify(world);
    for (let d = 0; d < DEVICES.length; d++) {
      sync(world, d);
      const violation = drain(world, d);
      if (violation) return `${violation} while settling`;
    }
    if (JSON.stringify(world) === before) return converged(world);
  }
  return "never converges";
}

function converged(world: World): string | undefined {
  const [first] = world.devices;
  if (world.devices.some((r) => JSON.stringify(r) !== JSON.stringify(first)))
    return "devices disagree after settling";
  const p = placementOf(first);
  const live = (c: Live) =>
    p?.kind === "scheduled" ? c.id === p.workoutScheduleId : c.date === p?.date;
  if (
    (p?.kind === "scheduled" || p?.kind === "unconfirmed") &&
    !world.calendar.some(live)
  )
    return `settles on a dead Placed ${JSON.stringify(p)}`;
}

type Scenario = {
  name: string;
  seed: () => World;
  alphabet: Step[];
  depth: number;
};

const steps = (ops: string[], devices = [0, 1, 2]): Step[] =>
  devices.flatMap((device) => ops.map((op) => ({ device, op })));

const label = (path: Step[]) =>
  path.map((s) => `${DEVICES[s.device]}:${s.op}`).join(" ");

/** Explores every path; returns the failures and the rows met. */
function explore(s: Scenario) {
  const failures: string[] = [];
  const pairs = new Map<string, [Row, Row]>();
  /** Every pair of rows that co-exist in one world: the pairs a sync can
      actually meet. */
  const collect = (w: World) => {
    const rows = [...w.devices, w.cloud].flatMap((raw) =>
      raw ? [normalizeGarminLedgerRow(raw)] : []
    );
    for (const x of rows)
      for (const y of rows) pairs.set(JSON.stringify([x, y]), [x, y]);
  };
  const seen = new Set<string>();
  const visit = (world: World, path: Step[]) => {
    // The same world with the same depth left explores the same subtree.
    const key = `${path.length}\u0000${JSON.stringify(world)}`;
    if (seen.has(key)) return;
    seen.add(key);
    collect(world);
    const settled = clone(world);
    const end = settle(settled);
    collect(settled);
    if (end) failures.push(`${label(path)} → ${end}`);
    if (path.length === s.depth) return;
    for (const step of s.alphabet) {
      const next = clone(world);
      const violation = apply(next, step);
      if (violation) failures.push(`${label([...path, step])} → ${violation}`);
      else visit(next, [...path, step]);
    }
  };
  visit(s.seed(), []);
  return { failures, pairs: [...pairs.values()] };
}

// ---- scenarios ------------------------------------------------------------

const world = (
  devices: Row[],
  calendar: Live[],
  nextId = 100,
  dates = DATES.length
): World => ({
  calendar,
  devices,
  tick: 0,
  nextId,
  pushes: [0, 0, 0],
  dates,
  inflight: [null, null, null],
});

/** A fresh world with `script` already applied. */
const scripted = (script: Step[], dates?: number) => (): World => {
  const w = world(
    [0, 1, 2].map((d) => baseRow(d)),
    [],
    100,
    dates
  );
  for (const step of script) apply(w, step);
  return w;
};

/** A pushes and everyone syncs; then C goes offline while A moves the
    workout and drains, and B pushes concurrently. */
const staleWorld = scripted([
  { device: 0, op: "push-ok" },
  { device: 0, op: "sync" },
  { device: 1, op: "sync" },
  { device: 2, op: "sync" },
  { device: 0, op: "push-ok" },
  { device: 0, op: "drain" },
  { device: 0, op: "sync" },
  { device: 1, op: "push-ok" },
]);

/** C (clock ahead) pushes and gets no id; B's concurrent push to the same
    date is ambiguous and created nothing, so B's T5 adopts C's entry. */
const adoptedWorld = scripted([
  { device: 2, op: "push-no-id" },
  { device: 1, op: "push-ambiguous-lost" },
  { device: 1, op: "t5" },
]);

/** A moves S100 (D1) to S101 (D2), drains S100 and pushes back to D1 with
    no id; C saw only S100 and pushes to D1 with no id too: two id-less
    placements for one date with different known ids, merged by union. */
const unionWorld = scripted(
  [
    { device: 0, op: "push-ok" },
    { device: 0, op: "sync" },
    { device: 2, op: "sync" },
    { device: 0, op: "push-ok" },
    { device: 0, op: "drain" },
    { device: 0, op: "push-no-id" },
    { device: 2, op: "push-no-id" },
  ],
  2
);

/** B's POST to D1 was lost (`uncertain`); C (clock ahead) has POSTed to D1
    with no id and not committed yet, so B's T5 can adopt C's entry, sync
    and move on before C commits. */
const claimWorld = scripted([
  { device: 1, op: "push-ambiguous-lost" },
  { device: 2, op: "post-no-id" },
]);

/** The round-1 shape: stateless queue entries, normalized to `held`. */
const legacyWorld = (): World =>
  world(
    [
      baseRow(0, {
        placement: scheduled("2", DATES[1]),
        removalQueue: [legacy("1", DATES[0])],
      }),
      baseRow(1, {
        updatedAt: "2026-09-02T00:00:00.000Z",
        placement: scheduled("1", DATES[0]),
      }),
      baseRow(2, {
        placement: { kind: "uncertain", workoutId: W, date: DATES[1] },
        removalQueue: [
          legacy("1", DATES[0]),
          legacy("2", DATES[1]),
          legacy("3", DATES[2]),
        ],
      }),
    ],
    [
      { id: "1", date: DATES[0] },
      { id: "2", date: DATES[1] },
    ]
  );

const SCENARIOS: Scenario[] = [
  {
    name: "concurrent pushes from scratch",
    seed: () =>
      world(
        [0, 1, 2].map((d) => baseRow(d)),
        []
      ),
    alphabet: steps(["push-ok", "sync", "drain"]),
    depth: 5,
  },
  {
    name: "a stale offline device after moves and drains",
    seed: staleWorld,
    alphabet: steps(["push-ok", "sync", "drain"]),
    depth: 4,
  },
  {
    name: "ambiguous and id-less pushes resolved by T5",
    seed: () =>
      world(
        [0, 1, 2].map((d) => baseRow(d)),
        []
      ),
    alphabet: [
      ...steps(
        ["push-ok", "push-no-id", "push-ambiguous", "push-ambiguous-lost"],
        [0, 2]
      ),
      ...steps(["sync", "drain", "t5", "t5-read-fails"], [0, 1, 2]),
    ],
    depth: 4,
  },
  {
    name: "an id-less entry adopted by another device",
    seed: adoptedWorld,
    alphabet: steps(["push-ok", "sync", "drain"]),
    depth: 5,
  },
  {
    name: "legacy rows (review-3 D, probe3 and the normal<keep repro)",
    seed: legacyWorld,
    alphabet: [
      ...steps(["sync", "drain", "t5", "t5-read-fails", "dismiss"]),
      ...steps(["push-ok"], [2]),
    ],
    depth: 4,
  },
  {
    name: "moves back to an earlier date (round-3 L)",
    seed: scripted([], 2),
    alphabet: [
      ...steps(["push-ok", "push-no-id"], [0, 2]),
      ...steps(["sync", "drain"]),
    ],
    depth: 5,
  },
  {
    name: "two id-less pushes for one date with different known ids",
    seed: unionWorld,
    alphabet: [...steps(["sync", "drain"]), ...steps(["push-no-id"], [1])],
    depth: 4,
  },
  {
    name: "a sync between the POST and the commit",
    seed: claimWorld,
    alphabet: [
      // No mid-path drains: every leaf settles, which drains, and the
      // other scenarios drain mid-path.
      ...steps(["commit", "sync"], [2]),
      ...steps(["t5", "push-ok", "sync"], [1]),
      ...steps(["sync"], [0]),
    ],
    depth: 5,
  },
  {
    name: "abandoned and dismissed entries",
    seed: staleWorld,
    alphabet: [
      ...steps(["push-ok", "push-no-id"], [0, 2]),
      ...steps(["sync", "drain", "abandon", "dismiss"]),
    ],
    depth: 4,
  },
];

// ---- laws -----------------------------------------------------------------

describe("mergeGarminLedgerRows laws over enumerated histories", () => {
  const explored = SCENARIOS.map((s) => ({ s, ...explore(s) }));

  it.each(explored.map((e) => [e.s.name, e] as const))(
    "should stay safe and converge on every interleaving of %s",
    (_name, { failures }) => {
      // Arrange
      const sample = failures.slice(0, SAMPLE_SIZE);

      // Act
      const count = failures.length;

      // Assert
      expect({ count, sample }).toEqual({ count: 0, sample: [] });
    }
  );

  it("should meet two id-less placements for one date with different known ids", () => {
    // Arrange
    const { pairs } = explored.find((e) => e.s.name.startsWith("two id-less"))!;
    const differ = ([x, y]: [Row, Row]) => {
      const [p, q] = [placementOf(x), placementOf(y)];
      return (
        p?.kind === "unconfirmed" &&
        q?.kind === "unconfirmed" &&
        p.date === q.date &&
        JSON.stringify(p.supersedes) !== JSON.stringify(q.supersedes)
      );
    };

    // Act
    const met = pairs.filter(differ).length;

    // Assert
    expect(met).toBeGreaterThan(0);
  });

  it.each(explored.map((e) => [e.s.name, e.pairs] as const))(
    "should be symmetric, idempotent and absorbing over the rows of %s",
    (_name, pairs) => {
      // Arrange
      const broken: string[] = [];
      const merge = mergeGarminLedgerRows;
      const same = (x: Row, y: Row) => JSON.stringify(x) === JSON.stringify(y);

      // Act
      for (const [x, y] of pairs) {
        if (x === y && !same(merge(x, x), x)) broken.push("idempotence");
        const xy = merge(x, y);
        if (!same(xy, merge(y, x))) broken.push("symmetry");
        if (!same(merge(x, xy), xy) || !same(merge(xy, y), xy))
          broken.push("absorption");
      }

      // Assert
      expect({ pairs: pairs.length > 0, broken: [...new Set(broken)] }).toEqual(
        {
          pairs: true,
          broken: [],
        }
      );
    }
  );
});
