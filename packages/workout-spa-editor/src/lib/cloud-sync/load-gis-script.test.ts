import { afterEach, describe, expect, it, vi } from "vitest";

import { GIS_SCRIPT_SRC } from "./google-oauth-config";
import { loadGisScript } from "./load-gis-script";

afterEach(() => {
  document.head.querySelectorAll("script").forEach((s) => s.remove());
  vi.restoreAllMocks();
});

describe("loadGisScript", () => {
  it("should resolve immediately when google.accounts is already present", async () => {
    // Arrange
    const win = window as unknown as { google?: { accounts: unknown } };
    win.google = { accounts: {} };

    // Act
    await loadGisScript();
    const scripts = document.head.querySelectorAll("script");

    // Assert
    expect(scripts.length).toBe(0);
    delete win.google;
  });

  it("should append the GIS script once and resolve on load", async () => {
    // Arrange
    const appendSpy = vi.spyOn(document.head, "appendChild");

    // Act
    const promise = loadGisScript();
    const script = appendSpy.mock.calls[0][0] as HTMLScriptElement;
    script.onload?.(new Event("load"));
    await promise;

    // Assert
    expect(script.src).toBe(GIS_SCRIPT_SRC);
    expect(appendSpy).toHaveBeenCalledTimes(1);
  });

  it("should reject when the script fails to load", async () => {
    // Arrange
    const appendSpy = vi.spyOn(document.head, "appendChild");

    // Act
    const promise = loadGisScript();
    const script = appendSpy.mock.calls[0][0] as HTMLScriptElement;
    script.onerror?.(new Event("error"));

    // Assert
    await expect(promise).rejects.toThrow();
  });
});
