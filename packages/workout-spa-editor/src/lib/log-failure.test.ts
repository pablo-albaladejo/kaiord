import { afterEach, describe, expect, it, vi } from "vitest";

import { logFailure } from "./log-failure";

describe("logFailure", () => {
  afterEach(() => vi.restoreAllMocks());

  it("should log the failure's name and text under a static first argument", () => {
    // Arrange
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Act
    logFailure("library-delete", new TypeError("Quota exceeded"));

    // Assert
    expect(spy).toHaveBeenCalledWith("[failure]", {
      where: "library-delete",
      name: "TypeError",
      message: "Quota exceeded",
    });
  });

  it("should scrub an email out of the logged text", () => {
    // Arrange
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Act
    logFailure("connect", "rejected for ana@example.com");

    // Assert
    const [, context] = spy.mock.calls[0];
    expect(JSON.stringify(context)).not.toContain("ana@example.com");
  });
});
