/**
 * Every Garmin payload goes through the one GCN builder that resolves pace
 * zones (`export-workout-formats.ts`): a call site with its own writer — the
 * option-less default `garminWriter` — cannot resolve pace zone targets and
 * would fail every pace zone workout again.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

const SRC = join(__dirname, "..");

const sources = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sources(path);
    return /\.tsx?$/.test(name) && !/\.(test|stories)\.tsx?$/.test(name)
      ? [path]
      : [];
  });

const filesMatching = (pattern: RegExp) =>
  sources(SRC)
    .filter((path) => pattern.test(readFileSync(path, "utf-8")))
    .map((path) => relative(SRC, path))
    .sort();

describe("Garmin payload call sites", () => {
  it("should build GCN with a Garmin writer in export-workout-formats only", () => {
    // Arrange
    const writer = /\b(garminWriter|createGarminWriter)\b/;

    // Act
    const files = filesMatching(writer);

    // Assert
    expect(files).toEqual(["utils/export-workout-formats.ts"]);
  });

  it("should export a persisted workout's GCN through exportRecordGcn only", () => {
    // Arrange
    const call = /\bexportGcnWorkout\(/;

    // Act
    const files = filesMatching(call);

    // Assert
    expect(files).toEqual(["hooks/garmin-record-gcn.ts"]);
  });

  it("should route the single push, Send week and the chat tool through exportRecordGcn", () => {
    // Arrange
    const call = /\bexportRecordGcn\(/;

    // Act
    const files = filesMatching(call);

    // Assert
    expect(files).toEqual([
      "components/molecules/GarminPushButton/useGarminPush.ts",
      "hooks/garmin-place-record.ts",
    ]);
  });
});
