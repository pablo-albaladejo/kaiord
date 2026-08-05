import { describe, expect, it } from "vitest";

import type { ReviewModel } from "../lib/workout-review";
import type { WorkoutRecord } from "../types/calendar-record";
import { selectPriorSummary } from "./select-prior-session";

const record = (id: string, createdAt: string): WorkoutRecord =>
  ({ id, createdAt }) as WorkoutRecord;

const model = (title: string): ReviewModel =>
  ({ title, duration: "0:30:00", tss: 30 }) as ReviewModel;

const titleOf = (m: ReviewModel): string => m.title;
const always = (m: ReviewModel) => () => m;

describe("selectPriorSummary", () => {
  it("should pick the earliest session that predates the proposal", () => {
    // Arrange
    const proposed = record("new", "2026-08-04T10:00:00.000Z");
    const records = [
      record("later-same-day", "2026-08-04T09:00:00.000Z"),
      record("earliest", "2026-08-04T08:00:00.000Z"),
      proposed,
    ];

    // Act
    const prior = selectPriorSummary(
      records,
      proposed,
      (r) => model(r.id),
      titleOf
    );

    // Assert
    expect(prior).toBe("earliest");
  });

  it("should ignore a session created after the proposal", () => {
    // Arrange
    const proposed = record("new", "2026-08-04T10:00:00.000Z");
    const records = [
      proposed,
      record("added-two-days-later", "2026-08-06T09:00:00.000Z"),
    ];

    // Act
    const prior = selectPriorSummary(
      records,
      proposed,
      (r) => model(r.id),
      titleOf
    );

    // Assert
    expect(prior).toBeNull();
  });

  it("should fall through to the next candidate when the earliest cannot be summarised", () => {
    // Arrange
    const proposed = record("new", "2026-08-04T10:00:00.000Z");
    const unreviewable = record(
      "imported-activity",
      "2026-08-04T08:00:00.000Z"
    );
    const structured = record("planned", "2026-08-04T09:00:00.000Z");
    const records = [unreviewable, structured, proposed];

    // Act
    const prior = selectPriorSummary(
      records,
      proposed,
      (r) => (r.id === "imported-activity" ? null : model(r.id)),
      titleOf
    );

    // Assert
    expect(prior).toBe("planned");
  });

  it("should return null when the date held nothing else", () => {
    // Arrange
    const proposed = record("new", "2026-08-04T10:00:00.000Z");

    // Act
    const prior = selectPriorSummary(
      [proposed],
      proposed,
      always(model("x")),
      titleOf
    );

    // Assert
    expect(prior).toBeNull();
  });

  it("should return null when no prior candidate can be summarised", () => {
    // Arrange
    const proposed = record("new", "2026-08-04T10:00:00.000Z");
    const records = [record("raw", "2026-08-04T08:00:00.000Z"), proposed];

    // Act
    const prior = selectPriorSummary(records, proposed, () => null, titleOf);

    // Assert
    expect(prior).toBeNull();
  });
});
