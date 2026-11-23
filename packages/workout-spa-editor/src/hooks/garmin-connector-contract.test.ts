/**
 * The Garmin Connector at the message contract with the extension
 * (docs/adr/0004-thin-bridge-smart-connector.md). The current extension
 * (protocol 2) answers `request` with Garmin's raw answer and the Connector
 * reads it; an extension one protocol version behind (1) refuses `request`
 * and answers the legacy actions already read. The reading cases are the
 * extension's former ones, same inputs, same expected answers.
 */
import { afterEach, describe, expect, it } from "vitest";

import {
  GARMIN_ACTIVITIES_PATH,
  GARMIN_UPLOAD_PATH,
  GARMIN_WORKOUT_PATH,
  GARMIN_WORKOUTS_PATH,
  garminMonthPath,
  garminSchedulePath,
} from "../adapters/garmin/connector/garmin-paths";
import { pushGarminBodyComposition } from "../adapters/garmin/garmin-body-composition-transport";
import { closedListOf, isListed } from "../test-utils/bridge-closed-list";
import {
  currentExtension,
  json,
  previousExtension,
  uninstallFakeExtension,
} from "../test-utils/fake-bridge-extension";
import { executeList, executePush } from "./garmin-bridge-operations";
import { createGarminCalendarPort } from "./garmin-calendar-operations";

const EXT = "garmin-ext";
const HTTP_ACCEPTED = 202;
const LISTED_ENTRIES = 7;
// A FIT header: its size, the protocol, then ".FIT" at bytes 8-11.
// eslint-disable-next-line no-magic-numbers -- fixed FIT header bytes
const FIT_HEADER = [14, 16, 0, 0, 0, 0, 0, 0, 46, 70, 73, 84, 0, 0];
const calendar = createGarminCalendarPort(() => EXT);
const GCN = { workoutName: "Tempo", workoutSegments: [] };

// Shaped on the live capture: numeric ids, `itemType`, a `YYYY-MM-DD` date,
// and many other keys the Connector must not hand on.
const item = (overrides: Record<string, unknown> = {}) => ({
  id: 1792409369,
  groupId: null,
  trainingPlanId: 0,
  itemType: "workout",
  activityTypeId: null,
  date: "2026-10-06",
  sportTypeKey: "running",
  workoutId: 1711500235,
  protectedWorkoutSchedule: false,
  title: "Tempo 5k",
  workoutUuid: null,
  ...overrides,
});
const month = (calendarItems: unknown[]) =>
  json({ year: 2026, month: 9, calendarItems });

afterEach(() => uninstallFakeExtension());

