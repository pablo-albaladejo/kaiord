/**
 * The cross-device laws (AC-15) and the placement safety rules, checked on
 * the real pipeline: every step below calls the production modules against
 * the device's own in-memory ledger and one shared fake Garmin calendar
 * (the truth: which schedule ids are live), with failure injection through
 * the calendar's scripts. `merge-garmin-ledger-rows.laws.test.ts` checks the
 * same laws on a hand model of the pipeline; this one has no model.
 *
 * A world is the calendar, three devices (C's clock a day ahead, so its
 * writes always look newer and its reads always pass another device's
 * gate: the skewed reader of residual L1) and the cloud row. Each step
 * moves the clock `TICK_MS`, so a history meets both sides of a gate. Every order of a scenario's
 * steps is enumerated up to a bounded depth (depth-first, the world cloned
 * at each node), so no interleaving is hand-picked:
 *
 * - push-*: `reconcileGarminPlacement` at the device's next date with the
 *   POST answering ok, 2xx without an id, 5xx after creating the entry
 *   (ambiguous) or 5xx without creating it (ambiguous-lost), or ok with
 *   every DELETE of the run failing (delete-fails).
 * - post-* / commit: the same push split at the POST (claim + post, then
 *   commit + finish), so a sync or another device lands in between.
 * - post-late / land: a POST Garmin commits later (a sleeping sender): the
 *   answer is ambiguous with no entry, the run stops at its
 *   `attempting{posted:true}`, and `land` creates the entry on a later step.
 * - resend: the push again at the device's current `Placed` date (no move:
 *   the run only verifies and drains).
 * - drain: `drainQueue` for the device's current `Placed`.
 * - abandon: three drains with every DELETE failing.
 * - dismiss: the athlete removes the first dismissable entry by hand.
 * - t5 / t5-read-fails: `resolveUncertain` on a legacy `uncertain`.
 * - confirm: "It's in Garmin" on an unresolved placement: blind before the
 *   attempt's gate, else only when its date shows an entry.
 * - sync: `syncWithCloud` through the `exportLedger` hook.
 * - sync-rejected: the upload is rejected; the device pulls the cloud row
 *   and the cloud keeps its own.
 *
 * After every step: a push that reports a success leaves no `uncertain`
 * row; no DELETE hit the device's own `Placed` or
 * `attempting.previous`, no step but a dismiss emptied a calendar that had
 * a live entry (never a gap), and a push whose POST answered ok and that
 * reports `scheduled` or `moved` left an entry on its desired date. At every node the devices sync and drain
 * until nothing changes and must converge on one row whose `Placed`, if
 * any, is live, and in which no entry recorded `gone` is still on Garmin.
 * The rows met form the pool for symmetry, idempotence and
 * absorption.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import {
  type CalendarItem,
  createFakeGarminCalendar,
  type ScheduleScript,
} from "../../test-utils/fake-garmin-calendar";
import { createInMemoryExportLedgerRepository } from "../../test-utils/in-memory-export-ledger-repository";
import { LEDGER_KEY, RECORD_ID } from "../../test-utils/placement-harness";
import type { ExportLedgerEntry } from "../../types/export-ledger";
import {
  type GarminWorkoutId,
  isGarminPlaced,
} from "../../types/garmin-ledger";
import { normalizeGarminLedgerRow } from "../export/normalize-garmin-ledger-row";
import { mergeGarminLedgerRows } from "../sync/merge-garmin-ledger-rows";
import { mergeTableRows } from "../sync/merge-table-rows";
import type { BridgeFailure } from "./garmin-calendar-port";
import { claimPlacement } from "./placement-claim";
import { commitPlacement, placedFrom } from "./placement-commit";
import { confirmInGarmin } from "./placement-confirm";
import type { PlacementRun } from "./placement-deps";
import { dismissableEntries, dismissRemovalEntry } from "./placement-dismiss";
import { finishPlacement } from "./placement-finish";
import { drainQueue, protectedIds } from "./placement-removal-step";
import { gateOf } from "./placement-resolve";
import { resolveUncertain } from "./placement-resolve-uncertain";
import type { PlacementResult } from "./placement-result";
import { type PostOutcome, postSchedule } from "./placement-schedule-step";
import { MAX_DELETE_ATTEMPTS } from "./placement-timing";
import { reconcileGarminPlacement } from "./reconcile-garmin-placement";

type Row = ExportLedgerEntry;
type Answered = Extract<PostOutcome, { kind: "answered" }>;
type World = {
  clock: number;
  items: CalendarItem[];
  nextId: number;
  devices: Row[];
  cloud?: Row;
  /** Pushes per device: every device walks the same dates. */
  pushes: number[];
  /** How many of `DATES` the pushes cycle through. */
  dates: number;
  /** The device's bridge reports `calendar-find-v1`. */
  canFind: boolean[];
  /** A device's POST that has not committed yet. */
  inflight: (Answered | null)[];
  /** Dates of POSTs Garmin has accepted but not created yet. */
  late: string[];
};
type Step = { device: number; op: string };
type Device =
  ReturnType<typeof openDevice> extends Promise<infer D> ? D : never;

