import { beforeEach, describe, expect, it } from "vitest";

const {
  report,
  extractBearer,
  resetDedup,
  TARGET_ORIGIN,
} = require("../inject-main.js");

describe("inject-main.js token capture", () => {
  beforeEach(() => {
    __resetChromeMock();
    resetDedup();
  });

  it("should post the extracted bearer to the WHOOP page origin, not a wildcard", () => {
    // Arrange
    const header = "bearer abc.def.ghi";

    // Act
    report(header);

    // Assert
    expect(TARGET_ORIGIN).toBe("https://app.whoop.com");
    expect(window.postMessage).toHaveBeenCalledWith(
      { __whoopPoc: "token", token: "abc.def.ghi" },
      "https://app.whoop.com"
    );
  });

  it("should dedupe repeated tokens and only post distinct ones", () => {
    // Arrange

    // Act
    report("bearer same");
    report("bearer same");
    report("Bearer another");

    // Assert
    expect(window.postMessage).toHaveBeenCalledTimes(2);
  });

  it("should ignore non-bearer, empty, and null authorization values", () => {
    // Arrange

    // Act
    report("Basic Zm9vOmJhcg==");
    report("");
    report(null);

    // Assert
    expect(window.postMessage).not.toHaveBeenCalled();
  });

  it("should strip the bearer prefix case-insensitively", () => {
    // Arrange

    // Act
    const token = extractBearer("Bearer XYZ.123");

    // Assert
    expect(token).toBe("XYZ.123");
  });
});
