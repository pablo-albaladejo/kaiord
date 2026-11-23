import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { parseWeeklyHtml } from "./parse-weekly-html";

const fixture = (name: string): string =>
  readFileSync(join(__dirname, "fixtures", name), "utf-8");

const WEEKLY_ACTIVITY_COUNT = 3;
const CYCLING_ACTIVITY_ID = 17722582;

describe("parseWeeklyHtml", () => {
  it("should extract activities from multiple days", () => {
    // Arrange
    const html = fixture("weekly.html");

    // Act
    const activities = parseWeeklyHtml(html);

    // Assert
    expect(activities).toHaveLength(WEEKLY_ACTIVITY_COUNT);
    expect(activities[0]).toMatchObject({
      id: 17722576,
      date: "2026-04-07",
      sport: "gym",
      title: "CORE FASE 3 P1 GYM",
      duration: "15 min",
      workload: 1,
      status: 1,
    });
    expect(activities[1]).toMatchObject({
      id: 17722598,
      date: "2026-04-08",
      sport: "swimming",
      title: "Prog Z2-Z3 (1.200m) + Z5 (200m)",
      duration: "2.40 km",
      workload: 3,
      status: 0,
    });
    expect(activities[2]).toMatchObject({
      id: 17722582,
      date: "2026-04-13",
      sport: "cycling",
      duration: "1:30 h",
      workload: 2,
    });
  });

  it("should decode HTML entities in titles", () => {
    // Arrange
    const html = fixture("weekly.html");

    // Act
    const activities = parseWeeklyHtml(html);

    // Assert
    const cycling = activities.find((a) => a.id === CYCLING_ACTIVITY_ID);
    expect(cycling?.title).toBe("15' Z5 INTERVALOS CORTOS");
  });

  it("should skip empty days", () => {
    // Arrange
    const html = fixture("weekly.html");

    // Act
    const activities = parseWeeklyHtml(html);

    // Assert
    const dates = activities.map((a) => a.date);
    expect(dates).not.toContain("2026-04-06");
    expect(dates).not.toContain("2026-04-14");
  });

  it("should return empty array on null input", () => {
    // Arrange
    const input = null;

    // Act
    const result = parseWeeklyHtml(input);

    // Assert
    expect(result).toEqual([]);
  });

  it("should return empty array on empty string", () => {
    // Arrange
    const input = "";

    // Act
    const result = parseWeeklyHtml(input);

    // Assert
    expect(result).toEqual([]);
  });

  it("should return empty array on malformed HTML", () => {
    // Arrange
    const input = "<div>no activities here</div>";

    // Act
    const result = parseWeeklyHtml(input);

    // Assert
    expect(result).toEqual([]);
  });
});