const W = "1707805999" as GarminWorkoutId;
const DATES = ["2026-09-29", "2026-09-30", "2026-10-01"];
const DEVICES = ["A", "B", "C"];
const DAY_MS = 86_400_000;
/** Under `POST_GATE_MS`: a gate passes after a few steps, never one. */
const TICK_MS = 10_000;
const SAMPLE_SIZE = 5;
const EXPLORE_TIMEOUT_MS = 60_000;
const SKEW_MS = [0, 0, DAY_MS];
const EPOCH_MS = Date.parse("2026-09-28T08:00:00.000Z");
/** More failures than any single step sends. */
const FAILING = 12;
const SERVER_ERROR: BridgeFailure = { ok: false, status: 500 };

const baseRow = (device: number, garmin: Partial<Row> = {}): Row => ({
  id: `id-${DEVICES[device]}`,
  kaiordRecordId: RECORD_ID,
  dataType: "workout",
  destinationBridgeId: LEDGER_KEY.destinationBridgeId,
  destinationExternalId: W,
  contentHash: "hash",
  exportedAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
  library: { kind: "confirmed", workoutId: W },
  ...garmin,
});

/** Memoized: the enumeration repeats the same merges many times over. */
const merges = new Map<string, Row>();
const hookMerge = (x: Row, y: Row): Row => {
  const key = JSON.stringify([x, y]);
  let merged = merges.get(key);
  if (!merged) {
    merged = mergeTableRows("exportLedger", [x, y], new Map())[0] as Row;
    merges.set(key, merged);
  }
  return structuredClone(merged);
};

// ---- a device: the real modules over its ledger and the shared calendar --

async function openDevice(world: World, device: number) {
  vi.setSystemTime(world.clock + SKEW_MS[device]);
  const ledgerRepo = createInMemoryExportLedgerRepository();
  await ledgerRepo.insertPending(structuredClone(world.devices[device]));
  const calendar = createFakeGarminCalendar(world.nextId);
  calendar.items.push(...structuredClone(world.items));
  const run: PlacementRun = {
    deps: {
      ledgerRepo,
      calendar: calendar.port,
      canFind: world.canFind[device],
      scheduleIdsInFind: true,
      now: () => Date.now(),
      sleep: async (ms) => {
        vi.setSystemTime(Date.now() + ms);
      },
    },
    key: LEDGER_KEY,
    desired: { workoutId: W, date: DATES[0] },
    minted: false,
    sendAnyway: false,
  };
  const row = async () => (await ledgerRepo.findByNaturalKey(LEDGER_KEY))!;
  return { run, calendar, row };
}

async function closeDevice(world: World, device: number, d: Device) {
  world.devices[device] = await d.row();
  world.items = structuredClone(d.calendar.items);
  // Each POST mints at most one id; an unused id is never reused.
  world.nextId += d.calendar.count("schedule");
  world.clock = Date.now() - SKEW_MS[device] + TICK_MS;
}

