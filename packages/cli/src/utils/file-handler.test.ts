import type * as FsPromises from "fs/promises";
import { mkdir, rm, writeFile as fsWriteFile } from "fs/promises";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("fs/promises", async (importActual) => {
  const actual = await importActual<typeof FsPromises>();
  return {
    ...actual,
    readFile: vi.fn(actual.readFile),
  };
});

const SAMPLE_BYTES = Array.from(Buffer.from("0102030405", "hex"));
const SHORT_BINARY = Array.from(Buffer.from("010203", "hex"));
const SORTED_FILES_COUNT = SHORT_BINARY.length;

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
    const testData = new Uint8Array(SAMPLE_BYTES);
    await fsWriteFile(filePath, testData);

    // Act
    const result = await readFile(filePath, "fit");

    // Assert
    expect(result).toBeInstanceOf(Uint8Array);
    expect(Array.from(result as Uint8Array)).toEqual(SAMPLE_BYTES);
  });

  // KRD/TCX/ZWO share the single non-FIT text branch in readFile.
  it.each(["krd", "tcx", "zwo"] as const)(
    "should read a %s file as string",
    async (format) => {
      // Arrange
      const filePath = join(TEST_DIR, `test.${format}`);
      const testData = `<sample format="${format}"/>`;
      await fsWriteFile(filePath, testData, "utf-8");

      // Act
      const result = await readFile(filePath, format);

      // Assert
      expect(typeof result).toBe("string");
      expect(result).toBe(testData);
    }
  );

  it("should throw error for missing file", async () => {
    // Arrange

    // Act
    const filePath = join(TEST_DIR, "nonexistent.fit");

    // Assert
    await expect(readFile(filePath, "fit")).rejects.toThrow("File not found");
  });

  it("should throw permission denied error when the OS reports EACCES", async () => {
    // Arrange
    const { readFile: fsReadFile } = await import("fs/promises");
    const filePath = join(TEST_DIR, "protected.fit");
    const eaccesError = Object.assign(new Error("EACCES"), { code: "EACCES" });
    const original = vi.mocked(fsReadFile).getMockImplementation();
    vi.mocked(fsReadFile).mockRejectedValueOnce(eaccesError);

    // Act
    const promise = readFile(filePath, "fit");

    // Assert
    await expect(promise).rejects.toThrow("Permission denied");
    vi.mocked(fsReadFile).mockImplementation(original);
  });

  it("should throw error for path with null bytes", async () => {
    // Arrange

    // Act
    const filePath = "/valid/path\0/injection";

    // Assert
    await expect(readFile(filePath, "krd")).rejects.toThrow(
      "Invalid path: dangerous characters detected"
    );
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
    const testData = new Uint8Array(SAMPLE_BYTES);
    await writeFile(filePath, testData, "fit");

    // Act
    const result = await readFile(filePath, "fit");

    // Assert
    expect(result).toBeInstanceOf(Uint8Array);
    expect(Array.from(result as Uint8Array)).toEqual(SAMPLE_BYTES);
  });

  // KRD/TCX/ZWO share the single non-FIT text branch in writeFile.
  it.each(["krd", "tcx", "zwo"] as const)(
    "should write a %s file from string",
    async (format) => {
      // Arrange
      const filePath = join(TEST_DIR, `output.${format}`);
      const testData = `<sample format="${format}"/>`;
      await writeFile(filePath, testData, format);

      // Act
      const result = await readFile(filePath, format);

      // Assert
      expect(typeof result).toBe("string");
      expect(result).toBe(testData);
    }
  );

  it("should create directories if they don't exist", async () => {
    // Arrange
    const filePath = join(TEST_DIR, "nested", "dir", "output.krd");
    const testData = '{"version":"1.0"}';
    await writeFile(filePath, testData, "krd");

    // Act
    const result = await readFile(filePath, "krd");

    // Assert
    expect(result).toBe(testData);
  });

  it("should throw error when writing FIT with string data", async () => {
    // Arrange
    const filePath = join(TEST_DIR, "output.fit");

    // Act
    const testData = "invalid string data";

    // Assert
    await expect(writeFile(filePath, testData, "fit")).rejects.toThrow(
      "FIT files require Uint8Array data"
    );
  });

  it("should throw error when writing text file with Uint8Array", async () => {
    // Arrange
    const filePath = join(TEST_DIR, "output.krd");

    // Act
    const testData = new Uint8Array(SHORT_BINARY);

    // Assert
    await expect(writeFile(filePath, testData, "krd")).rejects.toThrow(
      "Text files require string data"
    );
  });

  it("should throw error for path with shell metacharacters", async () => {
    // Arrange

    // Act
    const filePath = "path;rm -rf /";

    // Assert
    await expect(writeFile(filePath, "data", "krd")).rejects.toThrow(
      "Invalid path: dangerous characters detected"
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
    expect(result).toHaveLength(SORTED_FILES_COUNT);
    expect(result[0]).toContain("a.fit");
    expect(result[1]).toContain("b.fit");
    expect(result[2]).toContain("c.fit");
  });

  it("should return empty array when no files match", async () => {
    // Arrange

    // Act
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
