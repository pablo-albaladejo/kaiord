import { describe, expect, it } from "vitest";

import { isChunkLoadError } from "./chunk-reload";
import { lazyImport } from "./lazy-import";

describe("lazyImport", () => {
  it("should resolve the loaded module", async () => {
    // Arrange
    const module = { answer: 42 };

    // Act
    const loaded = await lazyImport(() => Promise.resolve(module));

    // Assert
    expect(loaded).toBe(module);
  });

  it("should reject when stale-chunk recovery swallowed the failure", async () => {
    // Arrange
    // `vite:preloadError` is prevented in main.tsx, so a failed import whose
    // reload is held back resolves to undefined instead of rejecting.
    const swallowed = () => Promise.resolve(undefined as unknown as object);

    // Act
    const loading = lazyImport(swallowed);

    // Assert
    await expect(loading).rejects.toThrow("lazy import failed");
  });

  it("should reject with an error the chunk-error handling recognises", async () => {
    // Arrange
    const swallowed = () => Promise.resolve(undefined as unknown as object);

    // Act
    const error = await lazyImport(swallowed).catch((e: unknown) => e);

    // Assert
    expect(isChunkLoadError(error)).toBe(true);
  });

  it("should reject when the import rejects", async () => {
    // Arrange
    const failing = () => Promise.reject(new Error("chunk 404"));

    // Act
    const loading = lazyImport(failing);

    // Assert
    await expect(loading).rejects.toThrow("chunk 404");
  });
});
