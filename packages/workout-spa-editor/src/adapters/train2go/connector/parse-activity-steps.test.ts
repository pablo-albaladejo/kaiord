/* eslint-disable no-magic-numbers -- a steps table is literal durations, watts and bpm, clearer inline */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { parseActivitySteps } from "./parse-activity-steps";

// Synthetic: Train2Go's markup shape with invented zones and values.
const fixture = readFileSync(
  join(__dirname, "fixtures", "daily-with-steps.html"),
  "utf-8"
);

const R0 = {
  zone: "R0",
  powerWatts: { min: 0, max: 120 },
  heartRateBpm: { min: 60, max: 120 },
};
const R1 = {
  zone: "R1",
  powerWatts: { min: 121, max: 150 },
  heartRateBpm: { min: 121, max: 130 },
};
const R1P = {
  zone: "R1+",
  powerWatts: { min: 151, max: 180 },
  heartRateBpm: { min: 131, max: 140 },
};
const single = (durationSeconds: number, zone: object) => ({
  repeat: 1,
  steps: [{ durationSeconds, ...zone }],
});
const block = (z: object) => [
  single(10 * 60, z),
  single(3 * 60, z),
  single(2 * 60, z),
];

const sumSeconds = (groups: ReturnType<typeof parseActivitySteps>): number =>
  (groups ?? []).reduce(
    (total, g) =>
      total + g.repeat * g.steps.reduce((t, s) => t + s.durationSeconds, 0),
    0
  );

describe("parseActivitySteps", () => {
  it("should read every row of the grid in order, repeats included", () => {
    // Arrange

    // Act
    const groups = parseActivitySteps(fixture);

    // Assert
    expect(groups).toStrictEqual([
      single(15 * 60, R0),
      {
        repeat: 5,
        steps: [
          { durationSeconds: 60, ...R1 },
          { durationSeconds: 60, ...R0 },
        ],
      },
      single(30, R1),
      single(30, R1),
      single(30, R1),
      single(3 * 60 + 30, R0),
      ...block(R1P),
      ...block(R1P),
      ...block(R1P),
      ...block(R1P),
      single(10 * 60, R0),
    ]);
  });

  it("should add up to the activity's 100 minutes", () => {
    // Arrange

    // Act
    const groups = parseActivitySteps(fixture);

    // Assert
    expect(sumSeconds(groups)).toBe(100 * 60);
  });

  it("should read nothing when the activity has no steps grid", () => {
    // Arrange
    const html = `<div class="activity-description"><p>Libre</p></div>`;

    // Act
    const groups = parseActivitySteps(html);

    // Assert
    expect(groups).toBeUndefined();
  });

  it.each([
    ["an unknown duration unit", "15 min", "15 hrs"],
    ["a power cell that is not a range", "0-120", "Z1"],
    ["an inverted heart-rate range", "60-120", "120-60"],
    [
      "a cell of an unknown kind",
      'class="flex items-center text-3xs',
      'class="mystery',
    ],
  ])("should read nothing at all on %s", (_label, from, to) => {
    // Arrange
    const html = fixture.replace(from, to);

    // Act
    const groups = parseActivitySteps(html);

    // Assert
    expect(groups).toBeUndefined();
  });

  it("should read nothing when a repeat block is missing its recovery row", () => {
    // Arrange
    // drop the recovery row's four cells, keep its span of 2.
    const html = fixture.replace(
      /<div class="[^"]*text-secondary-dark">[\s\S]*?<\/div>/g,
      ""
    );

    // Act
    const groups = parseActivitySteps(html);

    // Assert
    expect(html).not.toBe(fixture);
    expect(groups).toBeUndefined();
  });

  it("should read nothing when the grid is cut short", () => {
    // Arrange
    // the last row loses its repeat cell.
    const lastRepeat = fixture.lastIndexOf(
      '<div class="flex items-center self-stretch'
    );
    const html = fixture.slice(0, lastRepeat);

    // Act
    const groups = parseActivitySteps(html);

    // Assert
    expect(groups).toBeUndefined();
  });
});
