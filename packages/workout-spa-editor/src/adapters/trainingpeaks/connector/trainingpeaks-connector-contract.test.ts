/**
 * The TrainingPeaks Connector at the message contract with the extension
 * (docs/adr/0004-thin-bridge-smart-connector.md). The current extension
 * (protocol 2) answers `request` with TrainingPeaks' raw answer and the
 * Connector builds the path, paces the reads and reads the answer; an
 * extension one protocol behind (1) answers the legacy actions itself. The
 * reading cases are the extension's former ones.
 */
import { afterEach, describe, expect, it } from "vitest";

import { closedListOf, isListed } from "../../../test-utils/bridge-closed-list";
import {
  currentExtension,
  json,
  previousExtension,
  uninstallFakeExtension,
} from "../../../test-utils/fake-bridge-extension";
import { readTrainingPeaksDayTitles } from "./trainingpeaks-day-transport";
import { readTrainingPeaksMetrics } from "./trainingpeaks-metrics-transport";
import {
  metricsPath,
  workoutPath,
  workoutsOnDayPath,
  workoutsPath,
} from "./trainingpeaks-paths";
import type { TrainingPeaksBridgeError } from "./trainingpeaks-transport";
import {
  pushTrainingPeaksWorkout,
  readTrainingPeaksCopyState,
} from "./trainingpeaks-workout-transport";

const EXT = "tp-ext";
const ATHLETE = 900123;
const HTTP_PAYMENT_REQUIRED = 402;
const HTTP_NOT_FOUND = 404;
const WORKOUT_ID = 4242;
const ATHLETE_ID_READ = { action: "read-athlete-id" };
const athleteId = () => ({ athleteId: ATHLETE });
const METRICS = [
  { timeStamp: "2026-07-01T07:30:00Z", details: [{ type: 9, value: 80.5 }] },
];
const WORKOUT = {
  athleteId: ATHLETE,
  workoutId: 0,
  workoutDay: "2026-09-07",
  title: "Threshold",
  description: null,
  workoutTypeValueId: 2,
  totalTimePlanned: 1,
  publicSettingValue: 0,
  structure: '{"structure":[]}',
};

// The current extension still answers the athlete id read itself.
const current = (byRequest: Parameters<typeof currentExtension>[0]) =>
  currentExtension(byRequest, { "read-athlete-id": athleteId() });

afterEach(() => uninstallFakeExtension());

describe("TrainingPeaks Connector, current extension (protocol 2)", () => {
  it("should read the metrics of a range on the path built for the athlete", async () => {
    // Arrange
    const path = metricsPath(ATHLETE, "2026-07-01", "2026-07-07");
    const sent = current({ [`GET ${path}`]: json(METRICS) });

    // Act
    const res = await readTrainingPeaksMetrics(EXT, "2026-07-01", "2026-07-07");

    // Assert
    expect(sent).toEqual([
      ATHLETE_ID_READ,
      { action: "request", method: "GET", path },
    ]);
    expect(res).toEqual(METRICS);
  });

  it("should ask the athlete to sign in when the Session is gone", async () => {
    // Arrange
    const path = metricsPath(ATHLETE, "2026-07-01", "2026-07-07");
    current({
      [`GET ${path}`]: {
        refuse: { error: "Session expired", needsReauth: true },
      },
    });

    // Act
    const error = await readTrainingPeaksMetrics(
      EXT,
      "2026-07-01",
      "2026-07-07"
    ).catch((e: unknown) => e);

    // Assert
    expect((error as TrainingPeaksBridgeError).needsReauth).toBe(true);
  });

  it("should send a workout as the body of the write and read its TrainingPeaks id", async () => {
    // Arrange
    const sent = current({
      [`POST ${workoutsPath(ATHLETE)}`]: json({
        workoutId: WORKOUT_ID,
        title: "x",
      }),
    });

    // Act
    const id = await pushTrainingPeaksWorkout(EXT, WORKOUT);

    // Assert
    expect(sent).toEqual([
      {
        action: "request",
        method: "POST",
        path: workoutsPath(ATHLETE),
        body: WORKOUT,
      },
    ]);
    expect(id).toBe(WORKOUT_ID);
  });

  it("should explain a 402 as a planning-horizon limit, not a payload error", async () => {
    // Arrange
    current({
      [`POST ${workoutsPath(ATHLETE)}`]: {
        refuse: { error: "Request failed: 402", status: HTTP_PAYMENT_REQUIRED },
      },
    });

    // Act
    const error = await pushTrainingPeaksWorkout(EXT, WORKOUT).catch(
      (e: unknown) => e
    );

    // Assert
    expect((error as TrainingPeaksBridgeError).message).toMatch(/paid account/);
    expect((error as TrainingPeaksBridgeError).status).toBe(
      HTTP_PAYMENT_REQUIRED
    );
  });

  it("should read one workout Kaiord created as present, keeping only its id and day", async () => {
    // Arrange
    const sent = current({
      [`GET ${workoutPath(ATHLETE, String(WORKOUT_ID))}`]: json({
        workoutId: WORKOUT_ID,
        workoutDay: "2026-11-24T00:00:00",
        title: "Easy run",
        heartRateAverage: 151,
        description: "felt good",
      }),
    });

    // Act
    const state = await readTrainingPeaksCopyState(EXT, String(WORKOUT_ID));

    // Assert
    expect(state).toBe("present");
    expect(sent.map((m) => m.action)).toEqual(["read-athlete-id", "request"]);
  });

  it.each([
    [HTTP_NOT_FOUND, "absent"],
    [500, "unknown"],
  ])("should read a %s on the workout as %s", async (status, expected) => {
    // Arrange
    current({
      [`GET ${workoutPath(ATHLETE, String(WORKOUT_ID))}`]: {
        refuse: { error: `Request failed: ${status}`, status },
      },
    });

    // Act
    const state = await readTrainingPeaksCopyState(EXT, String(WORKOUT_ID));

    // Assert
    expect(state).toBe(expected);
  });

  it("should read one day and keep only the titles of the workouts on it", async () => {
    // Arrange
    const day = "2026-11-24";
    const sent = current({
      [`GET ${workoutsOnDayPath(ATHLETE, day)}`]: json([
        {
          workoutId: 1,
          workoutDay: "2026-11-24T00:00:00",
          title: "Easy run",
          description: "felt good",
          heartRateAverage: 151,
        },
        { workoutId: 2, workoutDay: "2026-11-24T00:00:00", title: "Tempo" },
        { workoutId: 3, workoutDay: "2026-11-25T00:00:00", title: "Long" },
        { workoutId: 4, workoutDay: "2026-11-24T00:00:00", title: null },
      ]),
    });

    // Act
    const read = await readTrainingPeaksDayTitles(EXT, day);

    // Assert
    expect(read).toEqual({ ok: true, titles: ["Easy run", "Tempo"] });
    expect(sent.at(-1)).toEqual({
      action: "request",
      method: "GET",
      path: workoutsOnDayPath(ATHLETE, day),
    });
  });

  it.each([
    [
      "a refused read",
      { refuse: { error: "Request failed: 500", status: 500 } },
    ],
    ["an answer that is not a list", json({ workouts: [] })],
    ["an entry with no day", json([{ title: "Tempo" }])],
  ])("should treat %s of the day as not read", async (_label, reply) => {
    // Arrange
    current({ [`GET ${workoutsOnDayPath(ATHLETE, "2026-11-24")}`]: reply });

    // Act
    const read = await readTrainingPeaksDayTitles(EXT, "2026-11-24");

    // Assert
    expect(read).toEqual({ ok: false });
  });

  it("should not ask for a day that is not a date", async () => {
    // Arrange
    const sent = current({});

    // Act
    const read = await readTrainingPeaksDayTitles(EXT, "2026-02-30");

    // Assert
    expect(read).toEqual({ ok: false });
    expect(sent).toEqual([]);
  });

  it("should not ask for a workout whose id is not a number", async () => {
    // Arrange
    const sent = current({});

    // Act
    const state = await readTrainingPeaksCopyState(EXT, "1/x");

    // Assert
    expect(state).toBe("unknown");
    expect(sent).toEqual([]);
  });
});

