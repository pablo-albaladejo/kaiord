import { writeFile } from "fs/promises";
import { mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  readFileAsBuffer,
  readFileAsText,
  validatePathSecurity,
  writeOutputFile,
} from "./file-io";

describe("validatePathSecurity", () => {
  it("should accept valid paths", () => {
    // Arrange

    // Act

    // Assert
    expect(() => validatePathSecurity("/valid/path.fit")).not.toThrow();
    expect(() => validatePathSecurity("relative/path.tcx")).not.toThrow();
  });

  it("should reject paths with null bytes", () => {
    // Arrange

    // Act

    // Assert
    expect(() => validatePathSecurity("/path\0/file")).toThrow(
      "dangerous characters"
    );
  });

  it.each(["|", ";", "&", "`", "$", "(", ")", "{", "}", "!", "\n", "\r"])(
    "should reject paths with dangerous character: %s",
    (char) => {
      // Arrange

      // Act

      // Assert
      expect(() => validatePathSecurity(`/path${char}cmd`)).toThrow(
        "dangerous characters"
      );
    }
  );

  it.each(["../../etc/passwd", "/foo/../bar", "..\\windows\\system32"])(
    "should reject path traversal: %s",
    (path) => {
      // Arrange

      // Act

      // Assert
      expect(() => validatePathSecurity(path)).toThrow("directory traversal");
    }
  );

  it("should accept paths with double dots in filenames", () => {
    // Arrange

    // Act

    // Assert
    expect(() => validatePathSecurity("/path/file..name.txt")).not.toThrow();
  });
});

describe("file read/write operations", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "mcp-test-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("should read file as text", async () => {
    // Arrange
    const filePath = join(tempDir, "test.txt");
    await writeFile(filePath, "hello world", "utf-8");

    // Act
    const result = await readFileAsText(filePath);

    // Assert
    expect(result).toBe("hello world");
  });

  it("should read file as buffer", async () => {
    // Arrange
    const filePath = join(tempDir, "test.bin");
    const data = new Uint8Array([1, 2, 3, 4]);
    await writeFile(filePath, data);

    // Act
    const result = await readFileAsBuffer(filePath);

    // Assert
    expect(result).toEqual(new Uint8Array([1, 2, 3, 4]));
  });

  it("should throw for non-existent files", async () => {
    // Arrange

    // Act

    // Assert
    await expect(readFileAsText("/nonexistent/path.txt")).rejects.toThrow(
      "File not found"
    );
  });

  it("should write text output file", async () => {
    // Arrange
    const filePath = join(tempDir, "output.txt");
    await writeOutputFile(filePath, "output content");

    // Act
    const content = await readFileAsText(filePath);

    // Assert
    expect(content).toBe("output content");
  });

  it("should write binary output file", async () => {
    // Arrange
    const filePath = join(tempDir, "output.bin");
    const data = new Uint8Array([5, 6, 7, 8]);
    await writeOutputFile(filePath, data);

    // Act
    const content = await readFileAsBuffer(filePath);

    // Assert
    expect(content).toEqual(new Uint8Array([5, 6, 7, 8]));
  });

  it("should create nested directories for output", async () => {
    // Arrange
    const filePath = join(tempDir, "nested", "dir", "output.txt");
    await writeOutputFile(filePath, "nested content");

    // Act
    const content = await readFileAsText(filePath);

    // Assert
    expect(content).toBe("nested content");
  });
});