const nextDate = (world: World, device: number) =>
  DATES[world.pushes[device]++ % world.dates];

// ---- the steps ------------------------------------------------------------

/** Results that tell the athlete the workout is placed. */
const SUCCESSES = new Set([
  "scheduled",
  "moved",
  "unchanged",
  "duplicate-left",
]);

/** A success reported over a row the run left `uncertain`. */
async function misreport(device: number, d: Device, result: PlacementResult) {
  const row = await d.row();
  if (SUCCESSES.has(result.kind) && row.placement?.kind === "uncertain")
    return `${DEVICES[device]} reports ${result.kind} on an uncertain row`;
}

/** An op returns a safety violation, if it sees one. */
type Op = (
  world: World,
  device: number,
  d: Device
) => Promise<string | undefined | void>;

const push =
  (script: ScheduleScript, deletesFail = false): Op =>
  async (world, device, d) => {
    const desired = { workoutId: W, date: nextDate(world, device) };
    d.calendar.scripts.schedule.push(script);
    if (deletesFail)
      d.calendar.scripts.unschedule.push(...Array(FAILING).fill(SERVER_ERROR));
    const result = await reconcileGarminPlacement({ ...d.run, desired });
    const okPost = !script.answer && d.calendar.count("schedule") > 0;
    const placed = result.kind === "scheduled" || result.kind === "moved";
    const onDate = d.calendar.items.some(
      (i) => i.workoutId === W && i.date === desired.date
    );
    if (okPost && placed && !onDate)
      return `${DEVICES[device]}'s ok push reports ${result.kind} with ${desired.date} empty`;
    return misreport(device, d, result);
  };

/** The athlete sends again without moving: the run only drains. */
const resend: Op = async (_world, device, d) => {
  const p = (await d.row()).placement;
  if (!isGarminPlaced(p)) return;
  const desired = { workoutId: W, date: p.date };
  const result = await reconcileGarminPlacement({ ...d.run, desired });
  return misreport(device, d, result);
};

const post =
  (script: ScheduleScript, late = false): Op =>
  async (world, device, d) => {
    if (world.inflight[device]) return;
    const run = { ...d.run, desired: { workoutId: W, date: "" } };
    run.desired.date = nextDate(world, device);
    const claim = await claimPlacement(run);
    if (claim.kind !== "claimed") return;
    d.calendar.scripts.schedule.push(script);
    const posted = await postSchedule(run, claim.attempt);
    if (posted.kind !== "answered") return;
    if (late) world.late.push(run.desired.date);
    else world.inflight[device] = posted;
  };

/** The oldest late POST lands on Garmin. */
const land: Op = async (world, _device, d) => {
  const date = world.late.shift();
  if (!date) return;
  d.calendar.mint(W, date);
  // The late POST's id: `closeDevice` counts only this step's POSTs.
  world.nextId++;
};

/** The rest of an ok POST: commit, then drain (`postAttempt`'s ok path). */
const commit: Op = async (world, device, d) => {
  const done = world.inflight[device];
  world.inflight[device] = null;
  if (!done?.answer.ok) return;
  const placed = placedFrom(done.attempt, done.answer.workoutScheduleId);
  const verdict = await commitPlacement(
    d.run,
    done.attempt,
    placed,
    done.written
  );
  if (verdict === "committed")
    await finishPlacement(d.run, placed, "scheduled", []);
};

const drain: Op = async (_world, _device, d) => {
  const placement = (await d.row()).placement;
  if (isGarminPlaced(placement)) await drainQueue(d.run, placement);
};

const abandon: Op = async (world, device, d) => {
  for (let i = 0; i < MAX_DELETE_ATTEMPTS; i++) {
    d.calendar.scripts.unschedule.push(...Array(FAILING).fill(SERVER_ERROR));
    await drain(world, device, d);
    d.calendar.scripts.unschedule.length = 0;
  }
};

