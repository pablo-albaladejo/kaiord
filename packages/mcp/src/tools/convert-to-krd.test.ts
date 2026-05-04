import { createMockLogger } from "@kaiord/core/test-utils";
import { mkdtemp, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  loadFitFixture,
  loadKrdFixtureRaw,
  loadTcxFixture,
} from "../tests/helpers/test-fixtures";
import { convertToKrd } from "./convert-to-krd";

describe("convertToKrd", () => {
  let tmpDir: string;
  const logger = createMockLogger();

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "mcp-convert-to-"));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true });
  });

  it("should convert KRD text content to KRD object", async () => {
    // Arrange
    const krdJson = loadKrdFixtureRaw("WorkoutIndividualSteps.krd");

    // Act
    const result = await convertToKrd(undefined, krdJson, "krd", logger);

    // Assert
    expect(result.version).toBe("1.0");
    expect(result.type).toBe("structured_workout");
  });

  it("should convert KRD file to KRD object", async () => {
    // Arrange
    const krdJson = loadKrdFixtureRaw("WorkoutIndividualSteps.krd");
    const filePath = join(tmpDir, "test.krd");
    await writeFile(filePath, krdJson);

    // Act
    const result = await convertToKrd(filePath, undefined, undefined, logger);

    // Assert
    expect(result.version).toBe("1.0");
  });

  it("should convert TCX text content to KRD", async () => {
    // Arrange
    const tcxContent = loadTcxFixture("WorkoutHeartRateTargets.tcx");

    // Act
    const result = await convertToKrd(undefined, tcxContent, "tcx", logger);

    // Assert
    expect(result.version).toBe("1.0");
    expect(result.type).toBe("structured_workout");
  });

  it("should convert FIT file to KRD", async () => {
    // Arrange
    const fitBuffer = loadFitFixture("WorkoutIndividualSteps.fit");
    const filePath = join(tmpDir, "test.fit");
    await writeFile(filePath, fitBuffer);

    // Act
    const result = await convertToKrd(filePath, undefined, "fit", logger);

    // Assert
    expect(result.version).toBe("1.0");
    expect(result.type).toBe("structured_workout");
  });

  it("should auto-detect format from file extension", async () => {
    // Arrange
    const krdJson = loadKrdFixtureRaw("WorkoutIndividualSteps.krd");
    const filePath = join(tmpDir, "input.krd");
    await writeFile(filePath, krdJson);

    // Act
    const result = await convertToKrd(filePath, undefined, undefined, logger);

    // Assert
    expect(result.version).toBe("1.0");
  });

  it("should throw when format cannot be detected", async () => {
    // Arrange

    // Act

    // Assert
    await expect(
      convertToKrd(undefined, "{}", undefined, logger)
    ).rejects.toThrow("Cannot detect format");
  });

  it("should throw when neither file nor content provided", async () => {
    // Arrange

    // Act

    // Assert
    await expect(
      convertToKrd(undefined, undefined, "krd", logger)
    ).rejects.toThrow("Provide either input_file or input_content");
  });
});
