import { writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { mkdtemp, rm } from "fs/promises";
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  readFileAsBuffer,
  readFileAsText,
  validatePathSecurity,
  writeOutputFile,
} from "./file-io";

describe("validatePathSecurity", () => {
  it("should accept valid paths", () => {
    expect(() => validatePathSecurity("/valid/path.fit")).not.toThrow();
    expect(() => validatePathSecurity("relative/path.tcx")).not.toThrow();
  });

  it("should reject paths with null bytes", () => {
    expect(() => validatePathSecurity("/path\0/file")).toThrow(
      "dangerous characters"
    );
  });

  it.each(["|", ";", "&", "`", "$", "(", ")", "{", "}", "!", "\n", "\r"])(
    "should reject paths with dangerous character: %s",
    (char) => {
      expect(() => validatePathSecurity(`/path${char}cmd`)).toThrow(
        "dangerous characters"
      );
    }
  );

  it.each(["../../etc/passwd", "/foo/../bar", "..\\windows\\system32"])(
    "should reject path traversal: %s",
    (path) => {
      expect(() => validatePathSecurity(path)).toThrow("directory traversal");
    }
  );

  it("should accept paths with double dots in filenames", () => {
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
    const filePath = join(tempDir, "test.txt");
    await writeFile(filePath, "hello world", "utf-8");

    const result = await readFileAsText(filePath);

    expect(result).toBe("hello world");
  });

  it("should read file as buffer", async () => {
    const filePath = join(tempDir, "test.bin");
    const data = new Uint8Array([1, 2, 3, 4]);
    await writeFile(filePath, data);

    const result = await readFileAsBuffer(filePath);

    expect(result).toEqual(new Uint8Array([1, 2, 3, 4]));
  });

  it("should throw for non-existent files", async () => {
    await expect(readFileAsText("/nonexistent/path.txt")).rejects.toThrow(
      "File not found"
    );
  });

  it("should write text output file", async () => {
    const filePath = join(tempDir, "output.txt");

    await writeOutputFile(filePath, "output content");

    const content = await readFileAsText(filePath);
    expect(content).toBe("output content");
  });

  it("should write binary output file", async () => {
    const filePath = join(tempDir, "output.bin");
    const data = new Uint8Array([5, 6, 7, 8]);

    await writeOutputFile(filePath, data);

    const content = await readFileAsBuffer(filePath);
    expect(content).toEqual(new Uint8Array([5, 6, 7, 8]));
  });

  it("should create nested directories for output", async () => {
    const filePath = join(tempDir, "nested", "dir", "output.txt");

    await writeOutputFile(filePath, "nested content");

    const content = await readFileAsText(filePath);
    expect(content).toBe("nested content");
  });
});