const dismiss: Op = async (_world, _device, d) => {
  const [target] = dismissableEntries(await d.row());
  if (!target) return;
  const at = d.calendar.items.findIndex(
    (i) => i.id === target.workoutScheduleId
  );
  if (at >= 0) d.calendar.items.splice(at, 1);
  await dismissRemovalEntry(d.run.deps, LEDGER_KEY, target.workoutScheduleId);
};

const t5 =
  (readOk: boolean): Op =>
  async (_world, _device, d) => {
    const placement = (await d.row()).placement;
    if (placement?.kind !== "uncertain") return;
    if (!readOk)
      d.calendar.scripts.find.push(...Array(FAILING).fill(SERVER_ERROR));
    await resolveUncertain(d.run, placement);
  };

/** The athlete answers blind only while the POST may still land (the
    hazard the gate refuses); after it, only on an entry they can see. */
const confirm: Op = async (_world, _device, d) => {
  const p = (await d.row()).placement;
  const early = p?.kind === "attempting" && Date.now() < gateOf(p);
  const seen = d.calendar.items.some((i) => i.date === p?.date);
  if (early || seen) await confirmInGarmin(d.run);
};

const OPS: Record<string, Op> = {
  "push-ok": push({}),
  "push-no-id": push({ noId: true }),
  "push-delete-fails": push({}, true),
  "push-ambiguous": push({ answer: SERVER_ERROR, create: true }),
  "push-ambiguous-lost": push({ answer: SERVER_ERROR }),
  "post-ok": post({}),
  "post-no-id": post({ noId: true }),
  "post-late": post({ answer: SERVER_ERROR }, true),
  land,
  commit,
  resend,
  drain,
  abandon,
  dismiss,
  t5: t5(true),
  "t5-read-fails": t5(false),
  confirm,
};

function sync(world: World, device: number) {
  const local = world.devices[device];
  const snapshot = world.cloud ? hookMerge(local, world.cloud) : local;
  world.devices[device] = hookMerge(local, snapshot);
  world.cloud = snapshot;
}

function pull(world: World, device: number) {
  if (world.cloud)
    world.devices[device] = hookMerge(world.devices[device], world.cloud);
}

/** Runs one step; returns a safety violation, if any. */
async function apply(world: World, step: Step): Promise<string | undefined> {
  const { device, op } = step;
  if (op === "sync") {
    sync(world, device);
    return;
  }
  if (op === "sync-rejected") {
    pull(world, device);
    return;
  }
  const hadLive = world.items.length > 0;
  const d = await openDevice(world, device);
  const seen = await OPS[op](world, device, d);
  const own = protectedIds(await d.row());
  await closeDevice(world, device, d);
  const hit = d.calendar.calls.find(
    (c) => c.op === "unschedule" && own.has(c.id)
  );
  const name = DEVICES[device];
  if (seen) return seen;
  if (hit?.op === "unschedule")
    return `${name} deletes its own Placed ${hit.id}`;
  if (op !== "dismiss" && hadLive && world.items.length === 0)
    return `${name}'s ${op} empties the calendar`;
}

// ---- enumeration ----------------------------------------------------------

const MAX_SETTLE_ROUNDS = 6;

/** Every device syncs and drains, round after round, until nothing moves. */
async function settle(world: World): Promise<string | undefined> {
  for (let round = 0; round < MAX_SETTLE_ROUNDS; round++) {
    const before = JSON.stringify([world.devices, world.cloud, world.items]);
    for (let device = 0; device < DEVICES.length; device++) {
      sync(world, device);
      const violation = await apply(world, { device, op: "drain" });
      if (violation) return `${violation} while settling`;
    }
    const after = JSON.stringify([world.devices, world.cloud, world.items]);
    if (after === before) return converged(world);
  }
  return "never converges";
}

/** One row on every device; a `gone` entry is off Garmin (never a hidden
    duplicate); the `Placed`, if any, is live. */
