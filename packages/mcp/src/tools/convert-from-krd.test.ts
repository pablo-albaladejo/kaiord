import { createMockLogger } from "@kaiord/core/test-utils";
import { createFitReader } from "@kaiord/fit";
import { mkdtemp, readFile, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { loadKrdFixture } from "../tests/helpers/test-fixtures";
import type { FileFormat } from "../types/tool-schemas";
import { decodeBase64 } from "../utils/base64";
import { BASE64_HEADER, convertFromKrd } from "./convert-from-krd";

describe("convertFromKrd", () => {
  let tmpDir: string;
  const logger = createMockLogger();
  const krd = loadKrdFixture("WorkoutIndividualSteps.krd");

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "mcp-convert-from-"));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true });
  });

  it("should convert KRD to TCX text", async () => {
    // Arrange

    // Act
    const result = await convertFromKrd(krd, "tcx", undefined, { logger });

    // Assert
    expect(result.content).toContain("TrainingCenterDatabase");
    expect(result.writtenTo).toBeNull();
  });

  it("should convert KRD to KRD JSON text", async () => {
    // Arrange
    const result = await convertFromKrd(krd, "krd", undefined, { logger });

    // Act
    const parsed = JSON.parse(result.content);

    // Assert
    expect(parsed.version).toBe("1.0");
    expect(result.writtenTo).toBeNull();
  });

  it("should write text output file when path provided", async () => {
    // Arrange
    const outPath = join(tmpDir, "output.tcx");
    const result = await convertFromKrd(krd, "tcx", outPath, { logger });
    expect(result.writtenTo).toBe(outPath);

    // Act
    const written = await readFile(outPath, "utf-8");

    // Assert
    expect(written).toContain("TrainingCenterDatabase");
  });

  it("should return base64 FIT text that decodes back when output_file is omitted", async () => {
    // Arrange
    const reader = createFitReader(logger);

    // Act
    const result = await convertFromKrd(krd, "fit", undefined, { logger });
    const [header, encoded] = result.content.split("\n");
    const decoded = await reader(decodeBase64(encoded));

    // Assert
    expect(header).toContain(BASE64_HEADER);
    expect(result.writtenTo).toBeNull();
    expect(decoded.extensions?.structured_workout).toEqual(
      krd.extensions?.structured_workout
    );
  });

  it("should write FIT binary output", async () => {
    // Arrange
    const outPath = join(tmpDir, "output.fit");
    const result = await convertFromKrd(krd, "fit", outPath, { logger });
    expect(result.writtenTo).toBe(outPath);

    // Act
    const buffer = await readFile(outPath);

    // Assert
    expect(buffer.length).toBeGreaterThan(0);
  });

  it("should reject an unsupported output format", async () => {
    // Arrange
    const unsupported = "xyz" as FileFormat;

    // Act
    const attempt = convertFromKrd(krd, unsupported, undefined, { logger });

    // Assert
    await expect(attempt).rejects.toThrow("Unsupported output format: xyz");
  });
});
