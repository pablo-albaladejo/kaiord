import { createRequire } from "node:module";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

const nodeRequire = createRequire(import.meta.url);
const root = path.resolve(__dirname, "..");
const BACKGROUND = path.join(root, "background.js");
const PERSONAL = path.join(root, "personal-fields.js");

/** background.js loaded afresh with `personal-fields.js` not loadable: the
    worker's `importScripts` throws, and its fallback is an empty object. */
const loadWithoutPersonalFields = () => {
  delete nodeRequire.cache[BACKGROUND];
  nodeRequire.cache[PERSONAL] = {
    id: PERSONAL,
    filename: PERSONAL,
    loaded: true,
    exports: {},
  };
  return nodeRequire(BACKGROUND);
};

afterEach(() => {
  delete nodeRequire.cache[PERSONAL];
  delete nodeRequire.cache[BACKGROUND];
  vi.unstubAllGlobals();
});

describe("personal fields that do not load", () => {
  it("should fail the request and ask nothing of Tanita", async () => {
    // Arrange
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const { request } = loadWithoutPersonalFields();

    // Act
    const answering = request({
      action: "request",
      method: "GET",
      path: "/not-a-listed-path",
    });

    // Assert
    await expect(answering).rejects.toThrow("Personal fields not loaded");
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