function converged(world: World): string | undefined {
  const [first] = world.devices;
  if (world.devices.some((r) => JSON.stringify(r) !== JSON.stringify(first)))
    return "devices disagree after settling";
  const live = new Set(world.items.map((i) => i.id));
  const lie = first.removalQueue?.find(
    (e) => e.state === "gone" && live.has(e.workoutScheduleId)
  );
  if (lie) return `records a live entry gone ${lie.workoutScheduleId}`;
  const p = first.placement;
  if (!isGarminPlaced(p)) return;
  const placed = world.items.some((i) =>
    p.kind === "scheduled" ? i.id === p.workoutScheduleId : i.date === p.date
  );
  if (!placed) return `settles on a dead Placed ${JSON.stringify(p)}`;
}

type Scenario = {
  name: string;
  seed: () => Promise<World>;
  alphabet: Step[];
  depth: number;
  /** About half the distinct states explored when written: a scenario
      whose steps turn into no-ops fails here instead of passing empty. */
  minVisited: number;
};

const steps = (ops: string[], devices = [0, 1, 2]): Step[] =>
  devices.flatMap((device) => ops.map((op) => ({ device, op })));

const label = (path: Step[]) =>
  path.map((s) => `${DEVICES[s.device]}:${s.op}`).join(" ");

/** Explores every path; returns the failures and the row pairs met. */
async function explore(s: Scenario) {
  const failures: string[] = [];
  const pairs = new Map<string, [Row, Row]>();
  /** Every pair of rows that co-exist in one world. */
  const collect = (w: World) => {
    const rows = [...w.devices, w.cloud].flatMap((raw) =>
      raw ? [normalizeGarminLedgerRow(raw) as Row] : []
    );
    for (const x of rows)
      for (const y of rows) pairs.set(JSON.stringify([x, y]), [x, y]);
  };
  const seen = new Set<string>();
  const visit = async (world: World, path: Step[]) => {
    const key = `${path.length}\u0000${JSON.stringify(world)}`;
    if (seen.has(key)) return;
    seen.add(key);
    collect(world);
    const settled = structuredClone(world);
    const end = await settle(settled);
    collect(settled);
    if (end) failures.push(`${label(path)} → ${end}`);
    if (path.length === s.depth) return;
    for (const step of s.alphabet) {
      const next = structuredClone(world);
      const violation = await apply(next, step);
      if (violation) failures.push(`${label([...path, step])} → ${violation}`);
      else await visit(next, [...path, step]);
    }
  };
  await visit(await s.seed(), []);
  return { failures, pairs: [...pairs.values()], visited: seen.size };
}

// ---- scenarios ------------------------------------------------------------

type Seed = {
  devices?: Row[];
  items?: CalendarItem[];
  dates?: number;
  canFind?: boolean[];
};

const world = (seed: Seed = {}): World => ({
  clock: EPOCH_MS,
  items: seed.items ?? [],
  nextId: 100,
  devices: seed.devices ?? [0, 1, 2].map((d) => baseRow(d)),
  pushes: [0, 0, 0],
  dates: seed.dates ?? DATES.length,
  canFind: seed.canFind ?? [true, true, true],
  inflight: [null, null, null],
  late: [],
});

/** A fresh world with `script` already applied. */
const scripted =
  (script: Step[], seed: Seed = {}) =>
  async (): Promise<World> => {
    const w = world(seed);
    for (const step of script) await apply(w, step);
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
  { device: 0, op: "sync" },
  { device: 1, op: "push-ok" },
]);

/** C (clock ahead) pushes and gets no id; B's push to the same date is
    ambiguous and created nothing, so B's in-run read adopts C's entry. */
const adoptedWorld = scripted([
  { device: 2, op: "push-no-id" },
  { device: 1, op: "push-ambiguous-lost" },
]);

/** A moves S100 (D1) to S101 (D2) and back to D1 with no id; C saw only
    S100 and pushes to D1 with no id too: two id-less placements for one
    date with different known ids, merged by union. */
const unionWorld = scripted(
  [
    { device: 0, op: "push-ok" },
    { device: 0, op: "sync" },
    { device: 2, op: "sync" },
    { device: 0, op: "push-ok" },
    { device: 0, op: "push-no-id" },
    { device: 2, op: "push-no-id" },
  ],
  { dates: 2 }
);

