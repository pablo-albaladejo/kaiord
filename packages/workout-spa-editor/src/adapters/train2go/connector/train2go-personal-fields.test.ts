/**
 * The personal fields Kaiord for Train2Go removes from its answers are ones
 * the Train2Go Connector never reads: on Train2Go's own answers (the
 * fixtures), the Connector reads the same thing from the trimmed answer as
 * from the raw one, and the personal fields are gone.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  bridgeFixturePath,
  trimmedByBridge,
} from "../../../test-utils/bridge-answer-trim";
import { readProfileAnswer } from "./read-profile-answer";
import {
  readDayAnswer,
  readDetailsAnswer,
  readWeekAnswer,
} from "./read-train2go-answers";

const BRIDGE = "train2go-bridge";
const fixture = (name: string): string =>
  readFileSync(join(__dirname, "fixtures", name), "utf-8");
const html = (body: string) => ({
  status: 200,
  contentType: "text/html",
  body,
});
const json = (payload: unknown) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify(payload),
});

describe("Train2Go answers trimmed of personal fields", () => {
  it("should read the same zones and weight from the trimmed profile page", () => {
    // Arrange
    const raw = html(fixture("details-active.html"));

    // Act
    const trimmed = trimmedByBridge(BRIDGE, raw);

    // Assert
    expect(readDetailsAnswer(trimmed)).toEqual(readDetailsAnswer(raw));
    expect(readDetailsAnswer(trimmed).physiological).toEqual({
      weight: 83,
      bpmMax: 187,
      bpmRest: 51,
    });
    for (const name of ["gender", "height", "fat", "imc", "smoker"]) {
      expect(trimmed.body).not.toContain(`name="${name}"`);
    }
    expect(trimmed.body).not.toContain('name="user_notes"');
  });

  it("should read the same athlete id and name from the trimmed profile ping", () => {
    // Arrange
    const raw = {
      status: 200,
      contentType: "application/json",
      body: readFileSync(
        bridgeFixturePath(BRIDGE, "ping-active.json"),
        "utf-8"
      ),
    };

    // Act
    const trimmed = trimmedByBridge(BRIDGE, raw);

    // Assert
    expect(readProfileAnswer(trimmed)).toEqual(readProfileAnswer(raw));
    expect(readProfileAnswer(trimmed)).toEqual({
      sessionActive: true,
      userId: 99999,
      userName: "Test",
    });
    for (const key of ["surname", "gender", "height", "weight", "trainer"]) {
      expect(trimmed.body).not.toContain(`"${key}"`);
    }
  });

  it.each(["daily.html", "daily-with-comments.html", "daily-with-links.html"])(
    "should read the same activities and comments from the trimmed %s",
    (name) => {
      // Arrange
      const raw = json({ data: { content: fixture(name) }, success: true });

      // Act
      const trimmed = trimmedByBridge(BRIDGE, raw);

      // Assert
      expect(readDayAnswer("2026-06-07")(trimmed)).toEqual(
        readDayAnswer("2026-06-07")(raw)
      );
    }
  );

  it("should read the same week from the trimmed weekly plan", () => {
    // Arrange
    const raw = json({
      data: { replace: { "#workplan": fixture("weekly.html") } },
      success: true,
    });

    // Act
    const trimmed = trimmedByBridge(BRIDGE, raw);

    // Assert
    expect(readWeekAnswer(trimmed)).toEqual(readWeekAnswer(raw));
    expect(readWeekAnswer(trimmed).activities.length).toBeGreaterThan(0);
  });
});
