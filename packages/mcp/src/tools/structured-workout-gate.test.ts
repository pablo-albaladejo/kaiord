import type { KRD } from "@kaiord/core";
import { createMockLogger } from "@kaiord/core/test-utils";
import { createFitReader } from "@kaiord/fit";
import { createGarminReader } from "@kaiord/garmin";
import { createTcxReader } from "@kaiord/tcx";
import { createFastXmlZwiftReader } from "@kaiord/zwo";
import { readdirSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { describe, expect, it } from "vitest";

import {
  getFixturePath,
  loadFitFixture,
  loadKrdFixture,
  loadTcxFixture,
  loadZwoFixture,
} from "../tests/helpers/test-fixtures";
import {
  assertStructuredWorkout,
  REMOTE_EXTENSION_ALLOWLIST,
} from "./structured-workout-gate";

const logger = createMockLogger();
const FIXTURES_ROOT = dirname(dirname(getFixturePath("krd", "x.krd")));
const workoutFiles = (dir: string, suffix: string): Array<string> =>
  readdirSync(join(FIXTURES_ROOT, dir)).filter(
    (f) => f.startsWith("Workout") && f.endsWith(suffix)
  );
const TCX_ROOT_EXTENSIONS = "<Extensions><Note>x</Note></Extensions>";
const acceptAll = async () => ({ valid: true, errors: [] });

// Every KRD the workout readers emit for the workout fixtures, plus a TCX
// whose root carries <Extensions> (the only source of the `tcx` namespace).
const readWorkoutFixtures = async (): Promise<Array<KRD>> => {
  const fit = createFitReader(logger);
  const tcx = createTcxReader(logger);
  const zwo = createFastXmlZwiftReader(logger, acceptAll);
  const gcn = createGarminReader(logger);
  const tcxWithRoot = loadTcxFixture("WorkoutSpeedTargets.tcx").replace(
    "</TrainingCenterDatabase>",
    `${TCX_ROOT_EXTENSIONS}</TrainingCenterDatabase>`
  );
  return Promise.all([
    ...workoutFiles("fit", ".fit").map((f) => fit(loadFitFixture(f))),
    ...workoutFiles("tcx", ".tcx").map((f) => tcx(loadTcxFixture(f))),
    tcx(tcxWithRoot),
    ...workoutFiles("zwo", ".zwo").map((f) => zwo(loadZwoFixture(f))),
    ...workoutFiles("gcn", ".gcn").map((f) =>
      gcn(readFileSync(join(FIXTURES_ROOT, "gcn", f), "utf-8"))
    ),
  ]);
};

const workout = loadKrdFixture("WorkoutIndividualSteps.krd");

describe("structured workout gate", () => {
  it("should pin the allowlist to the namespaces the workout readers emit", async () => {
    // Arrange
    const krds = await readWorkoutFixtures();

    // Act
    const emitted = new Set(
      krds.flatMap((k) => Object.keys(k.extensions ?? {}))
    );

    // Assert
    expect([...emitted].sort()).toEqual([...REMOTE_EXTENSION_ALLOWLIST].sort());
    for (const krd of krds) expect(assertStructuredWorkout(krd)).toBe(krd);
  });

  it.each(["health", "course", "course_points"])(
    "should never allowlist %s",
    (namespace) => {
      // Arrange
      const allowlist = REMOTE_EXTENSION_ALLOWLIST;

      // Act
      const allowed = allowlist.has(namespace);

      // Assert
      expect(allowed).toBe(false);
    }
  );

  it.each([
    [{ ...workout, type: "recorded_activity" }, "recorded_activity"],
    [{ ...workout, records: [] }, "records"],
    [{ ...workout, sessions: [] }, "sessions"],
    [{ ...workout, laps: [] }, "laps"],
    [{ ...workout, events: [] }, "events"],
    [
      { ...workout, extensions: { ...workout.extensions, health: {} } },
      "extensions.health",
    ],
    [{ ...workout, extensions: { course: {} } }, "extensions.course"],
  ] as Array<[KRD, string]>)(
    "should reject a document naming %#: %s",
    (krd, field) => {
      // Arrange
      const attempt = () => assertStructuredWorkout(krd);

      // Act
      const run = attempt;

      // Assert
      expect(run).toThrow(field);
    }
  );
});