/** B's POST to D1 was lost; C (clock ahead) has POSTed to D1 with no id
    and not committed yet. */
const claimWorld = scripted([
  { device: 1, op: "push-ambiguous-lost" },
  { device: 2, op: "post-no-id" },
]);

/** The round-1 shape: stateless queue entries, normalized to `held` by
    the v36 migration before the pipeline ever reads them. */
const legacy = (id: string, date: string) => ({
  workoutScheduleId: id,
  workoutId: W,
  date,
  attempts: 0,
  abandoned: false,
});
const legacyWorld = async () =>
  world({
    devices: [
      baseRow(0, {
        placement: {
          kind: "scheduled",
          workoutScheduleId: "2",
          workoutId: W,
          date: DATES[1],
        },
        removalQueue: [legacy("1", DATES[0])],
      }),
      baseRow(1, {
        updatedAt: "2026-09-02T00:00:00.000Z",
        placement: {
          kind: "scheduled",
          workoutScheduleId: "1",
          workoutId: W,
          date: DATES[0],
        },
      }),
      baseRow(2, {
        placement: { kind: "uncertain", workoutId: W, date: DATES[1] },
        removalQueue: [
          legacy("1", DATES[0]),
          legacy("2", DATES[1]),
          legacy("3", DATES[2]),
        ],
      }),
    ].map((r) => normalizeGarminLedgerRow(r) as Row),
    items: [
      { id: "1", workoutId: W, date: DATES[0] },
      { id: "2", workoutId: W, date: DATES[1] },
    ] as CalendarItem[],
  });

/** B moves its workout to D2 with a POST Garmin commits only later. */
const lateWorld = scripted([
  { device: 1, op: "push-ok" },
  { device: 1, op: "post-late" },
]);

/** The §3.9 skew counterexample, up to B's move to S104: C (a day ahead)
    synced Placed S102, then moved to S103 without syncing; B adopted
    S103 for its late POST, moved to S104 and deleted S103. */
const skewWorld = scripted([
  { device: 1, op: "push-ok" },
  { device: 1, op: "post-late" },
  { device: 2, op: "push-ok" },
  { device: 2, op: "sync" },
  { device: 2, op: "push-ok" },
  { device: 1, op: "push-ok" },
]);

const PUSHES = [
  "push-ok",
  "push-no-id",
  "push-ambiguous",
  "push-ambiguous-lost",
];

