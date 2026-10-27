import { beforeEach, describe, expect, it } from "vitest";

import { isSyncConnected, setSyncConnected } from "./sync-connected-pref";

describe("sync-connected-pref", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should report not connected by default", () => {
    // Arrange

    // Act
    const result = isSyncConnected();

    // Assert
    expect(result).toBe(false);
  });

  it("should remember a connection and forget it on disconnect", () => {
    // Arrange
    setSyncConnected(true);
    const before = isSyncConnected();

    // Act
    setSyncConnected(false);

    // Assert
    expect(before).toBe(true);
    expect(isSyncConnected()).toBe(false);
  });
});
