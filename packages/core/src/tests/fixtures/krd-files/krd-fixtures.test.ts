import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { krdSchema } from "../../../domain/schemas/krd";

const KRD_FILES_DIR = join(__dirname);

describe("KRD Fixtures", () => {
  const krdFiles = readdirSync(KRD_FILES_DIR).filter((file) =>
    file.endsWith(".krd")
  );

  it("should have at least one KRD fixture", () => {
    expect(krdFiles.length).toBeGreaterThan(0);
  });

  describe.each(krdFiles)("%s", (krdFile) => {
    it("should be valid JSON", () => {
      // Arrange
      const krdPath = join(KRD_FILES_DIR, krdFile);
      const content = readFileSync(krdPath, "utf-8");

      // Act & Assert
      expect(() => JSON.parse(content)).not.toThrow();
    });

    it("should validate against KRD schema", () => {
      // Arrange
      const krdPath = join(KRD_FILES_DIR, krdFile);
      const content = readFileSync(krdPath, "utf-8");
      const krd = JSON.parse(content);

      // Act
      const result = krdSchema.safeParse(krd);

      // Assert
      if (!result.success) {
        console.error(`Validation errors for ${krdFile}:`, result.error.errors);
      }
      expect(result.success).toBe(true);
    });

    it("should have required top-level fields", () => {
      // Arrange
      const krdPath = join(KRD_FILES_DIR, krdFile);
      const content = readFileSync(krdPath, "utf-8");
      const krd = JSON.parse(content);

      // Assert
      expect(krd).toHaveProperty("version");
      expect(krd).toHaveProperty("type");
      expect(krd).toHaveProperty("metadata");
      expect(krd.version).toBe("1.0");
      expect(krd.type).toBe("workout");
    });

    it("should have valid metadata", () => {
      // Arrange
      const krdPath = join(KRD_FILES_DIR, krdFile);
      const content = readFileSync(krdPath, "utf-8");
      const krd = JSON.parse(content);

      // Assert
      expect(krd.metadata).toHaveProperty("created");
      expect(krd.metadata).toHaveProperty("sport");
      expect(krd.metadata.created).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
      );
    });
  });
});