describe("TrainingPeaks Connector, extension one protocol behind (protocol 1)", () => {
  it("should read, write and check through the legacy actions", async () => {
    // Arrange
    const sent = previousExtension({
      "read-athlete-id": athleteId(),
      "read-metrics": METRICS,
      "push-workout": { workoutId: WORKOUT_ID },
      "read-workout": { workoutId: WORKOUT_ID, workoutDay: "2026-09-07" },
    });

    // Act
    const metrics = await readTrainingPeaksMetrics(
      EXT,
      "2026-07-01",
      "2026-07-07"
    );
    const id = await pushTrainingPeaksWorkout(EXT, WORKOUT);
    const state = await readTrainingPeaksCopyState(EXT, String(WORKOUT_ID));

    // Assert
    expect(metrics).toEqual(METRICS);
    expect(id).toBe(WORKOUT_ID);
    expect(state).toBe("present");
    expect(sent.filter((m) => m.action !== "request")).toEqual([
      ATHLETE_ID_READ,
      {
        action: "read-metrics",
        start: "2026-07-01",
        end: "2026-07-07",
        athleteId: ATHLETE,
      },
      { action: "push-workout", workout: WORKOUT },
      ATHLETE_ID_READ,
      {
        action: "read-workout",
        workoutId: String(WORKOUT_ID),
        athleteId: ATHLETE,
      },
    ]);
  });
});

describe("TrainingPeaks Connector, the day read on the previous extension", () => {
  it("should not read the day through an extension that has no such request", async () => {
    // Arrange
    const sent = previousExtension({ "read-athlete-id": athleteId() });

    // Act
    const read = await readTrainingPeaksDayTitles(EXT, "2026-11-24");

    // Assert
    expect(read).toEqual({ ok: false });
    expect(sent.filter((m) => m.action !== "request")).toEqual([
      ATHLETE_ID_READ,
    ]);
  });
});

describe("TrainingPeaks Connector asks only for what the extension's closed list admits", () => {
  it("should build every request so that the extension's list admits it", () => {
    // Arrange
    const list = closedListOf("trainingpeaks-bridge");
    const asked = [
      ["GET", metricsPath(ATHLETE, "2026-07-01", "2026-07-07")],
      ["POST", workoutsPath(ATHLETE)],
      ["GET", workoutPath(ATHLETE, String(WORKOUT_ID))],
      ["GET", workoutsOnDayPath(ATHLETE, "2026-11-24")],
    ] as const;

    // Act
    const refused = asked.filter(([m, p]) => !isListed(list, m, p));

    // Assert
    expect(refused).toEqual([]);
  });
});