describe("Garmin Connector, current extension (protocol 2)", () => {
  it("should send the workout as the body of the one write and read Garmin's id", async () => {
    // Arrange
    const sent = currentExtension({
      [`POST ${GARMIN_WORKOUT_PATH}`]: json({
        workoutId: 4242,
        workoutName: "Tempo",
      }),
    });

    // Act
    const res = await executePush(EXT, GCN);

    // Assert
    expect(sent).toEqual([
      {
        action: "request",
        method: "POST",
        path: GARMIN_WORKOUT_PATH,
        body: GCN,
      },
    ]);
    expect(res).toEqual({ status: "success", garminWorkoutId: "4242" });
  });

  it("should ask the athlete to sign in when Garmin refuses the write", async () => {
    // Arrange
    currentExtension({
      [`POST ${GARMIN_WORKOUT_PATH}`]: {
        refuse: {
          error: "Request failed: 401",
          status: 401,
          needsReauth: true,
        },
      },
    });

    // Act
    const res = await executePush(EXT, GCN);

    // Assert
    expect(res).toMatchObject({
      status: "error",
      reason: "sign-in",
      redetect: true,
    });
  });

  it.each([
    { status: 403, error: "Request failed: 403" },
    { status: 401, error: "Request failed: 401" },
  ])(
    "should say Garmin is not answering, not signed out, when the extension refuses a write with a bare $status",
    async (refusal) => {
      // Arrange
      currentExtension({ [`POST ${GARMIN_WORKOUT_PATH}`]: { refuse: refusal } });

      // Act
      const res = await executePush(EXT, GCN);

      // Assert
      expect(res).toMatchObject({
        status: "error",
        reason: "not-answering",
        redetect: true,
      });
    }
  );

  it("should list the athlete's workouts from Garmin's raw answer", async () => {
    // Arrange
    currentExtension({
      [`GET ${GARMIN_WORKOUTS_PATH}`]: json([
        { workoutId: 1 },
        { workoutId: 2 },
      ]),
    });

    // Act
    const res = await executeList(EXT);

    // Assert
    expect(res).toEqual({
      data: [{ workoutId: 1 }, { workoutId: 2 }],
      redetect: false,
    });
  });

  it("should place a workout on a date and return only the schedule id as a digit string", async () => {
    // Arrange
    const path = garminSchedulePath("1707805999");
    const sent = currentExtension({
      [`POST ${path}`]: json({
        workoutScheduleId: 1790718680,
        workout: { workoutId: 1 },
      }),
    });

    // Act
    const res = await calendar.schedule("1707805999" as never, "2026-09-29");

    // Assert
    expect(sent[0]).toEqual({
      action: "request",
      method: "POST",
      path,
      body: { date: "2026-09-29" },
    });
    expect(res).toEqual({ ok: true, workoutScheduleId: "1790718680" });
  });

  it("should return a null schedule id when a 2xx carries no usable id", async () => {
    // Arrange
    currentExtension({
      [`POST ${garminSchedulePath("1707805999")}`]: json({
        workout: { workoutId: 1 },
      }),
    });

    // Act
    const res = await calendar.schedule("1707805999" as never, "2026-09-29");

    // Assert
    expect(res).toEqual({ ok: true, workoutScheduleId: null });
  });

  it.each([
    ["12a", "2026-09-29"],
    ["../1", "2026-09-29"],
    ["01707805999", "2026-09-29"],
    ["0", "2026-09-29"],
    ["1", "2026-02-30"],
    ["1", "2026-9-29"],
  ])(
    "should refuse to place workout %s on %s before sending anything",
    async (workoutId, date) => {
      // Arrange
      const sent = currentExtension({});

      // Act
      const res = await calendar.schedule(workoutId as never, date as never);

      // Assert
      expect(res).toMatchObject({ ok: false, retryable: false });
      expect(sent).toEqual([]);
    }
  );

  it("should remove one calendar entry and map a 204 to success", async () => {
    // Arrange
    const path = garminSchedulePath("1790718680");
    const sent = currentExtension({
      [`DELETE ${path}`]: { status: 204, body: "" },
    });

    // Act
    const res = await calendar.unschedule("1790718680" as never);

    // Assert
    expect(sent[0]).toEqual({ action: "request", method: "DELETE", path });
    expect(res).toEqual({ ok: true });
  });

  it("should keep the 404 status of a failed unschedule", async () => {
    // Arrange
    currentExtension({
      [`DELETE ${garminSchedulePath("1790718680")}`]: {
        refuse: { error: "Request failed: 404", status: 404 },
      },
    });

    // Act
    const res = await calendar.unschedule("1790718680" as never);

    // Assert
    expect(res).toEqual({
      ok: false,
      error: "Request failed: 404",
      status: 404,
    });
  });

  it("should read the 0-based month of the date and return only the workout's entries as strings", async () => {
    // Arrange
    const sent = currentExtension({
      [`GET ${garminMonthPath("2026-10-06")}`]: month([
        item(),
        item({ id: 1792409370, date: "2026-10-20" }),
        item({ id: 1792409371, workoutId: 999 }),
        item({
          id: 5,
          itemType: "activity",
          title: "Morning Run",
          distance: 10000,
        }),
        item({ id: 6, itemType: "race", workoutId: null }),
      ]),
    });

    // Act
    const res = await calendar.find(
      "1711500235" as never,
      "2026-10-06" as never
    );

    // Assert
    expect(sent[0]?.path).toBe("/calendar-service/year/2026/month/9");
    expect(res).toEqual({
      ok: true,
      entries: [
        { workoutScheduleId: "1792409369", date: "2026-10-06" },
        { workoutScheduleId: "1792409370", date: "2026-10-20" },
      ],
    });
  });

  it.each([
    ["2026-01-31", "/calendar-service/year/2026/month/0"],
    ["2026-09-29", "/calendar-service/year/2026/month/8"],
    ["2026-12-01", "/calendar-service/year/2026/month/11"],
  ])("should map %s to %s", (date, path) => {
    // Arrange
    const day = date;

    // Act
    const built = garminMonthPath(day);

    // Assert
    expect(built).toBe(path);
  });

  it("should answer found-none as an empty list", async () => {
    // Arrange
    currentExtension({
      [`GET ${garminMonthPath("2026-10-06")}`]: month([item({ workoutId: 1 })]),
    });

    // Act
    const res = await calendar.find(
      "1711500235" as never,
      "2026-10-06" as never
    );

    // Assert
    expect(res).toEqual({ ok: true, entries: [] });
  });

  it("should return a null schedule id for an entry whose id is unusable", async () => {
    // Arrange
    currentExtension({
      [`GET ${garminMonthPath("2026-10-06")}`]: month([item({ id: null })]),
    });

    // Act
    const res = await calendar.find(
      "1711500235" as never,
      "2026-10-06" as never
    );

    // Assert
    expect(res).toEqual({
      ok: true,
      entries: [{ workoutScheduleId: null, date: "2026-10-06" }],
    });
  });

  it.each([
    ["no calendarItems", json({ year: 2026, month: 9 })],
    ["a non-array calendarItems", json({ calendarItems: {} })],
    ["a null body", json(null)],
    ["a body that is not JSON", { body: "<html>" }],
    [
      "a matching entry with no usable date",
      month([item({ date: "2026-10-06T00:00" })]),
    ],
  ])("should fail the read, not report none, on %s", async (_label, reply) => {
    // Arrange
    currentExtension({ [`GET ${garminMonthPath("2026-10-06")}`]: reply });

    // Act
    const res = await calendar.find(
      "1711500235" as never,
      "2026-10-06" as never
    );

    // Assert
    expect(res).toEqual({
      ok: false,
      error: "unexpected-payload",
      retryable: true,
    });
  });

  it("should send a FIT file's bytes as the body of the upload", async () => {
    // Arrange
    const fit = new Uint8Array(FIT_HEADER);
    const sent = currentExtension({
      [`POST ${GARMIN_UPLOAD_PATH}`]: json(
        { detailedImportResult: {} },
        HTTP_ACCEPTED
      ),
    });

    // Act
    await pushGarminBodyComposition(EXT, fit);

    // Assert
    expect(sent[0]).toEqual({
      action: "request",
      method: "POST",
      path: GARMIN_UPLOAD_PATH,
      body: Array.from(fit),
    });
  });
});

