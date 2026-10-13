import { afterEach, describe, expect, it, vi } from "vitest";

import { clearDeviceStorage } from "./wipe-device";

describe("clearDeviceStorage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  it("should remove every key of local and session storage", () => {
    // Arrange
    localStorage.setItem("kaiord-device-preferences", "{}");
    localStorage.setItem("workout-editor-theme", "dark");
    localStorage.setItem("kaiord_secure_secret", "x");
    sessionStorage.setItem("kaiord-chunk-reload-at", "1");

    // Act
    clearDeviceStorage();

    // Assert
    expect(localStorage).toHaveLength(0);
    expect(sessionStorage).toHaveLength(0);
  });

  it("should still clear session storage when local storage throws", () => {
    // Arrange
    sessionStorage.setItem("k", "v");
    vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });

    // Act
    const run = () => clearDeviceStorage();

    // Assert
    expect(run).not.toThrow();
    expect(sessionStorage).toHaveLength(0);
  });
});
