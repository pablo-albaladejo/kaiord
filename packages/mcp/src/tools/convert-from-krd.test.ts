import { mkdtemp, readFile, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createMockLogger } from "@kaiord/core/test-utils";
import { loadKrdFixture } from "../tests/helpers/test-fixtures";
import { convertFromKrd } from "./convert-from-krd";

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
    const result = await convertFromKrd(krd, "tcx", undefined, logger);

    expect(result.content).toContain("TrainingCenterDatabase");
    expect(result.writtenTo).toBeNull();
  });

  it("should convert KRD to KRD JSON text", async () => {
    const result = await convertFromKrd(krd, "krd", undefined, logger);

    const parsed = JSON.parse(result.content);
    expect(parsed.version).toBe("1.0");
    expect(result.writtenTo).toBeNull();
  });

  it("should write text output file when path provided", async () => {
    const outPath = join(tmpDir, "output.tcx");

    const result = await convertFromKrd(krd, "tcx", outPath, logger);

    expect(result.writtenTo).toBe(outPath);
    const written = await readFile(outPath, "utf-8");
    expect(written).toContain("TrainingCenterDatabase");
  });

  it("should throw when output_file missing for binary FIT format", async () => {
    await expect(convertFromKrd(krd, "fit", undefined, logger)).rejects.toThrow(
      "output_file is required for binary format"
    );
  });

  it("should write FIT binary output", async () => {
    const outPath = join(tmpDir, "output.fit");

    const result = await convertFromKrd(krd, "fit", outPath, logger);

    expect(result.writtenTo).toBe(outPath);
    const buffer = await readFile(outPath);
    expect(buffer.length).toBeGreaterThan(0);
  });
});