describe("Garmin Connector, extension one protocol behind (protocol 1)", () => {
  it("should push through the legacy action after the extension refuses the request", async () => {
    // Arrange
    const sent = previousExtension({ push: { workoutId: 77 } });

    // Act
    const res = await executePush(EXT, GCN);

    // Assert
    expect(sent.map((m) => m.action)).toEqual(["request", "push"]);
    expect(sent[1]).toEqual({ action: "push", gcn: GCN });
    expect(res).toEqual({ status: "success", garminWorkoutId: "77" });
  });

  it("should place, find and remove through the legacy calendar actions", async () => {
    // Arrange
    const sent = previousExtension({
      schedule: { workoutScheduleId: "9" },
      "calendar-find": [{ workoutScheduleId: "9", date: "2026-10-06" }],
      unschedule: null,
    });

    // Act
    const placed = await calendar.schedule("1" as never, "2026-10-06" as never);
    const found = await calendar.find("1" as never, "2026-10-06" as never);
    const removed = await calendar.unschedule("9" as never);

    // Assert
    expect(placed).toEqual({ ok: true, workoutScheduleId: "9" });
    expect(found).toEqual({
      ok: true,
      entries: [{ workoutScheduleId: "9", date: "2026-10-06" }],
    });
    expect(removed).toEqual({ ok: true });
    expect(sent.filter((m) => m.action !== "request")).toEqual([
      { action: "schedule", workoutId: "1", date: "2026-10-06" },
      { action: "calendar-find", workoutId: "1", date: "2026-10-06" },
      { action: "unschedule", scheduleId: "9" },
    ]);
  });

  it("should list and upload through the legacy actions", async () => {
    // Arrange
    const sent = previousExtension({
      list: [{ workoutId: 1 }],
      "push-body-composition": { uploadId: 1 },
    });

    // Act
    const list = await executeList(EXT);
    await pushGarminBodyComposition(EXT, new Uint8Array([1, 2]));

    // Assert
    expect(list.data).toEqual([{ workoutId: 1 }]);
    expect(sent.filter((m) => m.action !== "request")).toEqual([
      { action: "list" },
      { action: "push-body-composition", fit: [1, 2] },
    ]);
  });
});

describe("Garmin Connector asks only for what the extension's closed list admits", () => {
  const list = closedListOf("garmin-bridge");

  it("should build every request so that the extension's list admits it", () => {
    // Arrange
    const asked = [
      ["GET", GARMIN_WORKOUTS_PATH],
      ["GET", GARMIN_ACTIVITIES_PATH],
      ["POST", GARMIN_WORKOUT_PATH],
      ["POST", GARMIN_UPLOAD_PATH],
      ["POST", garminSchedulePath("1707805999")],
      ["DELETE", garminSchedulePath("1790718680")],
      ["GET", garminMonthPath("2026-12-01")],
    ] as const;

    // Act
    const refused = asked.filter(([m, p]) => !isListed(list, m, p));

    // Assert
    expect(list.length).toBe(LISTED_ENTRIES);
    expect(refused).toEqual([]);
  });
});
