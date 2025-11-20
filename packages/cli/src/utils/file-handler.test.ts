import { writeFile as fsWriteFile, mkdir, rm } from "fs/promises";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { findFiles, readFile, writeFile } from "./file-handler";

const TEST_DIR = join(process.cwd(), "test-temp");

describe("readFile", () => {
  beforeEach(async () => {
    await mkdir(TEST_DIR, { recursive: true });
  });

  afterEach(async () => {
    await rm(TEST_DIR, { recursive: true, force: true });
  });

  it("should read binary FIT file as Uint8Array", async () => {
    // Arrange
    const filePath = join(TEST_DIR, "test.fit");
    const testData = new Uint8Array([1, 2, 3, 4, 5]);
    await fsWriteFile(filePath, testData);

    // Act
    const result = await readFile(filePath, "fit");

    // Assert
    expect(result).toBeInstanceOf(Uint8Array);
    expect(Array.from(result as Uint8Array)).toEqual([1, 2, 3, 4, 5]);
  });

  it("should read KRD file as string", async () => {
    // Arrange
    const filePath = join(TEST_DIR, "test.krd");
    const testData = '{"version":"1.0","type":"workout"}';
    await fsWriteFile(filePath, testData, "utf-8");

    // Act
    const result = await readFile(filePath, "krd");

    // Assert
    expect(typeof result).toBe("string");
    expect(result).toBe(testData);
  });

  it("should read TCX file as string", async () => {
    // Arrange
    const filePath = join(TEST_DIR, "test.tcx");
    const testData = '<?xml version="1.0"?><TrainingCenterDatabase/>';
    await fsWriteFile(filePath, testData, "utf-8");

    // Act
    const result = await readFile(filePath, "tcx");

    // Assert
    expect(typeof result).toBe("string");
    expect(result).toBe(testData);
  });

  it("should read ZWO file as string", async () => {
    // Arrange
    const filePath = join(TEST_DIR, "test.zwo");
    const testData = '<?xml version="1.0"?><workout_file/>';
    await fsWriteFile(filePath, testData, "utf-8");

    // Act
    const result = await readFile(filePath, "zwo");

    // Assert
    expect(typeof result).toBe("string");
    expect(result).toBe(testData);
  });

  it("should throw error for missing file", async () => {
    // Arrange
    const filePath = join(TEST_DIR, "nonexistent.fit");

    // Act & Assert
    await expect(readFile(filePath, "fit")).rejects.toThrow("File not found");
  });

  it("should throw error for permission denied", async () => {
    // Arrange
    const filePath = "/root/protected.fit";

    // Act & Assert
    await expect(readFile(filePath, "fit")).rejects.toThrow();
  });
});

