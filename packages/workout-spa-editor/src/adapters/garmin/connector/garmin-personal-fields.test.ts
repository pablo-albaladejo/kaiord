/**
 * The personal fields Kaiord for Garmin removes from its answers are ones
 * no Garmin reading in the App uses: Garmin's own workout answers
 * (test-fixtures/gcn) read to the same KRD, and an activity and a calendar
 * month read the same, once trimmed, with the owner's names, pictures and
 * places gone.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { fromText } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { garminRawActivitySchema } from "../../../application/import/garmin-activity-schema";
import { trimmedByBridge } from "../../../test-utils/bridge-answer-trim";
import { parseGarminWorkoutId } from "./garmin-push-id";
import { readWorkoutEntries } from "./read-garmin-answers";

const BRIDGE = "garmin-bridge";
const GCN = join(__dirname, "../../../../../../test-fixtures/gcn");
const OUTPUTS = readdirSync(GCN).filter((f) => f.endsWith("Output.gcn"));
const json = (body: string) => ({
  status: 200,
  contentType: "application/json;charset=UTF-8",
  body,
});

describe("Garmin answers trimmed of personal fields", () => {
  it.each(OUTPUTS)(
    "should read %s to the same KRD and id once its author is removed",
    async (name) => {
      // Arrange
      const raw = json(readFileSync(join(GCN, name), "utf-8"));

      const { garminReader } = await import("@kaiord/garmin");

      // Act
      const trimmed = trimmedByBridge(BRIDGE, raw);

      // Assert
      expect(await fromText(trimmed.body, garminReader)).toEqual(
        await fromText(raw.body, garminReader)
      );
      expect(parseGarminWorkoutId(JSON.parse(trimmed.body))).toBe(
        parseGarminWorkoutId(JSON.parse(raw.body))
      );
      expect(trimmed.body).not.toContain('"author"');
      expect(trimmed.body).not.toContain("Test User");
    }
  );

  it("should read the same activity once its owner and places are removed", () => {
    // Arrange
    const activity = {
      activityId: 21000000001,
      activityName: "Morning Run",
      startTimeLocal: "2026-11-20 07:00:00",
      startTimeGMT: "2026-11-20 06:00:00",
      activityType: { typeKey: "running" },
      distance: 10000,
      duration: 3000,
      ownerFullName: "Test User",
      ownerDisplayName: "test-user",
      startLatitude: 40.4,
      locationName: "Madrid",
    };
    const raw = json(JSON.stringify([activity]));

    // Act
    const trimmed = trimmedByBridge(BRIDGE, raw);

    // Assert
    const [kept] = JSON.parse(trimmed.body) as unknown[];
    expect(garminRawActivitySchema.parse(kept)).toEqual(
      garminRawActivitySchema.parse(activity)
    );
    expect(Object.keys(kept as object)).not.toContain("ownerFullName");
    expect(Object.keys(kept as object)).not.toContain("locationName");
  });

  it("should read the same entries from a trimmed calendar month", () => {
    // Arrange
    const month = {
      calendarItems: [
        { itemType: "workout", workoutId: 77, id: 9001, date: "2026-11-24" },
        { itemType: "activity", id: 9002, date: "2026-11-23", title: "Run" },
      ],
    };
    const raw = json(JSON.stringify(month));

    // Act
    const trimmed = trimmedByBridge(BRIDGE, raw);

    // Assert
    expect(readWorkoutEntries("77")(trimmed)).toEqual(
      readWorkoutEntries("77")(raw)
    );
  });
});