const SCENARIOS: Scenario[] = [
  {
    name: "concurrent pushes from scratch",
    seed: async () => world(),
    alphabet: steps(["push-ok", "sync", "drain"]),
    depth: 4,
    minVisited: 500,
  },
  {
    name: "a stale offline device after moves and drains",
    seed: staleWorld,
    alphabet: steps(["push-ok", "sync", "drain"]),
    depth: 3,
    minVisited: 95,
  },
  {
    name: "ambiguous and id-less pushes resolved by a read",
    seed: async () => world(),
    alphabet: [...steps(PUSHES, [0, 2]), ...steps(["sync"])],
    depth: 3,
    minVisited: 430,
  },
  {
    name: "an id-less entry adopted by another device",
    seed: adoptedWorld,
    alphabet: steps(["push-ok", "sync", "drain"]),
    depth: 3,
    minVisited: 115,
  },
  {
    name: "legacy rows resolved by T5",
    seed: legacyWorld,
    alphabet: [
      ...steps(["sync", "drain", "t5", "t5-read-fails", "dismiss"]),
      ...steps(["push-ok"], [2]),
    ],
    depth: 3,
    minVisited: 60,
  },
  {
    name: "moves back to an earlier date",
    seed: scripted([], { dates: 2 }),
    alphabet: [
      ...steps(
        ["push-ok", "push-no-id", "push-delete-fails", "push-ambiguous-lost"],
        [0, 2]
      ),
      ...steps(["sync"]),
    ],
    depth: 4,
    minVisited: 1750,
  },
  {
    name: "two id-less pushes for one date with different known ids",
    seed: unionWorld,
    alphabet: [...steps(["sync", "drain"]), ...steps(["push-no-id"], [1])],
    depth: 3,
    minVisited: 34,
  },
  {
    name: "a sync between the POST and the commit",
    seed: claimWorld,
    alphabet: [
      ...steps(["commit", "sync"], [2]),
      ...steps(["push-ok", "sync"], [1]),
      ...steps(["sync"], [0]),
    ],
    depth: 5,
    minVisited: 310,
  },
  {
    name: "abandoned and dismissed entries",
    seed: staleWorld,
    alphabet: [
      ...steps(["push-delete-fails"], [0, 2]),
      ...steps(["sync", "abandon", "dismiss"]),
    ],
    depth: 4,
    minVisited: 245,
  },
  {
    name: "an old bridge without calendar-find",
    seed: scripted([], { canFind: [true, false, true] }),
    alphabet: [
      ...steps(["push-ambiguous", "push-ok", "confirm"], [1]),
      ...steps(["push-ok"], [0]),
      ...steps(["sync"]),
    ],
    depth: 4,
    minVisited: 410,
  },
  {
    name: "a POST that lands after the reads, with a skewed reader",
    seed: lateWorld,
    alphabet: [
      ...steps(["sync"], [1, 2]),
      ...steps(["sync-rejected"], [2]),
      ...steps(["confirm", "push-ok"], [1]),
      ...steps(["push-ok", "post-ok", "commit"], [2]),
      ...steps(["land"], [0]),
    ],
    depth: 4,
    minVisited: 565,
  },
  {
    name: "a stale Placed that wins the merge after its entry was deleted",
    seed: skewWorld,
    alphabet: [
      ...steps(["sync", "resend", "push-ok"], [1, 2]),
      ...steps(["land"], [0]),
    ],
    depth: 3,
    minVisited: 80,
  },
];

// ---- laws -----------------------------------------------------------------

describe("the placement pipeline over enumerated cross-device histories", () => {
  const explored: Array<{ s: Scenario } & Awaited<ReturnType<typeof explore>>> =
    [];

  beforeAll(async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    for (const s of SCENARIOS) explored.push({ s, ...(await explore(s)) });
  }, EXPLORE_TIMEOUT_MS);
  afterAll(() => vi.useRealTimers());

  it.each(SCENARIOS.map((s) => [s.name]))(
    "should stay safe and converge on every interleaving of %s",
    (name) => {
      // Arrange
      const { s, failures, visited } = explored.find((e) => e.s.name === name)!;
      const sample = failures.slice(0, SAMPLE_SIZE);

      // Act
      const count = failures.length;
      const explores = visited >= s.minVisited;

      // Assert
      expect({ count, sample, explores }).toEqual({
        count: 0,
        sample: [],
        explores: true,
      });
    }
  );

  it("should meet two id-less placements for one date with different known ids", () => {
    // Arrange
    const { pairs } = explored.find((e) => e.s.name.startsWith("two id-less"))!;
    const differ = ([x, y]: [Row, Row]) => {
      const [p, q] = [x.placement, y.placement];
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

  it.each(SCENARIOS.map((s) => [s.name]))(
    "should be symmetric, idempotent and absorbing over the rows of %s",
    (name) => {
      // Arrange
      const { pairs } = explored.find((e) => e.s.name === name)!;
      const broken: string[] = [];
      const merge = (x: Row, y: Row) =>
        mergeGarminLedgerRows(x as never, y as never);
      const same = (x: unknown, y: unknown) =>
        JSON.stringify(x) === JSON.stringify(y);

      // Act
      for (const [x, y] of pairs) {
        if (same(x, y) && !same(merge(x, x), x)) broken.push("idempotence");
        const xy = merge(x, y) as Row;
        if (!same(xy, merge(y, x))) broken.push("symmetry");
        if (!same(merge(x, xy), xy) || !same(merge(xy, y), xy))
          broken.push("absorption");
      }

      // Assert
      expect({ pairs: pairs.length > 0, broken: [...new Set(broken)] }).toEqual(
        { pairs: true, broken: [] }
      );
    }
  );
});