describe("writeFile", () => {
  beforeEach(async () => {
    await mkdir(TEST_DIR, { recursive: true });
  });

  afterEach(async () => {
    await rm(TEST_DIR, { recursive: true, force: true });
  });

  it("should write binary FIT file from Uint8Array", async () => {
    // Arrange
    const filePath = join(TEST_DIR, "output.fit");
    const testData = new Uint8Array([1, 2, 3, 4, 5]);

    // Act
    await writeFile(filePath, testData, "fit");

    // Assert
    const result = await readFile(filePath, "fit");
    expect(result).toBeInstanceOf(Uint8Array);
    expect(Array.from(result as Uint8Array)).toEqual([1, 2, 3, 4, 5]);
  });

  it("should write KRD file from string", async () => {
    // Arrange
    const filePath = join(TEST_DIR, "output.krd");
    const testData = '{"version":"1.0","type":"workout"}';

    // Act
    await writeFile(filePath, testData, "krd");

    // Assert
    const result = await readFile(filePath, "krd");
    expect(typeof result).toBe("string");
    expect(result).toBe(testData);
  });

  it("should write TCX file from string", async () => {
    // Arrange
    const filePath = join(TEST_DIR, "output.tcx");
    const testData = '<?xml version="1.0"?><TrainingCenterDatabase/>';

    // Act
    await writeFile(filePath, testData, "tcx");

    // Assert
    const result = await readFile(filePath, "tcx");
    expect(typeof result).toBe("string");
    expect(result).toBe(testData);
  });

  it("should write ZWO file from string", async () => {
    // Arrange
    const filePath = join(TEST_DIR, "output.zwo");
    const testData = '<?xml version="1.0"?><workout_file/>';

    // Act
    await writeFile(filePath, testData, "zwo");

    // Assert
    const result = await readFile(filePath, "zwo");
    expect(typeof result).toBe("string");
    expect(result).toBe(testData);
  });

  it("should create directories if they don't exist", async () => {
    // Arrange
    const filePath = join(TEST_DIR, "nested", "dir", "output.krd");
    const testData = '{"version":"1.0"}';

    // Act
    await writeFile(filePath, testData, "krd");

    // Assert
    const result = await readFile(filePath, "krd");
    expect(result).toBe(testData);
  });

  it("should throw error when writing FIT with string data", async () => {
    // Arrange
    const filePath = join(TEST_DIR, "output.fit");
    const testData = "invalid string data";

    // Act & Assert
    await expect(writeFile(filePath, testData, "fit")).rejects.toThrow(
      "FIT files require Uint8Array data"
    );
  });

  it("should throw error when writing text file with Uint8Array", async () => {
    // Arrange
    const filePath = join(TEST_DIR, "output.krd");
    const testData = new Uint8Array([1, 2, 3]);

    // Act & Assert
    await expect(writeFile(filePath, testData, "krd")).rejects.toThrow(
      "Text files require string data"
    );
  });
});

describe("findFiles", () => {
  beforeEach(async () => {
    await mkdir(TEST_DIR, { recursive: true });
  });

  afterEach(async () => {
    await rm(TEST_DIR, { recursive: true, force: true });
  });

  it("should find files matching glob pattern", async () => {
    // Arrange
    await fsWriteFile(join(TEST_DIR, "workout1.fit"), "");
    await fsWriteFile(join(TEST_DIR, "workout2.fit"), "");
    await fsWriteFile(join(TEST_DIR, "workout3.krd"), "");

    // Act
    const result = await findFiles(join(TEST_DIR, "*.fit"));

    // Assert
    expect(result).toHaveLength(2);
    expect(result[0]).toContain("workout1.fit");
    expect(result[1]).toContain("workout2.fit");
  });

  it("should return sorted file list", async () => {
    // Arrange
    await fsWriteFile(join(TEST_DIR, "c.fit"), "");
    await fsWriteFile(join(TEST_DIR, "a.fit"), "");
    await fsWriteFile(join(TEST_DIR, "b.fit"), "");

    // Act
    const result = await findFiles(join(TEST_DIR, "*.fit"));

    // Assert
    expect(result).toHaveLength(3);
    expect(result[0]).toContain("a.fit");
    expect(result[1]).toContain("b.fit");
    expect(result[2]).toContain("c.fit");
  });

  it("should return empty array when no files match", async () => {
    // Arrange & Act
    const result = await findFiles(join(TEST_DIR, "*.fit"));

    // Assert
    expect(result).toEqual([]);
  });

  it("should handle nested directory patterns", async () => {
    // Arrange
    await mkdir(join(TEST_DIR, "subdir"), { recursive: true });
    await fsWriteFile(join(TEST_DIR, "workout1.fit"), "");
    await fsWriteFile(join(TEST_DIR, "subdir", "workout2.fit"), "");

    // Act
    const result = await findFiles(join(TEST_DIR, "**/*.fit"));

    // Assert
    expect(result).toHaveLength(2);
    expect(result.some((f) => f.includes("workout1.fit"))).toBe(true);
    expect(result.some((f) => f.includes("workout2.fit"))).toBe(true);
  });

  it("should not include directories in results", async () => {
    // Arrange
    await mkdir(join(TEST_DIR, "subdir.fit"), { recursive: true });
    await fsWriteFile(join(TEST_DIR, "file.fit"), "");

    // Act
    const result = await findFiles(join(TEST_DIR, "*.fit"));

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0]).toContain("file.fit");
  });
});
